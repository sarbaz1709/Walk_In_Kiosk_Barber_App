type OptionTileProps = {
  label: string;
  detail?: string;
  highlight?: boolean;
  onClick: () => void;
};

export function OptionTile({ label, detail, highlight, onClick }: OptionTileProps) {
  const colors = highlight
    ? "border-ink bg-ink text-bg"
    : "border-line bg-surface text-ink";
  const shape = detail
    ? "min-h-28 items-start px-6 text-left"
    : "min-h-20 items-center px-4 text-center";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col justify-center rounded-tile border touch-manipulation active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${colors} ${shape}`}
    >
      <span className="text-large">{label}</span>
      {detail && (
        <span className={`text-body ${highlight ? "text-bg" : "text-muted"}`}>
          {detail}
        </span>
      )}
    </button>
  );
}
