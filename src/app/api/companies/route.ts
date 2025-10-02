import { NextRequest, NextResponse } from "next/server";
import { handleCors, validateOrigin } from "../middleware/cors";

let requestCount = 0;
let windowStart = Date.now();

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX!) || 30;
const RATE_LIMIT_WINDOW =
  parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES!) * 60 * 1000 ||
  30 * 60 * 1000;

interface InseeApiResponse {
  header: {
    statut: number;
    message: string;
    total: number;
    debut: number;
    nombre: number;
  };
  etablissements: {
    siren: string;
    nic: string;
    siret: string;
    dateCreationEtablissement: string;
    uniteLegale: {
      denominationUniteLegale?: string;
      nomUniteLegale?: string;
      prenom1UniteLegale?: string;
      activitePrincipaleUniteLegale?: string;
    };
    adresseEtablissement: {
      numeroVoieEtablissement?: string;
      typeVoieEtablissement?: string;
      libelleVoieEtablissement?: string;
      codePostalEtablissement?: string;
      libelleCommuneEtablissement?: string;
    };
  }[];
}

interface SimplifiedCompany {
  siret: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  activite: string;
  dateCreation: string;
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
  // Remove house number to get just the street
  // Example: "7 Rue de l'Armorique 75015 Paris" -> "Rue de l'Armorique 75015 Paris"
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
      { status: 403, headers: corsHeaders }
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

    // Get the proper address ID from BAN API
    const addressId = await getAddressId(address);

    if (!addressId) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not find address in BAN database",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Format the ID by removing ALL underscores (like: 51454_4070 -> 514544070)
    const formattedId = addressId.replace(/_/g, "");

    // Use the formatted ID for INSEE search
    const query = encodeURIComponent(
      `identifiantAdresseEtablissement:${formattedId}_B AND periode(etatAdministratifEtablissement:A AND caractereEmployeurEtablissement: O)`
    );

    const url = `https://api.insee.fr/api-sirene/3.11/siret?q=${query}&nombre=100`;

    const apiKey = process.env.INSEE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: true,
          total: 0,
          companies: [],
          message: "INSEE API key not configured - returning empty results",
        },
        { headers: corsHeaders }
      );
    }

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-INSEE-Api-Key-Integration": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Handle 404 as "no companies found" (normal for streets without businesses)
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: true,
            total: 0,
            companies: [],
            message: "No companies found on this street",
            searchedAddressId: formattedId,
          },
          { headers: corsHeaders }
        );
      }

      console.error("[INSEE API Error]", {
        status: response.status,
        details: errorText,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Request Failed",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const data = (await response.json()) as InseeApiResponse;

    const total = data.header?.total || 0;

    const companies: SimplifiedCompany[] = (data.etablissements || []).map(
      (etab) => ({
        siret: etab.siret,
        nom:
          etab.uniteLegale?.denominationUniteLegale ||
          `${etab.uniteLegale?.nomUniteLegale || ""} ${
            etab.uniteLegale?.prenom1UniteLegale || ""
          }`.trim(),
        adresse: [
          etab.adresseEtablissement?.numeroVoieEtablissement,
          etab.adresseEtablissement?.typeVoieEtablissement,
          etab.adresseEtablissement?.libelleVoieEtablissement,
        ]
          .filter(Boolean)
          .join(" "),
        codePostal: etab.adresseEtablissement?.codePostalEtablissement || "",
        ville: etab.adresseEtablissement?.libelleCommuneEtablissement || "",
        activite: etab.uniteLegale?.activitePrincipaleUniteLegale || "",
        dateCreation: etab.dateCreationEtablissement,
      })
    );

    return NextResponse.json(
      {
        success: true,
        total,
        companies,
        searchedAddressId: formattedId,
      },
      { headers: corsHeaders }
    );
  } catch {
    console.error("[Companies API Error]");
    return NextResponse.json(
      {
        success: false,
        error: "Request Failed",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
