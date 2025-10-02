import { NextRequest, NextResponse } from "next/server";
import { handleCors, validateOrigin } from "../middleware/cors";

let requestCount = 0;
let windowStart = Date.now();

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX!) || 30;
const RATE_LIMIT_WINDOW =
  parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES!) * 60 * 1000 ||
  30 * 60 * 1000;

interface BdTopoFeature {
  type: string;
  id: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  geometry_name: string;
  properties: {
    cleabs: string;
    nature: string;
    nom_collaboratif_gauche: string;
    nom_collaboratif_droite: string;
    importance: string;
    fictif: boolean;
    position_par_rapport_au_sol: string;
    etat_de_l_objet: string;
    date_creation: string;
    date_modification: string;
    nombre_de_voies: number;
    largeur_de_chaussee: number;
    itineraire_vert: boolean;
    prive: boolean;
    sens_de_circulation: string;
    reserve_aux_bus: string | null;
    urbain: boolean;
    vitesse_moyenne_vl: number;
    acces_vehicule_leger: string;
    acces_pieton: string | null;
    restriction_de_hauteur: number | null;
    restriction_de_poids_total: number | null;
    restriction_de_poids_par_essieu: number | null;
    restriction_de_largeur: number | null;
    restriction_de_longueur: number | null;
    matieres_dangereuses_interdites: boolean;
    borne_debut_gauche: string;
    borne_debut_droite: string;
    borne_fin_gauche: string;
    borne_fin_droite: string;
    insee_commune_gauche: string;
    insee_commune_droite: string;
    alias_gauche: string | null;
    alias_droit: string | null;
    source_voie_ban_gauche: string;
    source_voie_ban_droite: string;
    nom_voie_ban_gauche: string;
    nom_voie_ban_droite: string;
    lieux_dits_ban_gauche: string;
    lieux_dits_ban_droite: string;
    identifiant_voie_ban_gauche: string;
    identifiant_voie_ban_droite: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  bbox: number[];
}

interface BdTopoResponse {
  type: string;
  features: BdTopoFeature[];
  totalFeatures: number;
  numberMatched: number;
  numberReturned: number;
  timeStamp: string;
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  bbox: number[];
}

interface BanFeatureProperties {
  label: string;
  score: number;
  housenumber?: string;
  id: string;
  name?: string;
  postcode: string;
  citycode: string;
  x: number;
  y: number;
  city: string;
  context: string;
  type: string;
  importance: number;
  street?: string;
}

interface BanFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: BanFeatureProperties;
}

interface BanApiResponse {
  type: string;
  version: string;
  features: BanFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

function extractStreetOnly(fullAddress: string): string {
  const addressParts = fullAddress.split(",").map((p) => p.trim());
  const streetPart = addressParts[0] || fullAddress;
  const streetOnly = streetPart.replace(/^\d+\s+/, "").trim();

  const otherParts = addressParts.slice(1);
  if (otherParts.length > 0) {
    return `${streetOnly}, ${otherParts.join(", ")}`;
  }

  const match = fullAddress.match(/^(\d+\s+)?(.+?\s+)(\d{5}\s+.+)$/);
  if (match) {
    return `${match[2].trim()} ${match[3]}`;
  }

  return streetOnly;
}

async function getAddressId(fullAddress: string): Promise<string | null> {
  try {
    const streetOnly = extractStreetOnly(fullAddress);

    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
      streetOnly
    )}&limit=1`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as BanApiResponse;

    if (!data.features || data.features.length === 0) {
      const fallbackUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
        fullAddress
      )}&limit=1`;
      const fallbackResponse = await fetch(fallbackUrl);

      if (fallbackResponse.ok) {
        const fallbackData = (await fallbackResponse.json()) as BanApiResponse;
        if (fallbackData.features && fallbackData.features.length > 0) {
          return fallbackData.features[0].properties.id;
        }
      }

      return null;
    }

    const feature = data.features[0];

    return feature.properties.id;
  } catch {
    console.error("[Address ID Lookup Error]");
    return null;
  }
}

async function fetchBdTopo(
  identifiant: string,
  side: "gauche" | "droit"
): Promise<BdTopoResponse | null> {
  try {
    const field =
      side === "gauche"
        ? "identifiant_voie_ban_gauche"
        : "identifiant_voie_ban_droite";
    const url = `https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=BDTOPO_V3:troncon_de_route&CQL_FILTER=${field}=%27${identifiant}%27&OUTPUTFORMAT=application/json`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[BD TOPO ${side} Error]`, response.status);
      return null;
    }

    const data = (await response.json()) as BdTopoResponse;
    return data;
  } catch {
    console.error(`[BD TOPO ${side} Fetch Error]`);
    return null;
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

  if (!validateOrigin(request)) {
    return NextResponse.json(
      { error: "Request Failed" },
      { status: 403, headers: corsHeaders }
    );
  }

  if (!rateLimit()) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Address parameter is required",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the BAN ID from the address (but keep underscores for BD TOPO!)
    const banId = await getAddressId(address);

    if (!banId) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not find address in BAN database",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Trim BAN ID to street level (remove house number suffix if present)
    // Example: 75105_9517_00004_b -> 75105_9517
    const trimmedBanId = banId.split("_").slice(0, 2).join("_");

    // Query BD TOPO for left side only (gauche)
    // TODO: If I can figure out why this is so slowwww the maybe I'll do both left and right
    const gaucheData = await fetchBdTopo(trimmedBanId, "gauche");

    if (!gaucheData) {
      return NextResponse.json(
        {
          success: false,
          error: "No BD TOPO data found",
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        banId: trimmedBanId,
        totalFeatures: gaucheData.numberReturned || 0,
        features: gaucheData.features || [],
      },
      { headers: corsHeaders }
    );
  } catch {
    console.error("[BD TOPO API Error]");
    return NextResponse.json(
      {
        success: false,
        error: "Request Failed",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
