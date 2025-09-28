import { DuckDBInstance } from "@duckdb/node-api";
import { NextRequest, NextResponse } from "next/server";
import { usrnSchema } from "@/lib/validation";
import { handleCors, validateOrigin } from "../middleware/cors";

let requestCount = 0;
let windowStart = Date.now();
let cachedInstance: DuckDBInstance | null = null;

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX!);
const RATE_LIMIT_WINDOW =
  parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES!) * 60 * 1000;

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
    } catch {
      console.error("Failed to create DuckDB instance:");
      throw new Error("Database connection failed");
    }
  }
  return cachedInstance;
}

function getRateLimitStatus() {
  const now = Date.now();
  const timeElapsed = now - windowStart;

  if (timeElapsed >= RATE_LIMIT_WINDOW) {
    requestCount = 0;
    windowStart = now;
    return {
      current: 0,
      max: RATE_LIMIT_MAX,
      resetIn: RATE_LIMIT_WINDOW,
    };
  }

  return {
    current: requestCount,
    max: RATE_LIMIT_MAX,
    resetIn: RATE_LIMIT_WINDOW - timeElapsed,
  };
}

function rateLimit(): boolean {
  const now = Date.now();

  if (now - windowStart >= RATE_LIMIT_WINDOW) {
    console.log("Rate limit window reset");
    requestCount = 0;
    windowStart = now;
  }

  if (requestCount >= RATE_LIMIT_MAX) {
    console.log("Rate limit exceeded!");
    return false;
  }

  requestCount++;
  return true;
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = handleCors(request);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const corsHeaders = handleCors(request);

  if (process.env.DISABLE_USRN_SEARCH === 'true') {
    return NextResponse.json(
      { success: false, message: "Service unavailable" },
      { status: 503, headers: corsHeaders }
    );
  }

  if (!validateOrigin(request)) {
    return NextResponse.json(
      { success: false, message: "Request Failed" },
      { status: 403 },
    );
  }

  if (!rateLimit()) {
    return NextResponse.json(
      {
        success: false,
        message: "Service temporarily unavailable",
      },
      { status: 429 },
    );
  }
  try {
    const { searchParams } = new URL(request.url);
    const usrn = searchParams.get('usrn');

    if (!usrn) {
      return NextResponse.json(
        {
          success: false,
          message: "USRN parameter is required",
        },
        { status: 400 },
      );
    }

    const validationResult = usrnSchema.safeParse({ usrn });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid USRN format",
        },
        { status: 400 },
      );
    }

    const instance = await getDuckDBInstance();
    const connection = await instance.connect();

    const bdukTable = process.env.BDUK_TABLE;
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
          COUNT(*) OVER() as total_count
          FROM ${bdukTable} bduk
        WHERE bduk.usrn = ?;
        `,
        [parseInt(usrn)],
      );

      const rows = result.getRowObjects();

      if (!rows || rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Request Failed",
          },
          { status: 400 },
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

      const rateLimitStatus = getRateLimitStatus();

      return NextResponse.json(
        {
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
          rateLimit: rateLimitStatus,
        },
        { headers: corsHeaders },
      );
    } finally {
      connection.closeSync();
    }
  } catch {
    console.error("Request Failed");

    return NextResponse.json(
      {
        success: false,
        message: "Request Failed",
      },
      { status: 500 },
    );
  }
}
