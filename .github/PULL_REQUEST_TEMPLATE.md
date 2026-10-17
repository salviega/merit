# What this changes

<!-- What the reader gets that they did not have before, and why. Not a list
of files — that is what the diff is for. -->

## How it was verified

<!-- What you ran and what it proved. "Tests pass" says less than a specific
claim you can point to. -->

## [Sección específica del dominio — bórrala o renómbrala]

<!-- [ADAPTAR] Ejemplo real de Moor: "Contracts and chain" — checklist de
     qué revisar cuando el PR toca contratos/despliegues. Tu equivalente
     puede ser "Database" (migraciones), "Design" (capturas de antes/
     después), lo que corresponda al núcleo técnico del proyecto. Bórrala
     entera si no aplica a este PR — deja la nota de "delete this section if
     not applicable" como en el original. -->

- [ ] _—_

## Checklist

<!-- [ADAPTAR] Esta lista debe reflejar EXACTAMENTE el ritual de commit de
     AGENTS.md — si cambias uno, cambia el otro. -->

- [ ] Tests were written before the implementation, and failed first
- [ ] `[test command]` passes[, coverage at [X]% or above where that applies]
- [ ] `[typecheck command]` is clean
- [ ] `[lint command]` is clean
- [ ] No secret or sensitive data in code, URLs or logs
- [ ] `spec/`, `README.md` and `AGENTS.md` are still true after this change
- [ ] `CHANGELOG.md` has the entry

## Anything the reviewer should push back on

<!-- Shortcuts taken, decisions you are unsure about, things left for later.
Silence here reads as "nothing to question", which is rarely true. -->
