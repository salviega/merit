import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

// States: merito (primary action) · senal (the lender's path, confirmations) ·
// secondary · disabled with a written reason · loading.
// A disabled button always says why (09 §3.3): never a mute grey button.

type Tone = "merito" | "senal" | "secondary";

const tones: Record<Tone, string> = {
  merito: "bg-merito text-white hover:bg-[#5b3be6]",
  senal: "bg-senal text-noche hover:bg-[#b6e22a]",
  secondary:
    "border border-linea-fuerte bg-transparent text-hueso hover:border-niebla",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 py-3 font-sans text-base font-medium transition-colors focus-visible:outline-merito";

type Common = {
  tone?: Tone;
  loading?: boolean;
  /** Why the button is disabled. Required whenever `disabled` is true. */
  reason?: string;
  children: ReactNode;
  className?: string;
};

type AsButton = Common &
  Omit<ComponentProps<"button">, "children" | "className"> & { href?: never };
type AsLink = Common & { href: string; disabled?: boolean };

export function Button(props: AsButton | AsLink) {
  const {
    tone = "merito",
    loading = false,
    reason,
    children,
    className = "",
    ...rest
  } = props;
  const disabled = Boolean(rest.disabled) || loading;
  const look = disabled
    ? "cursor-not-allowed border border-linea bg-grafito text-deshabilitado"
    : tones[tone];
  const classes = `${base} ${look} ${className}`;

  const content = (
    <>
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </>
  );

  const button =
    "href" in props && props.href !== undefined ? (
      disabled ? (
        <span className={classes} aria-disabled>
          {content}
        </span>
      ) : (
        <Link href={props.href} className={classes}>
          {content}
        </Link>
      )
    ) : (
      <button
        {...(rest as ComponentProps<"button">)}
        disabled={disabled}
        aria-busy={loading || undefined}
        className={classes}
      >
        {content}
      </button>
    );

  if (disabled && reason) {
    return (
      <div className="flex flex-col gap-2">
        {button}
        <p className="text-sm text-niebla">{reason}</p>
      </div>
    );
  }
  return button;
}
