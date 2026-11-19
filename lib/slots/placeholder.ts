import { shop } from "@/config/shop";
import type { SlotDTO } from "@/components/screens/types";
import { getKioskStatus, todayHours } from "@/lib/hours";
import { getSetmoreClient } from "@/lib/setmore";
import { nowInShop, roundUpToStep, timeLabel, todayDate, toIsoTime } from "@/lib/time";

// Placeholder until the real slot engine arrives in Part 2: the next free
// quarter-hours from now that don't overlap a busy time.
export async function placeholderSlots(durationMin: number): Promise<SlotDTO[]> {
  const now = nowInShop();
  const hours = todayHours(now);
  if (!hours || getKioskStatus(now).state !== "open") return [];

  const busy = await getSetmoreClient().listBusy(todayDate(now));
  const { stepMin, maxOptions } = shop.slots;
  const slots: SlotDTO[] = [];

  for (
    let start = roundUpToStep(now, stepMin);
    start <= hours.lastStart && slots.length < maxOptions;
    start = start.plus({ minutes: stepMin })
  ) {
    const end = start.plus({ minutes: durationMin });
    const overlaps = busy.some((block) => start < block.end && end > block.start);
    if (end <= hours.close && !overlaps) {
      slots.push({ start: toIsoTime(start), label: timeLabel(start), isNow: false });
    }
  }

  return slots;
}
