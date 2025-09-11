import { DuckDBInstance } from "@duckdb/node-api";
import { NextRequest, NextResponse } from "next/server";
import { usrnSchema } from "@/lib/validation";

let requestCount = 0;
let windowStart = Date.now();
let cachedInstance: DuckDBInstance | null = null;

interface PostcodeGroup {
  postcode: string;
  count: number;
  gigabit_ready: number;
  future_gigabit: number;
}

async function getDuckDBInstance() {
  if (!cachedInstance) {
    process.env.HOME = "/tmp";

    try {
      const connectionString = `md:${process.env.MOTHERDUCK_DB_2}?motherduck_token=${process.env.MOTHERDUCK_TOKEN}`;
      cachedInstance = await DuckDBInstance.create(connectionString);
    } catch (error) {
      console.error("Failed to create DuckDB instance:", error);
      throw new Error("Database connection failed");
    }
  }
  return cachedInstance;
}

function rateLimit(maxRequests = 20, windowMs = 30 * 60 * 1000): boolean {
  const now = Date.now();

  if (now - windowStart >= windowMs) {
    console.log("Rate limit window reset");
    requestCount = 0;
    windowStart = now;
  }

  if (requestCount >= maxRequests) {
    console.log("Rate limit exceeded!");
    return false;
  }

  requestCount++;
  return true;
}

export async function POST(request: NextRequest) {
  if (!rateLimit(20, 30 * 60 * 1000)) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please try again later.",
      },
      { status: 429 },
    );
  }
  try {
    const body = await request.json();

    const validationResult = usrnSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            validationResult.error.errors[0]?.message || "Invalid USRN format",
        },
        { status: 400 },
      );
    }

    const { usrn, password } = validationResult.data;

    if (password !== process.env.USRN_ACCESS_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid access password",
        },
        { status: 401 },
      );
    }

    const instance = await getDuckDBInstance();
    const connection = await instance.connect();

    const bdukTable = process.env.BDUK_TABLE;
    const osTable = process.env.OS_IDENTIFIERS_TABLE;
    try {
      // Query to get BDUK premises data for the given USRN
      const result = await connection.runAndReadAll(
        `
        SELECT
          bduk.uprn,
          bduk.postcode,
          bduk.country,
          bduk.local_authority_district_ons AS local_authority,
          bduk.region_ons AS region,
          bduk.current_gigabit,
          bduk.future_gigabit,
          bduk.lot_name,
          bduk.subsidy_control_status,
          usrn.identifier_2 AS usrn,
          COUNT(*) OVER() as total_count
          FROM ${bdukTable} bduk
          LEFT JOIN ${osTable} usrn
          ON bduk.uprn = usrn.identifier_1
        WHERE usrn.identifier_2 = ?;
        `,
        [parseInt(usrn)],
      );

      const rows = result.getRowObjects();

      if (!rows || rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No data found for this USRN",
          },
          { status: 404 },
        );
      }

      const premises = [];
      const totalCount =
        typeof rows[0]?.total_count === "bigint"
          ? Number(rows[0].total_count)
          : rows[0]?.total_count || 0;

      for (const row of rows) {
        premises.push({
          uprn: row.uprn?.toString(),
          postcode: row.postcode?.toString(),
          country: row.country?.toString(),
          local_authority: row.local_authority?.toString(),
          region: row.region?.toString(),
          current_gigabit: Boolean(row.current_gigabit),
          future_gigabit: Boolean(row.future_gigabit),
          lot_name: row.lot_name?.toString(),
          subsidy_control_status: row.subsidy_control_status?.toString(),
        });
      }

      const postcodeGroups = premises.reduce(
        (acc, premise) => {
          const pc = premise.postcode || "Unknown";
          if (!acc[pc]) {
            acc[pc] = {
              postcode: pc,
              count: 0,
              gigabit_ready: 0,
              future_gigabit: 0,
            };
          }
          acc[pc].count++;
          if (premise.current_gigabit) acc[pc].gigabit_ready++;
          if (premise.future_gigabit) acc[pc].future_gigabit++;
          return acc;
        },
        {} as Record<string, PostcodeGroup>,
      );

      return NextResponse.json({
        success: true,
        data: {
          usrn: usrn,
          total_premises: totalCount,
          showing: premises.length,
          summary: {
            postcodes: Object.values(postcodeGroups),
            total_gigabit_ready: premises.filter((p) => p.current_gigabit)
              .length,
            total_future_gigabit: premises.filter((p) => p.future_gigabit)
              .length,
            region: premises[0]?.region,
            local_authority: premises[0]?.local_authority,
          },
          premises: premises,
        },
      });
    } finally {
      connection.closeSync();
    }
  } catch (error) {
    console.error("USRN lookup failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to lookup USRN data",
      },
      { status: 500 },
    );
  }
}
