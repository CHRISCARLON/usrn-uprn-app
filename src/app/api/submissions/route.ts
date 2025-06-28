import { DuckDBInstance } from "@duckdb/node-api";
import { NextRequest, NextResponse } from "next/server";
import { submissionSchema } from "@/lib/validation";

let requestCount = 0;
let windowStart = Date.now();
let cachedInstance: DuckDBInstance | null = null;

async function getDuckDBInstance() {
  if (!cachedInstance) {
    process.env.HOME = "/tmp";

    const connectionString = `md:${process.env.MOTHERDUCK_DB}?motherduck_token=${process.env.MOTHERDUCK_TOKEN}`;
    cachedInstance = await DuckDBInstance.create(connectionString);
  }
  return cachedInstance;
}

function rateLimit(maxRequests = 150, windowMs = 30 * 60 * 1000): boolean {
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
  // Check rate limit first - 150 requests per 30 minutes
  if (!rateLimit(150, 30 * 60 * 1000)) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please try again later.",
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const validationResult = submissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data provided",
        },
        { status: 400 }
      );
    }

    const formData = validationResult.data;

    // Get cached instance (home directory already configured)
    const instance = await getDuckDBInstance();
    const connection = await instance.connect();

    // Insert data
    await connection.run(
      `
      INSERT INTO usrn_uprn_reports.submissions (
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

    connection.closeSync();

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully!",
    });
  } catch (error) {
    console.error("Form submission failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to submit report" },
      { status: 500 }
    );
  }
}
