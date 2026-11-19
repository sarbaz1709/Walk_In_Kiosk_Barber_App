import type { ComponentProps } from "react";

const base =
  "inline-flex items-center justify-center text-large touch-manipulation active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const variants = {
  primary:
    "h-22 w-full rounded-tile bg-ink text-bg disabled:bg-line disabled:text-muted",
  secondary: "h-22 w-full rounded-tile border border-line bg-bg text-ink",
  ghost: "h-16 min-w-16 gap-2 rounded-tile text-ink",
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
};

export function Button({ variant = "primary", ...props }: ButtonProps) {
  return (
    <button type="button" className={`${base} ${variants[variant]}`} {...props} />
  );
}
