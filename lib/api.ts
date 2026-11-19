export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiError(
  status: number,
  error: string,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return json({ error, message, ...extra }, status);
}

// Logs only the route and the error type, never customer details.
export function upstreamError(route: string, cause: unknown) {
  const type = cause instanceof Error ? cause.name : "UnknownError";
  console.error(`[api] ${route} failed: ${type}`);
  return apiError(502, "UPSTREAM", "Setmore request failed");
}
