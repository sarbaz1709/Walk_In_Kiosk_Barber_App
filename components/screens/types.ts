// Shapes the kiosk page works with. They match the API responses in section 9.

export type KioskStatus =
  | { state: "open" }
  | { state: "before_open"; opensAt: string }
  | { state: "closed" };

export type ServiceDTO = {
  id: string;
  label: string;
  priceLabel: string;
  durationMin: number;
};

export type SlotDTO = {
  start: string;
  label: string;
  isNow: boolean;
};

export type CustomerField = "firstName" | "phone";

export type BookingResult = {
  firstName: string;
  serviceLabel: string;
  startLabel: string;
  backByLabel: string;
  isNow: boolean;
};
