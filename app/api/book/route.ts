import { shop } from "@/config/shop";
import { apiError, json, upstreamError } from "@/lib/api";
import { getKioskServices } from "@/lib/services";
import { getSetmoreClient } from "@/lib/setmore";
import { SlotTakenError } from "@/lib/setmore/errors";
import { placeholderSlots } from "@/lib/slots/placeholder";
import { timeLabel } from "@/lib/time";
import { bookingSchema } from "@/lib/validation";

function invalidInput(fields: string[]) {
  return apiError(400, "INVALID_INPUT", "Booking details are not valid", { fields });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.issues.flatMap((issue) => issue.path.slice(0, 1).map(String));
    return invalidInput([...new Set(fields)]);
  }

  const { start, firstName, phone } = parsed.data;

  try {
    const services = await getKioskServices();
    const service = services.find((candidate) => candidate.id === parsed.data.service);
    if (!service) return invalidInput(["service"]);

    try {
      await getSetmoreClient().createBooking({
        serviceKey: service.setmoreKey,
        start,
        end: start.plus({ minutes: service.durationMin }),
        firstName,
        phone,
      });
    } catch (error) {
      if (!(error instanceof SlotTakenError)) throw error;
      const slots = await placeholderSlots(service.durationMin);
      return apiError(409, "SLOT_TAKEN", "That time is no longer free", { slots });
    }

    return json({
      ok: true,
      firstName,
      serviceLabel: service.label,
      startLabel: timeLabel(start),
      backByLabel: timeLabel(start.minus({ minutes: shop.kiosk.backByMin })),
      isNow: false, // the placeholder slots never offer "Now"; Part 2 adds it
    });
  } catch (error) {
    return upstreamError("POST /api/book", error);
  }
}
