import { Client } from "pg";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false, // Disable SSL for local development
  });

  try {
    const formData = await request.json();
    await client.connect();

    const query = `
      INSERT INTO submissions (
        dataset_name, dataset_url, dataset_owner, owner_name, 
        description, missing_type, job_title, sector
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `;

    const values = [
      formData.datasetName,
      formData.datasetUrl,
      formData.datasetOwner,
      formData.ownerName,
      formData.description,
      formData.missingType.toLowerCase(),
      formData.jobTitle || null,
      formData.sector,
    ];

    const result = await client.query(query, values);

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully!",
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit report" },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
