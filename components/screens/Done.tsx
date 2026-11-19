import { Screen } from "@/components/ui/Screen";
import type { BookingResult } from "./types";

type DoneProps = {
  result: BookingResult;
  onDismiss: () => void;
};

export function Done({ result, onDismiss }: DoneProps) {
  const { firstName, serviceLabel, startLabel, backByLabel, isNow } = result;

  return (
    <div className="flex flex-1 flex-col" onClick={onDismiss}>
      <Screen>
        <svg
          aria-hidden="true"
          className="mb-8"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>

        {isNow ? (
          <>
            <h1 className="text-display">You&apos;re next, {firstName}.</h1>
            <p className="mt-2 text-body">Have a seat.</p>
          </>
        ) : (
          <>
            <h1 className="text-display">You&apos;re booked, {firstName}.</h1>
            <p className="mt-2 text-large">
              {serviceLabel} · {startLabel}
            </p>
            <div className="mt-8 text-body">
              <p>Please be back by {backByLabel}.</p>
              <p className="text-muted">Feel free to step out until then.</p>
            </div>
          </>
        )}
      </Screen>
    </div>
  );
}
