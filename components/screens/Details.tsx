import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import type { CustomerField, SlotDTO } from "./types";

type DetailsProps = {
  serviceLabel: string;
  slot: SlotDTO;
  // Resolves with the fields the server rejected, if the customer can fix them.
  onBook: (firstName: string, phone: string) => Promise<CustomerField[] | undefined>;
  onBack: () => void;
};

const NAME_PATTERN = /^\p{L}[\p{L} '’-]*$/u;

function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatPhone(digits: string) {
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function Details({ serviceLabel, slot, onBook, onBack }: DetailsProps) {
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState(false);
  const [rejected, setRejected] = useState<CustomerField[]>([]);

  const name = firstName.trim();
  const isValid = name.length <= 30 && NAME_PATTERN.test(name) && phone.length === 10;

  const summary = `${serviceLabel} · ${slot.isNow ? "Now" : `Today ${slot.label}`}`;
  const bookLabel = slot.isNow ? "Book now" : `Book ${slot.label}`;

  async function book() {
    setBooking(true);
    setRejected([]);
    const fields = await onBook(name, phone);
    if (fields) {
      setRejected(fields);
      setBooking(false);
    }
  }

  return (
    <Screen title={summary} onBack={booking ? undefined : onBack}>
      <div className="flex flex-col gap-6">
        <TextField
          label="First name"
          placeholder="Carlos"
          value={firstName}
          onChange={(value) => {
            setFirstName(capitalizeFirst(value));
            setRejected([]);
          }}
          invalid={rejected.includes("firstName")}
          maxLength={30}
          autoCapitalize="words"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <TextField
          label="Phone number"
          placeholder="(403) 555-0123"
          hint="For your booking confirmation."
          value={formatPhone(phone)}
          onChange={(value) => {
            setPhone(phoneDigits(value));
            setRejected([]);
          }}
          invalid={rejected.includes("phone")}
          inputMode="tel"
          autoComplete="off"
        />
      </div>
      <div className="mt-8">
        <Button disabled={!isValid || booking} onClick={book}>
          {booking ? "Booking…" : bookLabel}
        </Button>
      </div>
    </Screen>
  );
}
