export function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    "https://datawatchman.dev",
    "https://www.datawatchman.dev",
    process.env.ALLOW_LOCALHOST === "true" ? "http://localhost:3000" : "",
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

  // Allow requests without origin header (same-origin requests)
  if (!origin) {
    return true;
  }

  const allowedOrigins = [
    "https://datawatchman.dev",
    "https://www.datawatchman.dev",
    process.env.ALLOW_LOCALHOST === "true" ? "http://localhost:3000" : "",
  ].filter(Boolean);

  return allowedOrigins.includes(origin);
}
