import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import type { Busy } from "@/lib/setmore/types";
import { findSlots, fits, type Slot, type SlotOptions } from "./engine";

const ZONE = "America/Edmonton";
const DATE = "2026-11-18";

function at(time: string, date = DATE) {
  return DateTime.fromISO(`${date}T${time}`, { zone: ZONE });
}

function busy(start: string, end: string, source: Busy["source"] = "appointment"): Busy {
  return { start: at(start), end: at(end), source };
}

function options(now: string, durationMin: number, blocks: Busy[] = [], date = DATE): SlotOptions {
  return {
    now: at(now, date),
    open: at("10:00", date),
    close: at("21:00", date),
    lastStart: at("20:30", date),
    durationMin,
    bufferMin: 5,
    stepMin: 15,
    leadMin: 10,
    maxOptions: 6,
    busy: blocks,
  };
}

function times(slots: Slot[]) {
  return slots.map((slot) => slot.start.toFormat("HH:mm"));
}

describe("findSlots: section 8 table", () => {
  it("1: empty day, now 10:00, 30 min", () => {
    const slots = findSlots(options("10:00", 30));
    expect(times(slots)).toEqual(["10:00", "10:15", "10:30", "10:45", "11:00", "11:15"]);
    expect(slots.map((slot) => slot.isNow)).toEqual([true, false, false, false, false, false]);
  });

  it("2: appointment 14:30-15:15, now 14:00, 45 min: no Now, first slot 15:20", () => {
    const slots = findSlots(options("14:00", 45, [busy("14:30", "15:15")]));
    expect(slots.some((slot) => slot.isNow)).toBe(false);
    expect(times(slots)[0]).toBe("15:20");
  });

  it("3: same appointment, now 14:00, 15 min: Now fits", () => {
    const [first] = findSlots(options("14:00", 15, [busy("14:30", "15:15")]));
    expect(first.start.toFormat("HH:mm")).toBe("14:00");
    expect(first.end.toFormat("HH:mm")).toBe("14:15");
    expect(first.isNow).toBe(true);
  });

  it("4: appointment ends 14:30, now 14:20, 30 min: nothing before 14:35", () => {
    const result = times(findSlots(options("14:20", 30, [busy("14:00", "14:30")])));
    expect(result[0]).toBe("14:35");
    expect(result.every((time) => time >= "14:35")).toBe(true);
  });

  it("5: two appointments, now 14:40, 30 min: 14:50, no 15:00, next from 16:05", () => {
    const blocks = [busy("14:00", "14:45"), busy("15:30", "16:00")];
    const result = times(findSlots(options("14:40", 30, blocks)));
    expect(result).toEqual(["14:50", "16:05", "16:15", "16:30", "16:45", "17:00"]);
    expect(result).not.toContain("15:00");
  });

  it("6: now 20:20, 45 min: nothing, it would end after 21:00", () => {
    expect(findSlots(options("20:20", 45))).toEqual([]);
  });

  it("7: now 20:20, 30 min: Now and 20:30", () => {
    const slots = findSlots(options("20:20", 30));
    expect(times(slots)).toEqual(["20:20", "20:30"]);
    expect(slots.map((slot) => slot.isNow)).toEqual([true, false]);
  });

  it("8: now 20:45: nothing, past lastStart", () => {
    expect(findSlots(options("20:45", 30))).toEqual([]);
  });

  it("9: now 09:30: nothing, before opening", () => {
    expect(findSlots(options("09:30", 30))).toEqual([]);
  });

  it("10: now 14:02, empty afternoon: Now is 14:05, first grid time 14:15", () => {
    const slots = findSlots(options("14:02", 30));
    expect(times(slots).slice(0, 2)).toEqual(["14:05", "14:15"]);
    expect(slots[0].isNow).toBe(true);
    expect(slots[1].isNow).toBe(false);
  });

  it("11: long empty day: never more than 6 slots", () => {
    expect(findSlots(options("10:00", 15))).toHaveLength(6);
  });

  it("12: 2027-03-14, now 10:00: same results as a normal day", () => {
    const normalDay = times(findSlots(options("10:00", 30)));
    const special = findSlots(options("10:00", 30, [], "2027-03-14"));
    expect(times(special)).toEqual(normalDay);
    expect(special.every((slot) => slot.start.zoneName === ZONE)).toBe(true);
  });

  it("13: config break 13:00-13:30, now 12:40, 30 min: nothing before 13:35", () => {
    const result = times(findSlots(options("12:40", 30, [busy("13:00", "13:30", "block")])));
    expect(result[0]).toBe("13:35");
    expect(result.every((time) => time >= "13:35")).toBe(true);
  });
});

describe("findSlots: past appointments", () => {
  it("never offers a right-after time that has already passed", () => {
    const result = times(findSlots(options("14:00", 30, [busy("11:00", "11:30")])));
    expect(result).toEqual(["14:00", "14:15", "14:30", "14:45", "15:00", "15:15"]);
  });
});

describe("fits: section 8 rule 2", () => {
  const blocked = options("10:00", 30, [busy("14:30", "15:00")]);

  it("accepts the exact limits", () => {
    expect(fits(at("10:00"), blocked)).toBe(true); // at opening
    expect(fits(at("13:55"), blocked)).toBe(true); // ends 14:25, buffer reaches 14:30
    expect(fits(at("15:05"), blocked)).toBe(true); // buffer after 15:00
    expect(fits(at("20:30"), blocked)).toBe(true); // at lastStart, ends at close
  });

  it("rejects anything past those limits", () => {
    expect(fits(at("09:55"), blocked)).toBe(false); // before opening
    expect(fits(at("14:00"), blocked)).toBe(false); // buffer runs into the appointment
    expect(fits(at("15:00"), blocked)).toBe(false); // inside the buffer after it
    expect(fits(at("20:35"), blocked)).toBe(false); // after lastStart
    expect(fits(at("20:30"), { ...blocked, durationMin: 45 })).toBe(false); // ends after close
  });
});
