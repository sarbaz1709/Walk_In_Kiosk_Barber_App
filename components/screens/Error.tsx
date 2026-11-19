import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";

type ErrorScreenProps = {
  onRestart: () => void;
};

export function ErrorScreen({ onRestart }: ErrorScreenProps) {
  return (
    <Screen>
      <h1 className="text-title">Something went wrong.</h1>
      <p className="mt-2 text-body">Please let the barber know you&apos;re here.</p>
      <div className="mt-12">
        <Button variant="secondary" onClick={onRestart}>
          Back to start
        </Button>
      </div>
    </Screen>
  );
}
