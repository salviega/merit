import type { ReactNode } from "react";

// A status line. Colour never travels alone (09 §3.2): every state carries a
// mono prefix. ok [OK] · warn [ ! ] · error [ x ] · info [ · ]

type Kind = "ok" | "warn" | "error" | "info";

const marks: Record<Kind, { prefix: string; tone: string }> = {
  ok: { prefix: "[OK]", tone: "text-senal" },
  warn: { prefix: "[ ! ]", tone: "text-ambar" },
  error: { prefix: "[ x ]", tone: "text-coral" },
  info: { prefix: "[ · ]", tone: "text-lavanda" },
};

export function Status({
  kind,
  children,
  className = "",
}: {
  kind: Kind;
  children: ReactNode;
  className?: string;
}) {
  const { prefix, tone } = marks[kind];
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`text-base ${className}`}>
      <span className={`num mr-2 ${tone}`}>{prefix}</span>
      {children}
    </p>
  );
}
