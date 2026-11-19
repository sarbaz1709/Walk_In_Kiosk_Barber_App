import { shop } from "@/config/shop";
import type { SlotDTO } from "@/components/screens/types";
import { dayKey, getKioskStatus, todayHours } from "@/lib/hours";
import { getSetmoreClient } from "@/lib/setmore";
import type { Busy } from "@/lib/setmore/types";
import { atShopTime, nowInShop, timeLabel, todayDate, toIsoTime } from "@/lib/time";
import { findSlots, type Slot, type SlotOptions } from "./engine";

function todaysBreaks(now = nowInShop()): Busy[] {
  const date = todayDate(now);
  const day: string = dayKey(now);

  return shop.breaks
    .filter((item) => item.days.includes(day))
    .map((item) => ({
      start: atShopTime(item.start, date),
      end: atShopTime(item.end, date),
      source: "block",
    }));
}

// Returns null when the shop has no hours today.
export async function todaySlotOptions(
  durationMin: number,
  now = nowInShop(),
): Promise<SlotOptions | null> {
  const hours = todayHours(now);
  if (!hours) return null;

  const busy = await getSetmoreClient().listBusy(todayDate(now));
  return {
    now,
    ...hours,
    durationMin,
    ...shop.slots,
    busy: [...busy, ...todaysBreaks(now)],
  };
}

export function toSlotDTO(slot: Slot): SlotDTO {
  return { start: toIsoTime(slot.start), label: timeLabel(slot.start), isNow: slot.isNow };
}

export async function todaySlots(durationMin: number, now = nowInShop()): Promise<SlotDTO[]> {
  if (getKioskStatus(now).state !== "open") return [];

  const options = await todaySlotOptions(durationMin, now);
  return options ? findSlots(options).map(toSlotDTO) : [];
}
