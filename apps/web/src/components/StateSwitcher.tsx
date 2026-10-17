"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Each screen can show every one of its states from fixed example data,
// chosen with `?state=`, so a reviewer can walk through them without a
// wallet. Without `?state=` the screen runs the real flow.

export function useExampleState<T extends string>(states: readonly T[]): T | undefined {
  const params = useSearchParams();
  const value = params.get("state");
  return (states as readonly string[]).includes(value ?? "") ? (value as T) : undefined;
}

export function StateSwitcher<T extends string>({
  states,
  labels,
  current,
}: {
  states: readonly T[];
  labels: Record<T, string>;
  current: T | undefined;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Estados de ejemplo" className="flex flex-wrap items-center gap-2">
      <span className="label text-niebla">Estados de ejemplo</span>
      <Link
        href={pathname}
        aria-current={current === undefined ? "page" : undefined}
        className={`num rounded-chip border px-2 py-1 text-xs ${
          current === undefined ? "border-merito text-hueso" : "border-linea text-niebla hover:text-hueso"
        }`}
      >
        real
      </Link>
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
