import type { ReactNode } from "react";

// The moment before sending someone to their wallet is the peak of each flow
// (09 §7): what moves, what will happen, what will NOT happen, what can be
// undone. No scroll, no jargon.

type Row = { label: string; value: ReactNode };

export function AuthorizationCard({
  moves,
  willHappen,
  wontHappen,
  undo,
}: {
  moves: ReactNode;
  willHappen: ReactNode;
  wontHappen: ReactNode;
  undo: ReactNode;
}) {
  const rows: Row[] = [
    { label: "Qué se mueve", value: moves },
    { label: "Qué va a pasar", value: willHappen },
    { label: "Qué no pasa", value: wontHappen },
    { label: "Qué puedes deshacer", value: undo },
  ];
  return (
    <dl className="divide-y divide-divisor rounded-card-sm border border-linea bg-noche/40">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="label text-niebla">{row.label}</dt>
          <dd className="text-base text-hueso">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
