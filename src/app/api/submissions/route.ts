import { DuckDBInstance } from "@duckdb/node-api";
import { NextRequest, NextResponse } from "next/server";
import { submissionSchema } from "@/lib/validation";
import { handleCors, validateOrigin } from "../middleware/cors";

let requestCount = 0;
let windowStart = Date.now();

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX!) || 30;
const RATE_LIMIT_WINDOW =
  parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES!) * 60 * 1000 ||
  30 * 60 * 1000;

async function getDuckDBInstance() {
  process.env.HOME = "/tmp";

  if (!process.env.MOTHERDUCK_DB || !process.env.MOTHERDUCK_TOKEN) {
    throw new Error("Database configuration missing");
  }

  try {
    const connectionString = `md:${process.env.MOTHERDUCK_DB}?motherduck_token=${process.env.MOTHERDUCK_TOKEN}`;
    return await DuckDBInstance.fromCache(connectionString);
  } catch {
    console.error("[Database Connection Error]");
    throw new Error("Database connection failed");
  }
}

function rateLimit(): boolean {
  const now = Date.now();

  if (now - windowStart >= RATE_LIMIT_WINDOW) {
    requestCount = 0;
    windowStart = now;
  }

  if (requestCount >= RATE_LIMIT_MAX) {
    return false;
  }

  requestCount++;
  return true;
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = handleCors(request);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const corsHeaders = handleCors(request);

  if (!validateOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Request Failed",
      },
      { status: 403, headers: corsHeaders }
    );
  }

  if (!rateLimit()) {
    return NextResponse.json(
      {
        success: false,
        message: "Request Failed",
      },
      { status: 429, headers: corsHeaders }
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 100 * 1024) {
    return NextResponse.json(
      {
        success: false,
        message: "Payload too large",
      },
      { status: 413, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      );
    }

    const formData = validationResult.data;

    const submissionsTable = process.env.SUBMISSIONS_TABLE;
    if (!submissionsTable || !/^[a-zA-Z0-9_\.]+$/.test(submissionsTable)) {
      return NextResponse.json(
        {
          success: false,
          message: "Service configuration error",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const instance = await getDuckDBInstance();
    const connection = await instance.connect();

    try {
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
        ]
      );

      return NextResponse.json(
        {
          success: true,
          message: "Request completed",
        },
        { headers: corsHeaders }
      );
    } finally {
      connection.closeSync();
    }
  } catch {
    console.error("[Submissions Error]");

    return NextResponse.json(
      { success: false, message: "Request Failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
