import { DuckDBInstance } from "@duckdb/node-api";
import { NextRequest, NextResponse } from "next/server";
import { submissionSchema } from "@/lib/validation";
import { handleCors, validateOrigin } from "../middleware/cors";

let requestCount = 0;
let windowStart = Date.now();
let cachedInstance: DuckDBInstance | null = null;

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX!) || 30;
const RATE_LIMIT_WINDOW =
  parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES!) * 60 * 1000 ||
  30 * 60 * 1000;

async function getDuckDBInstance() {
  if (!cachedInstance) {
    process.env.HOME = "/tmp";

    try {
      const connectionString = `md:${process.env.MOTHERDUCK_DB}?motherduck_token=${process.env.MOTHERDUCK_TOKEN}`;
      cachedInstance = await DuckDBInstance.create(connectionString);
    } catch {
      console.error("Failed to create DuckDB instance:", "Connection failed");
      throw new Error("Database connection failed");
    }
  }
  return cachedInstance;
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

export async function POST(request: NextRequest) {
  const corsHeaders = handleCors(request);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  if (!validateOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Request Failed",
      },
      { status: 403 },
    );
  }

  if (!rateLimit()) {
    return NextResponse.json(
      {
        success: false,
        message: "Request Failed",
      },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const validationResult = submissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Request Failed",
        },
        { status: 400 },
      );
    }

    const formData = validationResult.data;

    const instance = await getDuckDBInstance();

    const connection = await instance.connect();

    const submissionsTable = process.env.SUBMISSIONS_TABLE;

    await connection.run(
      `
      INSERT INTO ${submissionsTable} (
        dataset_name, dataset_url, dataset_owner, owner_name,
        description, missing_type, job_title, sector
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        formData.datasetName,
        formData.datasetUrl,
        formData.datasetOwner,
        formData.ownerName,
        formData.description,
        formData.missingType.toLowerCase(),
        formData.jobTitle || null,
        formData.sector,
      ],
    );

    connection.closeSync();

    return NextResponse.json(
      {
        success: true,
        message: "Request completed",
      },
      { headers: corsHeaders },
    );
  } catch {
    console.error("Request Failed");

    return NextResponse.json(
      { success: false, message: "Request Failed" },
      { status: 500 },
    );
  }
}
