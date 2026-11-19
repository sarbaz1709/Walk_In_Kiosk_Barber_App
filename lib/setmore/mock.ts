import { randomUUID } from "node:crypto";
import { shop } from "@/config/shop";
import { atShopTime, todayDate } from "@/lib/time";
import { SlotTakenError } from "./errors";
import type { BookingInput, Busy, Service, SetmoreClient } from "./types";

const DELAY_MS = 300;

const TODAYS_APPOINTMENTS = [
  { start: "11:00", end: "11:30" },
  { start: "13:00", end: "13:45" },
  { start: "15:30", end: "16:00" },
  { start: "18:00", end: "18:20" },
];

export class MockSetmoreClient implements SetmoreClient {
  // Times "another customer" grabbed during a simulated MOCK_FAIL=taken race.
  private takenByOthers: Busy[] = [];
  private nextBookingIsTaken = true;

  async listServices(): Promise<Service[]> {
    await this.simulateCall();
    return shop.services.map((service) => ({
      key: service.setmoreKey || service.id,
      name: service.label,
      durationMin: service.mock.durationMin,
      priceCents: service.mock.priceCents,
    }));
  }

  async listBusy(date: string): Promise<Busy[]> {
    await this.simulateCall();
    if (date !== todayDate()) return [];

    const seeded: Busy[] = TODAYS_APPOINTMENTS.map(({ start, end }) => ({
      start: atShopTime(start, date),
      end: atShopTime(end, date),
      source: "appointment",
    }));
    return [...seeded, ...this.takenByOthers];
  }

  async createBooking(input: BookingInput): Promise<{ appointmentKey: string }> {
    await this.simulateCall();

    // MOCK_FAIL=taken: every other booking loses the race, so the customer can
    // see the "just taken" message and then still finish with another time.
    if (process.env.MOCK_FAIL === "taken") {
      const isTaken = this.nextBookingIsTaken;
      this.nextBookingIsTaken = !isTaken;
      if (isTaken) {
        this.takenByOthers.push({ start: input.start, end: input.end, source: "appointment" });
        throw new SlotTakenError();
      }
    }

    return { appointmentKey: `mock-${randomUUID()}` };
  }

  private async simulateCall() {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    if (process.env.MOCK_FAIL === "down") throw new Error("Mock Setmore is down");
  }
}
