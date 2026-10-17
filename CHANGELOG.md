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

- `apps/cron/.env.example`: replaced by the root `.env.example`.
