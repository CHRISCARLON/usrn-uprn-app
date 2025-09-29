import { NextRequest, NextResponse } from "next/server";
import { handleCors, validateOrigin } from "../middleware/cors";

let requestCount = 0;
let windowStart = Date.now();

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX!) || 30;
const RATE_LIMIT_WINDOW =
  parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES!) * 60 * 1000 || 30 * 60 * 1000;

interface IGNFeatureProperties {
  label?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  district?: string;
}

interface IGNFeature {
  type: string;
  properties: IGNFeatureProperties;
  geometry: {
    type: string;
    coordinates: number[] | number[][];
  };
}

interface IGNGeocodeResponse {
  type: string;
  features: IGNFeature[];
}

async function reverseGeocode(lat: number, lon: number) {
  try {
    const url = `https://data.geopf.fr/geocodage/reverse?lon=${lon}&lat=${lat}&index=address&limit=1`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: "External service error",
      };
    }

    const data = (await response.json()) as IGNGeocodeResponse;

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        success: true,
        address:
          feature.properties.label ||
          feature.properties.name ||
          "Adresse non disponible",
      };
    }

    return {
      success: false,
      error: "Address not found",
    };
  } catch {
    console.error("[Geocode Error]");
    return {
      success: false,
      error: "Request Failed",
    };
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

export async function GET(request: NextRequest) {
  const corsHeaders = handleCors(request);

  // Validate origin for non-OPTIONS requests
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { error: "Request Failed" },
      { status: 403 }
    );
  }

  // Check rate limit
  if (!rateLimit()) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameters",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameters",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await reverseGeocode(latitude, longitude);

    return NextResponse.json(result, { headers: corsHeaders });
  } catch {
    console.error("[Geocode API Error]");
    return NextResponse.json(
      {
        success: false,
        error: "Request Failed",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
