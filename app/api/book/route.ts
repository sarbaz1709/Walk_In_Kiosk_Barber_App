import { shop } from "@/config/shop";
import type { SlotDTO } from "@/components/screens/types";
import { apiError, json, upstreamError } from "@/lib/api";
import { getKioskStatus } from "@/lib/hours";
import { getKioskServices } from "@/lib/services";
import { getSetmoreClient } from "@/lib/setmore";
import { SlotTakenError } from "@/lib/setmore/errors";
import { findSlots, fits, nowStartTime } from "@/lib/slots/engine";
import { todaySlotOptions, todaySlots, toSlotDTO } from "@/lib/slots/today";
import { nowInShop, timeLabel } from "@/lib/time";
import { bookingSchema } from "@/lib/validation";

function invalidInput(fields: string[]) {
  return apiError(400, "INVALID_INPUT", "Booking details are not valid", { fields });
}

function closed() {
  return apiError(423, "CLOSED", "Walk-ins are closed");
}

function slotTaken(slots: SlotDTO[]) {
  return apiError(409, "SLOT_TAKEN", "That time is no longer free", { slots });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.issues.flatMap((issue) => issue.path.slice(0, 1).map(String));
    return invalidInput([...new Set(fields)]);
  }

  const { start, firstName, phone } = parsed.data;
  const now = nowInShop();
  if (getKioskStatus(now).state !== "open") return closed();

  try {
    const services = await getKioskServices();
    const service = services.find((candidate) => candidate.id === parsed.data.service);
    if (!service) return invalidInput(["service"]);

    const options = await todaySlotOptions(service.durationMin, now);
    if (!options) return closed();

    const success = () =>
      json({
        ok: true,
        firstName,
        serviceLabel: service.label,
        startLabel: timeLabel(start),
        backByLabel: timeLabel(start.minus({ minutes: shop.kiosk.backByMin })),
        isNow: start <= nowStartTime(now),
      });

    // Checked before fits(): a repeated request would otherwise be blocked by
    // its own booking and wrongly told the time was taken.
    const alreadyBooked = options.busy.some(
      (block) => block.customerPhone === phone && +block.start === +start,
    );
    if (alreadyBooked) return success();

    if (!fits(start, options)) return slotTaken(findSlots(options).map(toSlotDTO));

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
      return slotTaken(await todaySlots(service.durationMin));
    }

    return success();
  } catch (error) {
    return upstreamError("POST /api/book", error);
  }
}
