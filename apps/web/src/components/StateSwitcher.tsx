"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Until the API exists (work plan, phase 2) each screen shows its states from
// fixed example data, chosen with `?state=`. This strip lets a reviewer walk
// through every state of a screen.

export function useExampleState<T extends string>(states: readonly T[], fallback: T): T {
  const params = useSearchParams();
  const value = params.get("state");
  return (states as readonly string[]).includes(value ?? "") ? (value as T) : fallback;
}

export function StateSwitcher<T extends string>({
  states,
  labels,
  current,
}: {
  states: readonly T[];
  labels: Record<T, string>;
  current: T;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Estados de ejemplo" className="flex flex-wrap items-center gap-2">
      <span className="label text-niebla">Estados de ejemplo</span>
      {states.map((state) => (
        <Link
          key={state}
          href={`${pathname}?state=${state}`}
          aria-current={state === current ? "page" : undefined}
          className={`num rounded-chip border px-2 py-1 text-xs ${
            state === current
              ? "border-merito text-hueso"
              : "border-linea text-niebla hover:text-hueso"
          }`}
        >
          {labels[state]}
        </Link>
      ))}
    </nav>
  );
}
