import { connection } from "next/server";
import { json, upstreamError } from "@/lib/api";
import { getSetmoreClient } from "@/lib/setmore";

export async function GET() {
  await connection(); // always answer per request, never from a build-time copy

  try {
    await getSetmoreClient().listServices();
    return json({ ok: true, mode: process.env.SETMORE_MODE, setmore: "ok" });
  } catch (error) {
    return upstreamError("GET /api/health", error);
  }
}
