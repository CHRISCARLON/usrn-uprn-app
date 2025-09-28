import { NextRequest, NextResponse } from "next/server";
import { handleCors, validateOrigin } from "../middleware/cors";

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
        error: `Reverse geocoding failed with status: ${response.status}`,
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
      error: "Aucune adresse trouvée pour ces coordonnées",
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
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
      { error: "Forbidden: Invalid origin" },
      { status: 403 }
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
          error: "Missing latitude or longitude parameters",
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
          error: "Invalid latitude or longitude values",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await reverseGeocode(latitude, longitude);

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error("Geocoding route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
