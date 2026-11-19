import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingSchema } from "./validation";

const valid = {
  service: "skin-fade",
  start: "2026-11-18T14:15:00-06:00",
  firstName: "Carlos",
  phone: "4035550123",
};

function rejectedFields(input: unknown) {
  const result = bookingSchema.safeParse(input);
  return result.success ? [] : [...new Set(result.error.issues.map((issue) => issue.path[0]))];
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-18T20:00:00Z")); // 2:00 PM in Edmonton
});

afterEach(() => {
  vi.useRealTimers();
});

describe("bookingSchema", () => {
  it("accepts a valid booking", () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects input that is not an object", () => {
    expect(bookingSchema.safeParse(null).success).toBe(false);
  });

  it("reports every missing field", () => {
    expect(rejectedFields({})).toEqual(["service", "start", "firstName", "phone"]);
  });

  it("rejects an unknown service", () => {
    expect(rejectedFields({ ...valid, service: "shave" })).toEqual(["service"]);
  });
});

describe("first name", () => {
  it.each(["Carlos", "Mary-Jo", "O'Neil", "O’Neil", "Ana Maria", "José", "Zoë", "A"])(
    "accepts %s",
    (firstName) => {
      expect(rejectedFields({ ...valid, firstName })).toEqual([]);
    },
  );

  it("trims surrounding spaces", () => {
    const result = bookingSchema.parse({ ...valid, firstName: "  Ana  " });
    expect(result.firstName).toBe("Ana");
  });

  it("accepts 30 characters", () => {
    expect(rejectedFields({ ...valid, firstName: "a".repeat(30) })).toEqual([]);
  });

  it.each([
    ["empty", ""],
    ["only spaces", "   "],
    ["31 characters", "a".repeat(31)],
    ["a digit", "C4rlos"],
    ["a symbol", "Carlos!"],
    ["an emoji", "Carlos😀"],
    ["a leading hyphen", "-Carlos"],
  ])("rejects %s", (_label, firstName) => {
    expect(rejectedFields({ ...valid, firstName })).toEqual(["firstName"]);
  });
});

describe("phone", () => {
  it("converts 10 digits to +1XXXXXXXXXX", () => {
    expect(bookingSchema.parse(valid).phone).toBe("+14035550123");
  });

  it.each([
    ["9 digits", "403555012"],
    ["11 digits", "14035550123"],
    ["formatting", "(403) 555-0123"],
    ["a country code", "+14035550123"],
    ["letters", "403555012a"],
    ["empty", ""],
    ["a number instead of text", 4035550123],
  ])("rejects %s", (_label, phone) => {
    expect(rejectedFields({ ...valid, phone })).toEqual(["phone"]);
  });
});

describe("start time", () => {
  it("returns the time in America/Edmonton", () => {
    const { start } = bookingSchema.parse({ ...valid, start: "2026-11-18T20:15:00Z" });
    expect(start.zoneName).toBe("America/Edmonton");
    expect(start.toFormat("yyyy-MM-dd HH:mm")).toBe("2026-11-18 14:15");
  });

  it.each([
    ["yesterday", "2026-11-17T14:15:00-06:00"],
    ["tomorrow", "2026-11-19T14:15:00-06:00"],
    ["no time zone", "2026-11-18T14:15:00"],
    ["a date only", "2026-11-18"],
    ["not a time", "soon"],
  ])("rejects %s", (_label, start) => {
    expect(rejectedFields({ ...valid, start })).toEqual(["start"]);
  });

  it("uses Edmonton's date, not UTC's, late in the evening", () => {
    vi.setSystemTime(new Date("2026-11-19T05:00:00Z")); // 11:00 PM on Nov 18 in Edmonton

    expect(rejectedFields({ ...valid, start: "2026-11-19T05:30:00Z" })).toEqual([]); // 11:30 PM
    expect(rejectedFields({ ...valid, start: "2026-11-19T06:30:00Z" })).toEqual(["start"]); // 12:30 AM
  });
});
