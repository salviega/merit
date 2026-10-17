# What this changes

<!-- What the reader gets that they did not have before, and why. Not a list
of files — that is what the diff is for. -->

## How it was verified

<!-- What you ran and what it proved. "Tests pass" says less than a specific
claim you can point to. For UI, a screenshot or the Vercel preview link. For
anything that moved on the Interledger test network, the resource URL. -->

## Money and grants

<!-- Delete this section if the PR touches none of `packages/core/open-payments`,
`apps/web/src/app/api` or `apps/cron`. Otherwise every box must be ticked. -->

- [ ] Every outgoing payment uses a token from an interactive grant whose `limits.debitAmount` was set by the wallet owner (the lender's quota or the borrower's `total_due`)
- [ ] Every interactive grant callback verifies the provider's `hash` against the stored `nonce` before continuing the grant
- [ ] Every write to the store goes through `withTransaction()`
- [ ] No access token, `manage_url` or private key reaches the browser, the repo or the logs

## Checklist

<!-- This list mirrors the pre-commit ritual of AGENTS.md — if you change one,
change the other. -->

- [ ] Tests were written before the implementation, and failed first
- [ ] `pnpm test` passes, coverage at 85% or above on `packages/core`
- [ ] `pnpm typecheck` is clean
- [ ] `pnpm lint` is clean
- [ ] No secret or sensitive data in code, URLs or logs
- [ ] `spec/`, `README.md` and `AGENTS.md` are still true after this change (completed items struck through in `07`)
- [ ] `CHANGELOG.md` has the entry (for `feat`, `fix` and breaking changes)
- [ ] `spec/feedback/01_interledger.md` has an entry if Interledger's docs or SDK surprised you

## Anything the reviewer should push back on

<!-- Shortcuts taken, decisions you are unsure about, things left for later.
Silence here reads as "nothing to question", which is rarely true. -->
