import { connection } from "next/server";
import { json, upstreamError } from "@/lib/api";
import { getKioskServices } from "@/lib/services";

export async function GET() {
  await connection(); // always answer per request, never from a build-time copy

  try {
    const services = await getKioskServices();
    return json({
      services: services.map(({ id, label, priceLabel, durationMin }) => ({
        id,
        label,
        priceLabel,
        durationMin,
      })),
    });
  } catch (error) {
    return upstreamError("GET /api/services", error);
  }
}
