import type { DateTime } from "luxon";
import type { Busy } from "@/lib/setmore/types";

export type SlotOptions = {
  now: DateTime;             // America/Edmonton
  open: DateTime;            // today's opening time
  close: DateTime;           // today's closing time; a booking must END by this
  lastStart: DateTime;       // latest time a walk-in may START (config)
  durationMin: number;
  bufferMin: number;         // clean-up gap kept after every booking (default 5)
  stepMin: number;           // grid for start times (default 15)
  leadMin: number;           // minimum minutes from now for a grid time (default 10)
  maxOptions: number;        // default 6
  busy: Busy[];
};

export type Slot = { start: DateTime; end: DateTime; isNow: boolean };

const ROUND_TO_MIN = 5;

// 14:02 with a 15-minute step becomes 14:15. 14:15 stays 14:15.
function roundUp(time: DateTime, stepMin: number) {
  const hour = time.startOf("hour");
  const minutes = time.diff(hour, "minutes").minutes;
  return hour.plus({ minutes: Math.ceil(minutes / stepMin) * stepMin });
}

// The start time "Now" stands for: 14:02 becomes 14:05.
export function nowStartTime(now: DateTime) {
  return roundUp(now, ROUND_TO_MIN);
}

function toSlot(start: DateTime, durationMin: number, isNow: boolean): Slot {
  return { start, end: start.plus({ minutes: durationMin }), isNow };
}

function gridTimes(o: SlotOptions) {
  const times: DateTime[] = [];
  let time = roundUp(o.now.plus({ minutes: o.leadMin }), o.stepMin);
  while (time <= o.lastStart) {
    times.push(time);
    time = time.plus({ minutes: o.stepMin });
  }
  return times;
}

function rightAfterTimes(o: SlotOptions) {
  return o.busy.map((block) => roundUp(block.end.plus({ minutes: o.bufferMin }), ROUND_TO_MIN));
}

export function fits(start: DateTime, o: SlotOptions): boolean {
  const end = start.plus({ minutes: o.durationMin });
  if (start < o.open || start > o.lastStart || end > o.close) return false;

  return o.busy.every(
    (block) =>
      start >= block.end.plus({ minutes: o.bufferMin }) ||
      end.plus({ minutes: o.bufferMin }) <= block.start,
  );
}

export function findSlots(o: SlotOptions): Slot[] {
  if (o.now < o.open || o.now > o.lastStart) return [];

  const nowStart = nowStartTime(o.now);

  // Only times after "Now": appointments earlier today must not produce past slots.
  const laterTimes = [...gridTimes(o), ...rightAfterTimes(o)]
    .filter((time) => time > nowStart)
    .sort((a, b) => a.toMillis() - b.toMillis())
    .filter((time, index, sorted) => index === 0 || +time !== +sorted[index - 1]);

  const slots = laterTimes
    .filter((time) => fits(time, o))
    .map((time) => toSlot(time, o.durationMin, false));

  if (fits(nowStart, o)) slots.unshift(toSlot(nowStart, o.durationMin, true));

  return slots.slice(0, o.maxOptions);
}
