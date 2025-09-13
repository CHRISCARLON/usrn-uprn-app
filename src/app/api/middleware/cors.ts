export function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    "https://datawatchman.dev",
    "https://www.datawatchman.dev",
    process.env.NODE_ENV === "development" ? "http://localhost:3000" : "",
  ].filter(Boolean);

  const isAllowed = !origin || allowedOrigins.includes(origin);

  if (isAllowed && origin) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };
  }

  return {};
}

export function handleCors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  return corsHeaders(origin);
}

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  const allowedOrigins = [
    "https://datawatchman.dev",
    "https://www.datawatchman.dev",
    process.env.NODE_ENV === "development" ? "http://localhost:3000" : "",
  ].filter(Boolean);

  // Only allow requests from explicitly allowed origins!
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }

  // Block everything else (including requests with no origin) :D
  return false;
}
