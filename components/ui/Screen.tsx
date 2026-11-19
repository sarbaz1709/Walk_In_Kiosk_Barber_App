import type { ReactNode } from "react";
import { Button } from "./Button";

type ScreenProps = {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
};

export function Screen({ title, onBack, backLabel = "Back", children }: ScreenProps) {
  return (
    <main className="flex min-h-dvh w-full flex-1 flex-col p-12">
      {onBack && (
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack}>
            <svg
              aria-hidden="true"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </Button>
        </div>
      )}
      {title && <h1 className="mb-12 text-title">{title}</h1>}
      {children}
    </main>
  );
}
