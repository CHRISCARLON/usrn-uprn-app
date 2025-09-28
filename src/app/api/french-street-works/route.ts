import { NextRequest, NextResponse } from "next/server";
import { handleCors, validateOrigin } from "../middleware/cors";

let requestCount = 0;
let windowStart = Date.now();

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX!) || 30;
const RATE_LIMIT_WINDOW =
  parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES!) * 60 * 1000 || 30 * 60 * 1000;

interface FrenchStreetWorksGeoPoint {
  lon: number;
  lat: number;
}

interface FrenchStreetWorksGeoShape {
  type: "Feature";
  geometry: {
    coordinates: number[][][];
    type: "Polygon";
  };
  properties: Record<string, unknown>;
}

interface FrenchStreetWorksItem {
  num_emprise: string;
  cp_arrondissement: string;
  date_debut: string;
  date_fin: string;
  chantier_categorie: string;
  moa_principal: string;
  surface: number;
  chantier_synthese: string;
  localisation_detail: string[];
  localisation_stationnement: string[];
  demande_cite_id: string;
  chantier_cite_id: string;
  geo_shape: FrenchStreetWorksGeoShape;
  geo_point_2d: FrenchStreetWorksGeoPoint;
}

interface FrenchStreetWorksResponse {
  total_count: number;
  results: FrenchStreetWorksItem[];
}

const PARIS_API_BASE_URL =
  "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/chantiers-a-paris/records";

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

    const queryParams = new URLSearchParams();

    const limit = searchParams.get("limit") || "100";
    queryParams.append("limit", limit);

    const offset = searchParams.get("offset");
    if (offset) {
      queryParams.append("offset", offset);
    }

    const whereConditions: string[] = [];

    const arrondissement = searchParams.get("arrondissement");
    if (arrondissement) {
      whereConditions.push(`cp_arrondissement="${arrondissement}"`);
    }

    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");

    if (dateDebut) {
      whereConditions.push(`date_debut>="${dateDebut}"`);
    }

    if (dateFin) {
      whereConditions.push(`date_fin<="${dateFin}"`);
    }

    const activeOnly = searchParams.get("activeOnly");
    if (activeOnly === "true") {
      const today = new Date().toISOString().split("T")[0];
      whereConditions.push(`date_debut<="${today}" AND date_fin>="${today}"`);
    }

    if (whereConditions.length > 0) {
      queryParams.append("where", whereConditions.join(" AND "));
    }

    const apiUrl = `${PARIS_API_BASE_URL}?${queryParams.toString()}`;
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("External service error");
    }

    const data: FrenchStreetWorksResponse = await response.json();

    // Process and format the response
    const formattedResults = data.results.map((item) => ({
      id: item.num_emprise,
      arrondissement: item.cp_arrondissement,
      startDate: item.date_debut,
      endDate: item.date_fin,
      category: item.chantier_categorie,
      contractor: item.moa_principal,
      area: item.surface,
      description: item.chantier_synthese,
      locationDetails: item.localisation_detail,
      parkingImpact: item.localisation_stationnement,
      requestId: item.demande_cite_id,
      workSiteId: item.chantier_cite_id,
      geometry: item.geo_shape,
      coordinates: item.geo_point_2d,
    }));

    return NextResponse.json(
      {
        success: true,
        totalCount: data.total_count,
        count: data.results.length,
        data: formattedResults,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Request Failed",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
