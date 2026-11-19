import { shop } from "@/config/shop";
import type { KioskStatus } from "@/components/screens/types";
import { atShopTime, nowInShop, timeLabel, todayDate } from "@/lib/time";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function todayHours(now = nowInShop()) {
  const hours = shop.hours[DAY_KEYS[now.weekday - 1]];
  if (!hours) return null;

  const date = todayDate(now);
  return {
    open: atShopTime(hours.open, date),
    close: atShopTime(hours.close, date),
    lastStart: atShopTime(hours.lastStart, date),
  };
}

export function getKioskStatus(now = nowInShop()): KioskStatus {
  const hours = todayHours(now);
  if (!shop.walkInsEnabled || !hours) return { state: "closed" };
  if (now < hours.open) return { state: "before_open", opensAt: timeLabel(hours.open) };
  if (now > hours.lastStart) return { state: "closed" };
  return { state: "open" };
}
