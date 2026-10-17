import type { ComponentProps } from "react";

// States: empty · filled · with hint · with error (coral border, the text says
// what happened and what to do) · disabled with the reason in the hint.

type Props = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Unit shown at the end of the input, e.g. the wallet's currency. */
  suffix?: string;
  mono?: boolean;
};

export function Field({
  id,
  label,
  hint,
  error,
  suffix,
  mono = false,
  className = "",
  ...input
}: Props) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-hueso">
        {label}
      </label>
      <div
        className={`flex min-h-12 items-center rounded-control border bg-noche px-4 transition-colors focus-within:border-merito ${
          error ? "border-coral" : "border-linea-fuerte"
        } ${input.disabled ? "opacity-60" : ""}`}
      >
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`min-w-0 flex-1 bg-transparent py-3 text-base text-hueso outline-none placeholder:text-deshabilitado ${
            mono ? "num" : ""
          }`}
          {...input}
        />
        {suffix && <span className="label ml-3 text-niebla">{suffix}</span>}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-niebla">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-hueso">
          <span className="num text-coral">[ x ] </span>
          {error}
        </p>
      )}
    </div>
  );
}
