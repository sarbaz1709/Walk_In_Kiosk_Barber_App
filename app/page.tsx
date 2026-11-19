"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { shop } from "@/config/shop";
import { Details } from "@/components/screens/Details";
import { Done } from "@/components/screens/Done";
import { ErrorScreen } from "@/components/screens/Error";
import { Service } from "@/components/screens/Service";
import { Time } from "@/components/screens/Time";
import { Welcome } from "@/components/screens/Welcome";
import type {
  BookingResult,
  CustomerField,
  KioskStatus,
  ServiceDTO,
  SlotDTO,
} from "@/components/screens/types";

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
      return { screen: "error" };
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export default function KioskPage() {
  const [state, dispatch] = useReducer(reducer, { screen: "welcome" });
  const [status, setStatus] = useState<KioskStatus | null>(null);
  const [services, setServices] = useState<ServiceDTO[] | null>(null);
  const [slots, setSlots] = useState<SlotDTO[] | null>(null);
  const latestSlotsRequest = useRef(0);
  const { screen } = state;

  // Refresh the shop's status and services every time Welcome appears.
  useEffect(() => {
    if (screen !== "welcome") return;

    const fail = () => dispatch({ type: "failed" });
    getJson<KioskStatus>("/api/status").then(setStatus).catch(fail);
    getJson<{ services: ServiceDTO[] }>("/api/services")
      .then((data) => setServices(data.services))
      .catch(fail);
  }, [screen]);

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

  async function loadSlots(serviceId: string) {
    const request = ++latestSlotsRequest.current;
    setSlots(null);
    try {
      const data = await getJson<{ slots: SlotDTO[] }>(
        `/api/slots?service=${encodeURIComponent(serviceId)}`,
      );
      if (request === latestSlotsRequest.current) setSlots(data.slots);
    } catch {
      if (request === latestSlotsRequest.current) dispatch({ type: "failed" });
    }
  }

  function pickService(serviceId: string) {
    dispatch({ type: "pickService", serviceId });
    loadSlots(serviceId);
  }

  function back() {
    if (state.screen === "details") loadSlots(state.serviceId);
    if (state.screen === "time") latestSlotsRequest.current++; // drop any pending response
    dispatch({ type: "back" });
  }

  async function book(
    serviceId: string,
    slot: SlotDTO,
    firstName: string,
    phone: string,
  ): Promise<CustomerField[] | undefined> {
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: serviceId, start: slot.start, firstName, phone }),
      });
      const body = await response.json();

      if (response.ok) {
        dispatch({ type: "booked", result: body });
        return;
      }
      if (response.status === 409) {
        latestSlotsRequest.current++;
        setSlots(body.slots);
        dispatch({ type: "taken" });
        return;
      }
      if (response.status === 423) {
        dispatch({ type: "reset" }); // Welcome reloads and shows the closed state
        return;
      }
      if (response.status === 400) {
        const fields = (body.fields as string[]).filter(
          (field): field is CustomerField => field === "firstName" || field === "phone",
        );
        if (fields.length > 0) return fields;
      }
    } catch {
      // Network failure or an unreadable response: handled below.
    }
    dispatch({ type: "failed" });
  }

  function renderScreen() {
    switch (state.screen) {
      case "welcome":
        return <Welcome status={status} onStart={() => dispatch({ type: "start" })} />;
      case "service":
        return <Service services={services} onPick={pickService} onBack={back} />;
      case "time": {
        const service = services?.find((candidate) => candidate.id === state.serviceId);
        return (
          <Time
            backLabel={service ? `${service.label} · ${service.priceLabel}` : "Back"}
            slots={slots}
            notice={state.notice}
            onPick={(slot) => dispatch({ type: "pickSlot", slot })}
            onBack={back}
          />
        );
      }
      case "details": {
        const { serviceId, slot } = state;
        const service = services?.find((candidate) => candidate.id === serviceId);
        return (
          <Details
            serviceLabel={service?.label ?? ""}
            slot={slot}
            onBook={(firstName, phone) => book(serviceId, slot, firstName, phone)}
            onBack={back}
          />
        );
      }
      case "done":
        return <Done result={state.result} onDismiss={() => dispatch({ type: "reset" })} />;
      case "error":
        return <ErrorScreen onRestart={() => dispatch({ type: "reset" })} />;
    }
  }

  return (
    <div key={screen} className="flex flex-1 flex-col animate-fade motion-reduce:animate-none">
      {renderScreen()}
    </div>
  );
}
