"use client";

import { useEffect, useReducer } from "react";
import { shop } from "@/config/shop";
import { Details } from "@/components/screens/Details";
import { Done } from "@/components/screens/Done";
import { ErrorScreen } from "@/components/screens/Error";
import { Service } from "@/components/screens/Service";
import { Time } from "@/components/screens/Time";
import { Welcome } from "@/components/screens/Welcome";
import type {
  BookingResult,
  KioskStatus,
  ServiceDTO,
  SlotDTO,
} from "@/components/screens/types";

// Sample data for Part 1, prompt 1.2. Prompt 1.3 replaces all of it with API calls.
// To preview other states, change these values:
//   SAMPLE_STATUS:  { state: "before_open", opensAt: "10:00 AM" } or { state: "closed" }
//   SAMPLE_SLOTS:   null (loading) or [] (no times left)
//   SAMPLE_OUTCOME: "taken" or "error"
const SAMPLE_STATUS = { state: "open" } as KioskStatus;
const SAMPLE_OUTCOME = "booked" as "booked" | "taken" | "error";

const SAMPLE_SERVICES: ServiceDTO[] = [
  { id: "haircut", label: "Haircut", priceLabel: "$35", durationMin: 30 },
  { id: "skin-fade", label: "Skin fade", priceLabel: "$45", durationMin: 45 },
  { id: "buzz-cut", label: "Buzz cut", priceLabel: "$25", durationMin: 15 },
  { id: "beard", label: "Beard & line-up", priceLabel: "$30", durationMin: 23 },
  { id: "kids", label: "Kids (5–10)", priceLabel: "$30", durationMin: 20 },
  { id: "seniors", label: "Seniors 65+", priceLabel: "$30", durationMin: 20 },
];

const SAMPLE_SLOTS = [
  { start: "2026-11-18T14:05:00-07:00", label: "2:05 PM", isNow: true },
  { start: "2026-11-18T14:15:00-07:00", label: "2:15 PM", isNow: false },
  { start: "2026-11-18T15:15:00-07:00", label: "3:15 PM", isNow: false },
  { start: "2026-11-18T16:30:00-07:00", label: "4:30 PM", isNow: false },
  { start: "2026-11-18T17:15:00-07:00", label: "5:15 PM", isNow: false },
  { start: "2026-11-18T18:00:00-07:00", label: "6:00 PM", isNow: false },
] as SlotDTO[] | null;

const SAMPLE_BACK_BY: Record<string, string> = {
  "2:05 PM": "2:00 PM",
  "2:15 PM": "2:10 PM",
  "3:15 PM": "3:10 PM",
  "4:30 PM": "4:25 PM",
  "5:15 PM": "5:10 PM",
  "6:00 PM": "5:55 PM",
};

type State =
  | { screen: "welcome" }
  | { screen: "service" }
  | { screen: "time"; serviceId: string; notice?: "taken" }
  | { screen: "details"; serviceId: string; slot: SlotDTO }
  | { screen: "done"; result: BookingResult }
  | { screen: "error" };

type Action =
  | { type: "reset" }
  | { type: "start" }
  | { type: "back" }
  | { type: "pickService"; serviceId: string }
  | { type: "pickSlot"; slot: SlotDTO }
  | { type: "booked"; result: BookingResult }
  | { type: "taken" }
  | { type: "failed" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return { screen: "welcome" };
    case "start":
      return { screen: "service" };
    case "pickService":
      return { screen: "time", serviceId: action.serviceId };
    case "pickSlot":
      return state.screen === "time"
        ? { screen: "details", serviceId: state.serviceId, slot: action.slot }
        : state;
    case "back":
      if (state.screen === "service") return { screen: "welcome" };
      if (state.screen === "time") return { screen: "service" };
      if (state.screen === "details") return { screen: "time", serviceId: state.serviceId };
      return state;
    // A booking can only finish on Details: ignore it if the customer has left.
    case "booked":
      return state.screen === "details" ? { screen: "done", result: action.result } : state;
    case "taken":
      return state.screen === "details"
        ? { screen: "time", serviceId: state.serviceId, notice: "taken" }
        : state;
    case "failed":
      return state.screen === "details" ? { screen: "error" } : state;
  }
}

function findService(serviceId: string) {
  return SAMPLE_SERVICES.find((service) => service.id === serviceId) ?? SAMPLE_SERVICES[0];
}

export default function KioskPage() {
  const [state, dispatch] = useReducer(reducer, { screen: "welcome" });
  const { screen } = state;
  const reset = () => dispatch({ type: "reset" });
  const back = () => dispatch({ type: "back" });

  // Idle reset: any tap or typing restarts the timer.
  useEffect(() => {
    if (screen === "welcome") return;

    const resetAfterIdle = () =>
      setTimeout(() => dispatch({ type: "reset" }), shop.kiosk.idleResetSec * 1000);

    let timer = resetAfterIdle();
    const restart = () => {
      clearTimeout(timer);
      timer = resetAfterIdle();
    };

    window.addEventListener("pointerdown", restart);
    window.addEventListener("input", restart);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", restart);
      window.removeEventListener("input", restart);
    };
  }, [screen]);

  // Done and Error return to Welcome on their own.
  useEffect(() => {
    if (screen !== "done" && screen !== "error") return;

    const seconds = screen === "done" ? shop.kiosk.doneResetSec : shop.kiosk.errorResetSec;
    const timer = setTimeout(() => dispatch({ type: "reset" }), seconds * 1000);
    return () => clearTimeout(timer);
  }, [screen]);

  // Stands in for POST /api/book until prompt 1.3.
  function book(serviceLabel: string, slot: SlotDTO, firstName: string) {
    setTimeout(() => {
      if (SAMPLE_OUTCOME === "taken") return dispatch({ type: "taken" });
      if (SAMPLE_OUTCOME === "error") return dispatch({ type: "failed" });
      dispatch({
        type: "booked",
        result: {
          firstName,
          serviceLabel,
          startLabel: slot.label,
          backByLabel: SAMPLE_BACK_BY[slot.label],
          isNow: slot.isNow,
        },
      });
    }, 300);
  }

  function renderScreen() {
    switch (state.screen) {
      case "welcome":
        return <Welcome status={SAMPLE_STATUS} onStart={() => dispatch({ type: "start" })} />;
      case "service":
        return (
          <Service
            services={SAMPLE_SERVICES}
            onPick={(serviceId) => dispatch({ type: "pickService", serviceId })}
            onBack={back}
          />
        );
      case "time": {
        const service = findService(state.serviceId);
        return (
          <Time
            backLabel={`${service.label} · ${service.priceLabel}`}
            slots={SAMPLE_SLOTS}
            notice={state.notice}
            onPick={(slot) => dispatch({ type: "pickSlot", slot })}
            onBack={back}
          />
        );
      }
      case "details": {
        const { slot } = state;
        const { label } = findService(state.serviceId);
        return (
          <Details
            serviceLabel={label}
            slot={slot}
            onBook={(firstName) => book(label, slot, firstName)}
            onBack={back}
          />
        );
      }
      case "done":
        return <Done result={state.result} onDismiss={reset} />;
      case "error":
        return <ErrorScreen onRestart={reset} />;
    }
  }

  return (
    <div key={screen} className="flex flex-1 flex-col animate-fade motion-reduce:animate-none">
      {renderScreen()}
    </div>
  );
}
