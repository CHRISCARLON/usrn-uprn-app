import { NextRequest, NextResponse } from "next/server";
import { handleCors } from "../middleware/cors";

export async function GET(request: NextRequest) {
  const corsHeaders = handleCors(request);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  // No origin validation for GET - just returns config. Usually internal calls anyway.
  const requirePassword = process.env.REQUIRE_PASSWORD !== "false";

  return NextResponse.json(
    {
      requirePassword,
    },
    { headers: corsHeaders },
  );
}
