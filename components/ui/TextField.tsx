import { useId, type ComponentProps } from "react";

type TextFieldProps = Omit<ComponentProps<"input">, "onChange" | "value"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
};

export function TextField({ label, value, onChange, hint, error, ...input }: TextFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-body">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className="h-18 w-full rounded-field border border-line bg-surface px-6 text-large placeholder:text-muted focus:outline-2 focus:outline-offset-2 focus:outline-ink"
        {...input}
      />
      {note && (
        <p id={noteId} className={`text-small ${error ? "text-danger" : "text-muted"}`}>
          {note}
        </p>
      )}
    </div>
  );
}
