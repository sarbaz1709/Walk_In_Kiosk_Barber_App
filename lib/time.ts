import { DateTime } from "luxon";
import { shop } from "@/config/shop";

const zone = shop.timezone;
const locale = "en-US";

export function nowInShop() {
  return DateTime.now().setZone(zone).setLocale(locale);
}

// "YYYY-MM-DD" in the shop's time zone.
export function todayDate(now: DateTime = nowInShop()) {
  return now.toFormat("yyyy-MM-dd");
}

// "14:15" on the given date (today by default), in the shop's time zone.
export function atShopTime(time: string, date: string = todayDate()) {
  return DateTime.fromISO(`${date}T${time}`, { zone, locale });
}

export function parseShopTime(iso: string) {
  return DateTime.fromISO(iso, { zone, locale });
}

// "2026-11-18T14:15:00-07:00"
export function toIsoTime(time: DateTime) {
  return time.toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
}

// "2:15 PM"
export function timeLabel(time: DateTime) {
  return time.toFormat("h:mm a", { locale });
}
