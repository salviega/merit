import type { ComponentProps, ReactNode } from "react";

// A Grafito surface with a Línea border. `eyebrow` is the mono label on top.

type Props = ComponentProps<"section"> & {
  eyebrow?: string;
  title?: ReactNode;
  compact?: boolean;
};

export function Card({
  eyebrow,
  title,
  compact = false,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <section
      {...rest}
      className={`border border-linea bg-grafito ${
        compact ? "rounded-card-sm p-5" : "rounded-card p-6 sm:p-8"
      } ${className}`}
    >
      {eyebrow && <p className="label mb-3 text-lavanda">{eyebrow}</p>}
      {title && (
        <h2 className="mb-4 font-display text-2xl font-semibold leading-tight tracking-tight">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
