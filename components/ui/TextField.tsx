import { useId, type ComponentProps } from "react";

type TextFieldProps = Omit<ComponentProps<"input">, "onChange" | "value"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  invalid?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  invalid,
  ...input
}: TextFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  const isInvalid = invalid || Boolean(error);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-body">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`h-18 w-full rounded-field border bg-surface px-6 text-large placeholder:text-muted focus:outline-2 focus:outline-offset-2 focus:outline-ink ${isInvalid ? "border-danger" : "border-line"}`}
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
