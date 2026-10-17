# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versioning cadence, while pre-1.0:

- **Work on a branch adds its entry under `Unreleased`, with no version
  number.** A branch cannot know what number is free: two branches open at
  once both reach for the same one, and only whichever merges first is right.
- **The number is assigned when the branch merges to `main`**: the
  `Unreleased` entries become a released section, and the root
  `package.json` moves to match in the same commit.
- **Patch** for ordinary work, **minor** when a phase of
  [the work plan](./spec/definicion/07_plan-de-trabajo.md) closes.

Evidence conventions — what makes an entry verifiable instead of a claim:

- **Every UI change carries a screenshot or the Vercel preview link.**
- **Everything that moved on the Interledger test network carries the
  resource URL** (the incoming payment, outgoing payment or grant).
- **Every change to the score or the repayment math names the test that
  pins it.**

## [Unreleased]

### Added

- `packages/core`, the logic the web and the repayment service share, with
  Vitest and a coverage floor of 85 % enforced by the test command. The JSON
  store (`db/`): one document validated by a `zod` schema, every write
  through `withTransaction()` under a cross-process file lock with atomic
  writes, and `(loan_id, incoming_payment_id)` unique by construction.
  Pinned by `store.test.ts`, including two real processes writing the same
  file. The score (`score.ts`): `scoreFromHistory` and `offerFor` per 05 §6,
  pinned by `score.test.ts`.
- The borrower history read, lifted from the `fetch_wallet.js` PoC into
  `packages/core/open-payments`: read-only grant builders (never `create`),
  paginated history cut at 90 days, interaction `hash` verification, token
  rotation and revocation. Pinned by `grants.test.ts`, `history.test.ts`
  and `interaction.test.ts`.
- Flow 4.2 end to end in `apps/web`: `POST /api/score` starts the history
  grant and sets a signed `httpOnly` cookie; `GET /api/callbacks/score`
  verifies the provider's `hash`, continues the grant and computes the score
  after responding; `GET /api/score` returns the request's state and offer
  (never a token) and expires offers after 15 minutes. The borrowing widget
  runs this flow and polls while analysing; `?state=` keeps the example
  states. Evidence on the test network pending the client credentials; see
  `07` Fase 2.
- `pnpm seed:history`: pays a borrower test wallet several times from a
  payer wallet (and once back) with one interactive grant per paying wallet,
  so a fresh wallet has history to score.

- The merit web, replacing the Interledger playground: the brand kit's
  tokens, fonts (Outfit, DM Sans, JetBrains Mono) and assets; the landing
  (`/`) with the figures from the problem statement rendered on the server
  and the two paths, **Aportar liquidez** and **Pedir préstamo**;
  `/como-funciona`; `/lending` and `/borrowing` with every state of the
  design (04 §5–§6) driven by example data and a `?state=` switcher until the
  API exists. Components carry their states in their header comment; a
  disabled button always says why. Evidence: the Vercel preview of the
  phase 1 pull request, one screenshot per state.
- SEO surface from one source (`src/lib/site.ts`): title template,
  description, Open Graph and X card with the 1200×630 image, icons and
  manifest, canonical, JSON-LD (`WebApplication`), `robots.txt` and
  `sitemap.xml`. `/lending` and `/borrowing` are `noindex` (they depend on
  the wallet state); on Vercel the landing's buttons point to
  `NEXT_PUBLIC_APP_URL`, the app behind the tunnel.

- One `.env` at the repo root for every app and script, with `.env.example`
  listing every key. `apps/web` loads it from `next.config.ts` and
  `apps/cron` through `--env-file`, so the two processes that share the
  JSON store also share their configuration.
- `pnpm tunnel` (`scripts/tunnel.mjs`): opens the Cloudflare Tunnel towards
  the local app — a named tunnel with a fixed hostname when
  `CLOUDFLARE_TUNNEL_TOKEN` is set, a quick tunnel otherwise. The public URL
  is `APP_URL`, the base of every grant callback.
- Starter kit scaffold: `spec/definicion/` document chain, the `AGENTS.md`
  commit ritual, this `CHANGELOG.md`, `README.md`, `PROJECT_README.template.md`,
  the PR template, and a stack-agnostic `.gitignore`.
- `.githooks/commit-msg`: enforces the Conventional Commits rules from
  `AGENTS.md`. Written in POSIX sh so it runs without any language runtime;
  enable it per clone with `git config core.hooksPath .githooks`.
- pnpm monorepo with two apps for trying out Interledger Open Payments:
  `apps/web` (Next.js 16 playground UI) and `apps/cron` (Express 5 server
  using `@interledger/open-payments` to create the incoming payment, quote,
  and interactive outgoing-payment grant, then pay the quote).

### Changed

- The Open Payments client private key is read from
  `OPEN_PAYMENTS_PRIVATE_KEY` (the PEM, base64 in one line) instead of a
  `private.key` file, so the same value works wherever the app runs.

### Removed

- `apps/api/fetch_wallet.js`, the history PoC: absorbed into
  `packages/core/open-payments`.
- `apps/cron/.env.example`: replaced by the root `.env.example`.
