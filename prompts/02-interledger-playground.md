# Session 2 — Interledger playground

- **Tool:** Claude Code, model Claude Opus 5.5 (`claude-opus-5-5`)
- **Who prompted:** Santiago Viana (salviega)
- **Date:** 2026-10-16
- **Result:** the pnpm monorepo with `apps/web` (Next.js) and an Express app
  (later renamed `apps/cron`) that ran the incoming payment → quote →
  interactive outgoing-payment grant → payment flow with
  `@interledger/open-payments` (PR #1).

Prompts are copied verbatim, typos included.

## Prompt 1

```text
Crea en el monorepo un proyecto nextjs que sea el frontente y otro que un poreycot express de node para hacer unas pruebas en el uso de interledger entonces crar ambos repos
```
