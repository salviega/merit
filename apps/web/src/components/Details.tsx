import type { ReactNode } from "react";

// "Lo técnico está a un clic" (09 §7): full wallet URLs, payment ids and
// references live behind this, in mono.

export function Details({
  summary = "Detalles",
  children,
}: {
  summary?: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-chip border border-linea bg-noche/40 px-4 py-3">
      <summary className="cursor-pointer select-none text-sm text-lavanda group-open:mb-3">
        {summary}
      </summary>
      <div className="num break-all text-sm text-niebla">{children}</div>
    </details>
  );
}
