// config/shop.ts
export const shop = {
  name: "Jaribu Barbershop",
  timezone: "America/Edmonton",
  walkInsEnabled: true,          // false = kiosk shows "closed for today"

  // 24h "HH:mm". null = closed all day. lastStart = latest walk-in START time.
  hours: {
    mon: { open: "10:00", close: "21:00", lastStart: "20:30" },
    tue: { open: "10:00", close: "21:00", lastStart: "20:30" },
    wed: { open: "10:00", close: "21:00", lastStart: "20:30" },
    thu: { open: "10:00", close: "21:00", lastStart: "20:30" },
    fri: { open: "10:00", close: "21:00", lastStart: "20:30" },
    sat: { open: "10:00", close: "21:00", lastStart: "20:30" },
    sun: { open: "10:00", close: "21:00", lastStart: "20:30" },
  },

  // Fallback only if Setmore's API doesn't return blocked time.
  // e.g. { days: ["mon", "tue"], start: "13:00", end: "13:30" }
  breaks: [] as { days: string[]; start: string; end: string }[],

  slots: { stepMin: 15, bufferMin: 5, leadMin: 10, maxOptions: 6 },
  kiosk: { idleResetSec: 60, doneResetSec: 10, errorResetSec: 15, backByMin: 5 },

  bookingUrl: "https://jaribubarbershopltd.setmore.com/",  // QR code target

  // Order = order on screen. setmoreKey is filled in during Part 3 (from the probe).
  // mock = used only when SETMORE_MODE=mock.
  services: [
    { id: "haircut",   label: "Haircut",         setmoreKey: "", mock: { priceCents: 3500, durationMin: 30 } },
    { id: "skin-fade", label: "Skin fade",       setmoreKey: "", mock: { priceCents: 4500, durationMin: 45 } },
    { id: "buzz-cut",  label: "Buzz cut",        setmoreKey: "", mock: { priceCents: 2500, durationMin: 15 } },
    { id: "beard",     label: "Beard & line-up", setmoreKey: "", mock: { priceCents: 3000, durationMin: 23 } },
    { id: "kids",      label: "Kids (5–10)",     setmoreKey: "", mock: { priceCents: 3000, durationMin: 20 } },
    { id: "seniors",   label: "Seniors 65+",     setmoreKey: "", mock: { priceCents: 3000, durationMin: 20 } },
  ],
} as const;
