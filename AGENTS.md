# Merit

A microcredit platform: people and financial entities put up liquidity
allowances, and Merit lends them to borrowers without a credit history, with
wallet-to-wallet disbursement and collection over Interledger Open Payments.

The definition lives in `spec/definicion/` (numbered documents);
`07_plan-de-trabajo.md` is the phased plan and doubles as the progress log —
completed items are struck through there. `08_roadmap.md` is what comes after
the hackathon. `09_marca-y-seo.md` is the brand, interface and SEO rulebook:
read it before touching anything a user sees. `03_bounties.md` is left as a
template; the hackathon's bounties are not a driver of this project.

## Language

English for everything technical: code, comments, identifiers, function
names, commit messages, PR descriptions, this file, the README and the
CHANGELOG.

Spanish for the definition documents under `spec/**`, and for the interface
copy (see `09_marca-y-seo.md` §6). Nothing else.

## Tooling

Node 22 (`.nvmrc`) and pnpm 12 through corepack. If `pnpm` is not on the
PATH, run `corepack enable` once, or prefix commands with `corepack pnpm`.
One `.env` at the repo root serves every app and script; `.env.example`
lists every key. Never commit `.env`, `*.key` or `*.pem`.

## Pre-commit

No commit lands without this, in this order. A failing step is a blocker, not
a warning to note and move past.

1. **Tests first, and they have failed once.** `pnpm test` passes, with
   coverage at 85% or above on `packages/core` — enforced by Vitest's own
   `coverage.thresholds`, so the command itself fails under the floor. A
   test that guards a promise in `05_stack-y-arquitectura.md` §5 — **a
   repayment never exceeds `total_due`, and an incoming payment is charged
   at most once** — was written before the code and seen failing for the
   expected reason. (Until `packages/core` exists, `pnpm test` runs nothing
   and passes.)
2. `pnpm typecheck` — clean.
3. `pnpm lint` — clean.
4. **Every outgoing payment goes through a grant with a cap the wallet owner
   set.** No code path creates an outgoing payment except with a token from
   an interactive grant whose `limits.debitAmount` is the lender's quota or
   the borrower's `total_due`, and every interactive grant callback verifies
   the `hash` against its `nonce` before continuing the grant. A change that
   touches `packages/core/open-payments`, `apps/web/src/app/api` or
   `apps/cron` is reviewed against this before anything else.
5. Review whether the change makes any of these stale, and update what it
   does: `spec/definicion/**` (strike through what the commit completes in
   `07`; if a risk closed, say which way), the README, `AGENTS.md`, and
   `.claude/`.
6. `CHANGELOG.md` — add the entry under `Unreleased`, with the evidence
   convention in CHANGELOG.md's own header (a screenshot or preview link for
   UI; the resource URL for anything that moved on the test network). **No
   version number and no version-file bump on a branch** (`package.json`):
   the number is assigned when the branch merges to `main` — patch for
   ordinary work, minor when a phase of the plan closes.
7. **Then check `spec/feedback/`.** Now that the entry above is written, ask
   whether this commit also surprised you about Interledger's docs or SDK —
   an opaque error, an undocumented limit, something that worked better
   than expected. If it is pertinent and worth keeping, it goes in
   `spec/feedback/01_interledger.md` the same day, with the exact evidence
   while it is still in front of you. Most commits have nothing here, and
   that is the normal case — do not pad the log to have made an entry.
8. Then, and only then, commit.
9. **If the branch has an open pull request, the body is part of the
   change.** Pushing a commit that adds a capability, a risk, a dependency or
   a decision means the description no longer matches what would be merged.
   Update it in the same breath as the push.

**Commit every day.** A day with no commit is a day the judges cannot see if
the sponsor checks commit history. Small commits, pushed.

**Do not watch the run after pushing.** No background monitor, no watching CI
run live — push and move on. The checks above already ran locally; CI is the
second opinion, not the first. When a failure does come back, reproduce it
locally before touching the fix.

Commits follow Conventional Commits, written in English.

## Commits

Conventional Commits, mandatory: `<type>(<scope>): <description>`

- Types: feat, fix, docs, refactor, perf, test, build, ci, chore
- Scope is optional. Use the affected module or area, lowercase, and stay
  consistent with the scopes that already appear in the repo's history
  (`spec`, `web`, `cron`, `core`, `api`).
- Description in imperative mood, lowercase, no trailing period, max 72
  characters
- Breaking change: `!` after the scope and a `BREAKING CHANGE: <what breaks>`
  footer

The body is optional. For `feat`, `fix` and breaking changes, the
`CHANGELOG.md` entry required below already carries the "what changed and
why it matters" — a body repeating that is redundant. For the types that
don't get a CHANGELOG entry (`docs`, `test`, `chore`, `ci`, `build`), there
is no such backstop: add a body whenever the header alone doesn't explain
the reasoning.

Validated by `.githooks/commit-msg` (POSIX sh, no dependency on any
runtime — it works the same no matter the stack). Git doesn't enable it on
its own: every fresh clone must run `git config core.hooksPath .githooks`
once. If the hook rejects the message, fix it. Never use `--no-verify`.

`feat`, `fix` and breaking changes also go into `CHANGELOG.md` under
`[Unreleased]`, following Keep a Changelog. `docs`, `test`, `chore`, `ci`
and `build` don't.

