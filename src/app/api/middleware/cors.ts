const allowedOrigins = [
  "https://datawatchman.dev",
  "https://www.datawatchman.dev",
  ...(process.env.ALLOW_LOCALHOST === "true" ? ["http://localhost:3000"] : []),
];

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins.includes(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function handleCors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  return corsHeaders(origin);
}

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin) {
    if (!referer) {
      return false;
    }

    try {
      const refererOrigin = new URL(referer).origin;
      return allowedOrigins.includes(refererOrigin);
    } catch {
      return false;
    }
  }

  try {
    const originUrl = new URL(origin);
    if (
      originUrl.protocol !== "https:" &&
      !originUrl.hostname.includes("localhost")
    ) {
      return false;
    }
  } catch {
    return false;
  }

  return allowedOrigins.includes(origin);
}
