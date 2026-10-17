# AI Usage Disclosure

## Tools Used

- **Claude Code** with **Claude Opus 5.5** (`claude-opus-5-5`), Anthropic's
  agentic coding CLI: it reads the repo, runs commands, edits files, and
  opens commits and pull requests when asked.

<!-- TODO(David Mejia): add any tool you used for phases 0–5 that is not
     listed here (for example Claude Code, Cursor, Copilot, ChatGPT). -->

## Where and How We Used AI

### 1. Repository setup — the whole skeleton

Files: `AGENTS.md`, `CHANGELOG.md`, `.github/PULL_REQUEST_TEMPLATE.md`,
`.github/workflows/ci.yml`, `.githooks/commit-msg`, `.gitignore`,
`.vercelignore`, `.nvmrc`, root `package.json`.

- Used Claude Code to copy the team's hackathon starter kit into the repo,
  then to replicate the commit hook, CI workflow and Vercel setup of our
  previous project.
- Used Claude Code to create and configure the Vercel project (root
  directory `apps/web`, Next.js preset).
- We chose the workflow (Conventional Commits, branch → PR → `main`, CI on
  pull requests only).

Prompts: [`prompts/01-bootstrap-starter-kit.md`](./prompts/01-bootstrap-starter-kit.md),
[`prompts/03-setup-spec-readme.md`](./prompts/03-setup-spec-readme.md) (prompts 1–2).

### 2. First Open Payments playground — PR #1

Files: the first versions of `apps/web` and `apps/cron` (then an Express
server).

- Used Claude Code to scaffold the Next.js app and the Express server
  running incoming payment → quote → interactive outgoing-payment grant →
  outgoing payment with `@interledger/open-payments`.
- This code was replaced in phases 2–4 (section 4). None of it is in the
  current `apps/cron`.

Prompts: [`prompts/02-interledger-playground.md`](./prompts/02-interledger-playground.md).

### 3. Specification — `spec/definicion/01` to `06`

- **`01_contexto-y-problema.md` and `02_solucion.md`:** we wrote the
  context, problem, solution and sources ourselves (pasted in prompt 3).
  Claude Code arranged that text into the templates and added the closing
  question of 01 and each actor's alternative in 02.
- **`04_diseno-de-solucion.md`, `05_stack-y-arquitectura.md`,
  `06_tecnologias.md`:** we described the product flow (home with Lending
  and Borrowing, the lender's quota grant, the history grant and score, the
  repayment grant, disbursement on callback, the 5-second repayment
  service). Claude Code turned it into the design, data model, state
  machines, architecture and stack inventory. It also checked the grant
  access actions and `GET /incoming-payments` against the OpenAPI specs
  bundled in `@interledger/open-payments`.
- We changed the design afterwards: `07_plan-de-trabajo.md` replaced
  Postgres with a local JSON store.

Prompts: [`prompts/03-setup-spec-readme.md`](./prompts/03-setup-spec-readme.md) (prompts 3–5).

### 4. Application code — phases 0 to 5

Files: `packages/core/**` (store, score, lending, repayment, Open Payments
client, grants, history, payments, token rotation, and their tests),
`apps/web/src/app/**` (landing, `/lending`, `/borrowing`, `/api/*` route
handlers), `apps/cron/src/**` (repayment loop), `scripts/`,
`spec/definicion/07_plan-de-trabajo.md`, `08_roadmap.md`, `spec/demo.md`,
`brand/`.

<!-- TODO(David Mejia): these were committed from your machine (PRs #4–#10).
     State which tool you used, for which of these files, and which ones
     you wrote with little or no AI. Add your prompts as
     prompts/04-*.md onwards. -->

_To be completed by David Mejia._

### 5. Documentation — `README.md`

- Phase 5 (PR #10) wrote the public README; see section 4.
- Used Claude Code to add the repository layout, stack, API, configuration
  and scripts sections (PR #11). It checked each API row against its route
  handler and each variable against `.env.example`.

Prompts: [`prompts/03-setup-spec-readme.md`](./prompts/03-setup-spec-readme.md) (prompts 10–11).

### 6. This disclosure

- Used Claude Code to draft this file and to extract the `prompts/` logs
  verbatim from the local Claude Code session history.

Prompts: [`prompts/03-setup-spec-readme.md`](./prompts/03-setup-spec-readme.md) (prompt 12).

## Little or No AI

- **The pitch:** the context, problem and solution text and the research
  behind its sources (`spec/definicion/01` and `02`).
- **Product decisions:** the flow in section 3, the choice of Interledger
  Open Payments, and the merge decisions on each PR.

<!-- TODO(David Mejia): list the files you wrote with little or no AI. -->

## What We Did Ourselves

- Defined the problem, the product and the end-to-end flow.
- Decided what was merged to `main`, pull request by pull request.

## Prompt Log

Every prompt is in [`prompts/`](./prompts/), copied verbatim from the Claude
Code session history:

| File | Session |
| ---- | ------- |
| [`01-bootstrap-starter-kit.md`](./prompts/01-bootstrap-starter-kit.md) | Repository bootstrap from the starter kit |
| [`02-interledger-playground.md`](./prompts/02-interledger-playground.md) | First Open Payments playground (PR #1) |
| [`03-setup-spec-readme.md`](./prompts/03-setup-spec-readme.md) | Setup, CI and Vercel; spec 01–06; README; this disclosure |
