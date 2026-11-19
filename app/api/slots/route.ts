import { connection } from "next/server";
import { apiError, json, upstreamError } from "@/lib/api";
import { getKioskServices } from "@/lib/services";
import { placeholderSlots } from "@/lib/slots/placeholder";
import { todayDate } from "@/lib/time";

export async function GET(request: Request) {
  await connection(); // always answer per request, never from a build-time copy
  const serviceId = new URL(request.url).searchParams.get("service");

  try {
    const services = await getKioskServices();
    const service = services.find((candidate) => candidate.id === serviceId);
    if (!service) {
      return apiError(400, "INVALID_INPUT", "Unknown service", { fields: ["service"] });
    }

    const slots = await placeholderSlots(service.durationMin);
    return json({ date: todayDate(), slots });
  } catch (error) {
    return upstreamError("GET /api/slots", error);
  }
}
