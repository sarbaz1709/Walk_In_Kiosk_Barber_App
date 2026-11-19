import { OptionTile } from "@/components/ui/OptionTile";
import { QrBlock } from "@/components/ui/QrBlock";
import { Screen } from "@/components/ui/Screen";
import type { SlotDTO } from "./types";

type TimeProps = {
  backLabel: string;
  slots: SlotDTO[] | null; // null = still loading
  notice?: "taken";
  onPick: (slot: SlotDTO) => void;
  onBack: () => void;
};

const PLACEHOLDERS = [1, 2, 3, 4, 5, 6];

export function Time({ backLabel, slots, notice, onPick, onBack }: TimeProps) {
  return (
    <Screen title="Pick a time today" onBack={onBack} backLabel={backLabel}>
      {notice === "taken" && (
        <p className="mb-8 text-body">That time was just taken. Please pick another.</p>
      )}

      {slots === null && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {PLACEHOLDERS.map((box) => (
              <div key={box} className="min-h-20 rounded-tile bg-surface" />
            ))}
          </div>
          <p className="mt-8 text-body text-muted">Checking today&apos;s schedule…</p>
        </>
      )}

      {slots?.length === 0 && (
        <>
          <p className="mb-12 text-body">No walk-in times left today.</p>
          <QrBlock />
        </>
      )}

      {slots && slots.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {slots.map((slot, index) => (
              <OptionTile
                key={slot.start}
                label={slot.isNow ? "Now" : slot.label}
                highlight={index === 0}
                onClick={() => onPick(slot)}
              />
            ))}
          </div>
          <p className="mt-8 text-body text-muted">
            Times shown are free on today&apos;s schedule.
          </p>
        </>
      )}
    </Screen>
  );
}
