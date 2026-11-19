import { shop } from "@/config/shop";
import { Button } from "@/components/ui/Button";
import { QrBlock } from "@/components/ui/QrBlock";
import { Screen } from "@/components/ui/Screen";
import type { KioskStatus } from "./types";

type WelcomeProps = {
  status: KioskStatus | null; // null = still loading
  onStart: () => void;
};

function headline(status: KioskStatus) {
  if (status.state === "open") return "Walk in?";
  return status.state === "before_open"
    ? `Walk-ins open at ${status.opensAt}.`
    : "Walk-ins are closed for today.";
}

export function Welcome({ status, onStart }: WelcomeProps) {
  const isOpen = status?.state === "open";

  return (
    <Screen>
      <p className="mb-12 text-body uppercase">{shop.name}</p>

      <h1 className="min-h-14 text-display">{status && headline(status)}</h1>
      {isOpen && <p className="mt-2 text-body">Book the next free time.</p>}

      {isOpen && (
        <div className="mt-12">
          <Button onClick={onStart}>Book a walk-in →</Button>
        </div>
      )}

      <div className="mt-12 text-body">
        <p>Have an appointment?</p>
        <p className="text-muted">Just have a seat.</p>
      </div>

      <div className="mt-auto pt-12">
        <div className="border-t border-line pt-8">
          <QrBlock />
        </div>
      </div>
    </Screen>
  );
}
