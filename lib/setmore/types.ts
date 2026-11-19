import type { DateTime } from "luxon";

export type Service = {
  key: string;          // Setmore service_key
  name: string;
  durationMin: number;
  priceCents: number;
};

export type Busy = {
  start: DateTime;      // always in America/Edmonton
  end: DateTime;
  source: "appointment" | "block";
  customerPhone?: string; // E.164, only used for the duplicate-booking check
};

export type BookingInput = {
  serviceKey: string;
  start: DateTime;
  end: DateTime;
  firstName: string;
  phone: string;        // E.164, e.g. +14035550123
};

export interface SetmoreClient {
  listServices(): Promise<Service[]>;
  listBusy(date: string): Promise<Busy[]>;   // date = "YYYY-MM-DD" in America/Edmonton
  createBooking(input: BookingInput): Promise<{ appointmentKey: string }>;
}
