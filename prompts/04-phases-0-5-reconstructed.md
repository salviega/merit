# Session 4 — Phases 0 to 5 (reconstructed, not verbatim)

- **Tool:** Claude Code. The model was not recorded.
- **Who prompted:** David Mejia
- **Dates:** 2026-10-16 and 2026-10-17 (commit times, UTC−4)
- **Result:** the PoC in `apps/api` (later absorbed), the work plan, and
  phases 0–5: `packages/core`, the current `apps/web`, `apps/cron`,
  `scripts/`, the brand, the public README, the demo script and the roadmap
  (PRs #4–#10).

> **This is not the original prompt log.** David's Claude Code session
> history was lost. This file was put together afterwards from what the
> repository does keep: the commit messages and pull-request descriptions of
> PRs #4–#10, all written during those sessions. Each entry says what Claude
> Code was asked to do and what came out of it. It is a summary in the third
> person, not a copy of what was typed. Where the record does not show a
> detail, the entry leaves it out.

## 1. History-read PoC — commit `8812fc0`

**Asked:** an Express server that requests a read-only Open Payments grant
(`incoming-payment` and `outgoing-payment` with `list`, `list-all`, `read`,
`read-all`, interactive), continues it on the callback, and lists a wallet's
full payment history as JSON and CSV, plus revoking the grant.

**Produced:** `apps/api/server.js`, `apps/api/package.json`, and
`apps/api/research-notes.md`. The notes record earlier research on sharing
Open Payments history with a third party, and their header says so. Later
moved to `apps/api/fetch_wallet.js/` and removed in phase 2, when its
history read moved into `packages/core`.

## 2. Work plan and the state decision — PR #4

**Asked:** write `07_plan-de-trabajo.md` from 04–06, in six phases that each
end demonstrable and verifiable, with calendar, cuts and risks. Add the
brand kit to `brand/` and write `09_marca-y-seo.md`. Change 05 and 06:
state moves from Neon Postgres to a local JSON file under a cross-process
lock, and the API runs on the demo machine behind a tunnel, with Vercel
keeping only the landing.

**Produced:** `spec/definicion/07_plan-de-trabajo.md`,
`09_marca-y-seo.md`, changes to `05` and `06`, `brand/`.

## 3. Phase 0, scaffold — PR #5

**Asked:** one `.env` at the root for every app and script, with the
Open Payments private key as base64 in `OPEN_PAYMENTS_PRIVATE_KEY`; a
`pnpm tunnel` script for Cloudflare Tunnel; and turning the template rules
of `AGENTS.md`, the PR template, `.gitignore`, `CHANGELOG.md` and
`spec/feedback/` into the project's real ones.

**Produced:** `.env.example`, `scripts/tunnel.mjs`, `apps/web/next.config.ts`,
`AGENTS.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.gitignore`,
`spec/feedback/01_interledger.md`.

## 4. Phase 1, brand, screens and SEO — PR #6

**Asked:** turn `apps/web` from the Interledger playground into the merit
web. Apply the brand kit, and build every screen of the design with all
its states driven by example data (`?state=`): landing, `/como-funciona`,
`/lending`, `/borrowing`. Add the SEO surface from one source.

**Produced:** `apps/web/src/**` (pages, components, `lib/site.ts`, metadata,
`robots`, `sitemap`, `manifest`), `apps/web/public/`.

## 5. Phase 2, store, score and history — PR #7

**Asked:** create `packages/core` with tests written first:
- the JSON store with transactions under a file lock and atomic writes;
- the score and offer exactly as 05 §6;
- the Open Payments client, the grant builders, interaction `hash`
  verification, token rotation, and the 90-day history read lifted from the
  PoC.

Then wire flow 4.2 end to end in `apps/web`: `POST /api/score`, the score
callback, `GET /api/score`, the borrowing widget. Add `pnpm seed:history`.

**Produced:** `packages/core/src/db/**`, `score.ts`,
`open-payments/**` and their tests, `apps/web/src/app/api/score`,
`apps/web/src/app/api/callbacks/score`, `scripts/seed-history.ts`. The
`apps/api/` folder was removed.

## 6. Phase 3, quotas, loans and disbursement — PR #8

**Asked:**
- Flows 4.1 and 4.3: the lender's quota grant capped at the quota, its
  callback, `GET /api/lenders`.
- `POST /api/loans`, re-applying the offer's cap on the server and
  reserving the quota in the same transaction.
- The repayment grant capped at `total_due`.
- Disbursement on the loan callback: incoming payment, quote, outgoing
  payment with the lender's token, rotating it once on 401/403.
- Reduce `apps/cron` to the repayment loop.

**Produced:** `packages/core/src/lending.ts`, `amount.ts`,
`open-payments/payments.ts`, `tokens.ts` and their tests,
`apps/web/src/app/api/lenders`, `loans`, `callbacks/lender`,
`callbacks/loan`, the Lending page and loan widget, `apps/cron/src/index.ts`.

## 7. Phase 4, automatic repayment — PR #9

**Asked:** the rule of 05 §5, tests first. Write a pure function that
charges the agreed share of what is new in each incoming payment. It never
charges the disbursement or anything before it, and never more than the
balance. Record each installment inside a transaction. Then write the
5-second cycle in `apps/cron`: retry failed installments as they are, list
the borrower's incoming payments since the disbursement, and pay the lender
with the borrower's token.

**Produced:** `packages/core/src/repayment.ts` and `repayment.test.ts`
(including three real processes on one file), `apps/cron/src/repay.ts`,
live polling on the loan screen.

## 8. Phase 5, README, demo and roadmap — PR #10

**Asked:** a public README a judge can read without help, a three-minute
demo script, the roadmap with the honest limitations, tests in CI, and a
fix for `pnpm seed:history`. The fix added `"type": "module"` and the
script's dependencies to the root `package.json`.

**Produced:** `README.md`, `spec/demo.md`, `spec/definicion/08_roadmap.md`,
`spec/README.md`, `.github/workflows/ci.yml` (test step), root
`package.json`.