## Branches and deployment

Work happens on `feature/**` (or `fix/**`, `chore/**`, `docs/**`), never
directly on `main`. `main` is merged into only through a pull request, one
per phase of the work plan, merged by the project owner.

**CI runs on the pull request and nowhere else.** Pushing a branch spends no
minutes: the ritual already ran locally. The verdict is spent where it
decides something — on the merge.

| Trigger              | Effect                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| Push to `feature/**` | Nothing. No workflow is triggered                                       |
| Pull request         | CI: lint, typecheck, test, build; Vercel preview of the landing         |
| Merge to `main`      | Vercel deploys the landing (`apps/web` without the store) to production |

**The app itself runs on the demo machine.** Vercel serves only the landing
and the SEO surface of `apps/web`; its buttons point to `NEXT_PUBLIC_APP_URL`.
The full app — pages, `/api/*`, the JSON store — runs locally behind a
Cloudflare Tunnel (`pnpm tunnel`, then `pnpm dev`). A named tunnel with
`CLOUDFLARE_TUNNEL_TOKEN` gives a fixed hostname, which is `APP_URL`; without
a token the script falls back to a quick tunnel whose URL changes on every
start and has to be copied into `APP_URL`. `apps/cron` is the repayment
service, run by hand next to it; the store file and the Open Payments key
never leave that machine (`.vercelignore` keeps `apps/cron` out of uploads).

## Tests come first

Unit tests are written before the implementation, not after it. Write the
failing test, watch it fail for the reason you expect, then make it pass. A
test that has never failed has never proven anything.

- **`repayment never exceeds total_due`:** the last installment is cut to the
  exact remaining balance and the loan becomes `paid`. If it fails, the
  borrower is charged more than they approved — the provider's grant cap is
  the only thing left standing.
- **`an incoming payment is charged at most once`:** the same
  `receivedAmount` seen in two cycles yields one installment; an amount that
  grows in two parts yields two installments for the difference; the
  disbursement payment and anything before `disbursed_at` yield none.
- **`two processes writing the store serialize`:** two `withTransaction()`
  calls from two real processes on the same file lose no write and never
  duplicate `(loan_id, incoming_payment_id)`.
- **`the score is pure and bounded`:** an empty history is rejected, every
  input maps into 300–1000, and the offer never exceeds the largest
  available quota in the same currency.

**`repayment.ts` and the store don't carry a blanket coverage number.** They
rest on the tests named above, not on a uniform percentage — covering every
forbidden decision branch weighs more than a high number that only tests the
happy path.

## Security

The OWASP Top 10 is the baseline, applied to what this project actually
handles — other people's money, moved by delegated authorization:

- **Access tokens, `manage_url`s and the client private key never reach the
  browser, the repo or the logs.** The browser only ever receives the
  provider's redirect URL. Log grant and payment URLs, never tokens.
- **Every interactive grant uses `interact.finish` with a fresh `nonce`, and
  the callback verifies the provider's `hash` before continuing.** A callback
  that does not match is dropped, not retried.
- **The browser cannot choose its offer.** The score request is tied to an
  `httpOnly`, signed cookie; the server recomputes the maximum and the rate
  from the stored score when a loan is taken, and rejects anything above.
- **Every request body and every env variable is validated with `zod` at the
  boundary**; Open Payments responses that get stored are validated too.
- **No money moves without a grant from the wallet owner, capped by them.**
  See pre-commit step 4.
- **`APP_URL` comes from the environment only.** Redirect URIs are never
  built from request headers.

## Stack conventions

Reach for these when the need actually appears — installing a library ahead
of the need is how a small project stops being small:

| Need                | Choice                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Pages and `/api`    | Next.js 16 route handlers in `apps/web`                                                          |
| Styles              | Tailwind CSS 4 with the tokens of `09_marca-y-seo.md` in `globals.css`                           |
| Forms               | React 19 actions; no form library                                                                |
| Validation          | `zod`                                                                                            |
| Open Payments       | `@interledger/open-payments`, one authenticated client in `packages/core`                        |
| Shared state        | JSON file at `DATA_FILE`, written only through `withTransaction()` (`proper-lockfile` + `write-file-atomic`) |
| Tests               | Vitest with `@vitest/coverage-v8` in `packages/core`                                             |
| Running `apps/cron` | `tsx` in development, `node` on the built output                                                 |
| Public URL          | Cloudflare Tunnel, `pnpm tunnel` (`scripts/tunnel.mjs`)                                          |

## Open Payments and the store

Amounts are always `value` + `assetCode` + `assetScale` as the wallet
returns them: `value` is a bigint kept as a string, never a float, and the
UI converts with the wallet's scale. A loan matches one lender and one
currency.

Grants: the lender's quota and the borrower's repayment are `outgoing-payment`
grants with `limits.debitAmount` equal to the quota and to `total_due`; the
borrower's history is `incoming-payment` and `outgoing-payment` with
`list-all`/`read-all` and no `create`, revoked as soon as the score is
computed. Tokens are rotated through `manage_url` before use when expired.

The store is one JSON document validated by a `zod` schema. Every mutation
goes through `withTransaction()`, which takes the file lock, reads, applies,
validates and writes atomically. Reads outside a transaction are fine;
writes outside one are a bug.
