import { OptionTile } from "@/components/ui/OptionTile";
import { Screen } from "@/components/ui/Screen";
import type { ServiceDTO } from "./types";

type ServiceProps = {
  services: ServiceDTO[] | null; // null = still loading
  onPick: (serviceId: string) => void;
  onBack: () => void;
};

const PLACEHOLDERS = [1, 2, 3, 4, 5, 6];

export function Service({ services, onPick, onBack }: ServiceProps) {
  return (
    <Screen title="What are you getting?" onBack={onBack}>
      <div className="grid grid-cols-2 gap-4">
        {services === null &&
          PLACEHOLDERS.map((box) => (
            <div key={box} className="min-h-28 rounded-tile bg-surface" />
          ))}
        {services?.map((service) => (
          <OptionTile
            key={service.id}
            label={service.label}
            detail={service.priceLabel}
            onClick={() => onPick(service.id)}
          />
        ))}
      </div>
      <p className="mt-8 text-body text-muted">Something else? Please ask the barber.</p>
    </Screen>
  );
}
