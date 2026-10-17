# Merit

<!-- [ADAPT] One or two sentences: what the project is and what problem it
     solves. Same pitch as spec/definicion/02_solucion.md, summarized. -->

A microcredit platform: people and financial entities put up liquidity
allowances, and Merit lends them to borrowers without a credit history, with
wallet-to-wallet disbursement and collection over Interledger Open Payments.

The definition lives in `spec/definicion/` (numbered documents);
`07_plan-de-trabajo.md` is the phased plan and doubles as the progress log —
completed items are struck through there. `08_roadmap.md` is what comes after
the hackathon, if it exists. Read `03_bounties.md` before touching anything a
judge will see, if the hackathon has sponsor bounties.

## Language

<!-- [ADAPT] This section is a real decision, not filler. Write your own:
     what language the code/UI/public README use, and what language
     `spec/definicion/**` uses — they don't have to match. The example below
     is Moor's pattern (spec in Spanish, everything technical in English
     because the judges read English); delete it and decide yours. -->

English for everything technical: code, comments, identifiers, function
names, commit messages, PR descriptions, this file, the README and the
CHANGELOG.

Spanish for the definition documents under `spec/definicion/**`. Nothing else.

## Pre-commit

No commit lands without this, in this order. A failing step is a blocker, not
a warning to note and move past.

<!-- [ADAPT] This is the skeleton that works for any stack. Fill in the real
     commands (test runner, linter, typecheck) and decide whether step 4
     (enforcing the critical promise) applies to your project — most
     projects with money, sensitive data, or hardware in the loop need it;
     an internal CRUD probably doesn't. -->

1. **Tests first, and they have failed once.** `[test command]` passes[,
   coverage at [X]% or above on [which folder/package] — enforced by the
   test runner's own threshold config, so the command itself fails under the
   floor; never a separate "check the %" step]. A test that guards a promise
   in `04_diseno-de-solucion.md` — [name the critical invariant from 05 §5
   here] — was written before the code and seen failing for the expected
   reason.

   <!-- [ADAPT] A number (80-90% is a reasonable default for your own
        business logic) ONLY makes sense where "more tests is better" holds
        in general — domain code, utilities, transformations. Delete it
        entirely if the project doesn't have that kind of code, or if it's
        too early to fix a number. See the note under "Tests come first"
        below on why this same number should NOT apply to contracts,
        migrations, or any small and critical piece. -->

2. `[typecheck command]` — clean.
3. `[lint/format command]` — clean.
4. **[Name here the step that enforces the rule that can't fail.]**
   <!-- Real example from Moor: "Every signable function has its ERC-7730
        descriptor and a Speculos screen." Your equivalent might be "every
        endpoint that touches money has its authorization test", "every
        migration has a rollback", etc. Delete if not applicable. -->
5. Review whether the change makes any of these stale, and update what it
   does: `spec/definicion/**` (strike through what the commit completes in
   `07`; if a risk closed, say which way), the README, `AGENTS.md`, and
   `.claude/`.
6. `CHANGELOG.md` — add the entry under `Unreleased`[, with the evidence
   convention your project uses — see CHANGELOG.md's own header]. **No
   version number and no version-file bump on a branch** (`package.json`,
   `pyproject.toml`, `Cargo.toml`, or whatever the stack uses): the number is
   assigned when the branch merges to `main` — patch for ordinary work, minor
   when a phase of the plan closes.
7. **Then check `spec/feedback/`** (if it exists). Now that the entry above
   is written, ask whether this commit also surprised you about a sponsor's
   docs or SDK — an opaque error, an undocumented limit, something that
   worked better than expected. If it is pertinent and worth keeping, it goes
   in the matching file the same day, with the exact evidence while it is
   still in front of you. Most commits have nothing here, and that is the
   normal case — do not pad the log to have made an entry.
8. Then, and only then, commit.
9. **If the branch has an open pull request, the body is part of the
   change.** Pushing a commit that adds a capability, a risk, a dependency or
   a decision means the description no longer matches what would be merged.
   Update it in the same breath as the push.

<!-- [ADAPT] Delete this paragraph if the hackathon doesn't disqualify for
     commit history — but most do, and it's worth saying explicitly anyway. -->

**Commit every day.** A day with no commit is a day the judges cannot see if
the sponsor checks commit history. Small commits, pushed.

**Do not watch the run after pushing.** No background monitor, no watching CI
run live — push and move on. The checks above already ran locally; CI is the
second opinion, not the first. When a failure does come back, reproduce it
locally before touching the fix.

Commits follow Conventional Commits, written in [English/Spanish — decide].

## Commits

Conventional Commits, mandatory: `<type>(<scope>): <description>`

- Types: feat, fix, docs, refactor, perf, test, build, ci, chore
- Scope is optional. Use the affected module or area, lowercase, and stay
  consistent with the scopes that already appear in the repo's history.
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

Work happens on `feature/**` (or `fix/**`, `chore/**`), never directly on
`main`. `main` is merged into only through a pull request.

**CI runs on the pull request and nowhere else.** Pushing a branch spends no
minutes: the ritual already ran locally. The verdict is spent where it
decides something — on the merge.

| Trigger              | Effect                                         |
| --------------------- | ----------------------------------------------- |
| Push to `feature/**` | Nothing. No workflow is triggered              |
| Pull request          | CI: lint, typecheck, build; Vercel preview of `apps/web` |
| Merge to `main`      | Vercel deploys `apps/web` to production        |

**`apps/cron` is run by hand.** Vercel only builds `apps/web` (its root
directory); the cron app and its Open Payments key never leave the machine
that runs it (`.vercelignore` keeps them out of uploads).

## Tests come first

Unit tests are written before the implementation, not after it. Write the
failing test, watch it fail for the reason you expect, then make it pass. A
test that has never failed has never proven anything.

<!-- [ADAPT] Name here the 2-4 tests that truly carry the product — the ones
     where, if they fail, it means the core promise from 04/05 broke. Don't
     list trivial tests; this is a short, deliberate list, not coverage. -->

- **[Critical test name 1]:** _what it guarantees, and what happens if it
  fails._
- **[Critical test name 2]:** _what it guarantees._

<!-- [ADAPT] If you have a coverage threshold (ritual step 1), say explicitly
     what it does NOT apply to and why — the distinction that matters:
     general domain code benefits from a number; a small and critical piece
     (a contract, an authorization function, a migration) benefits more from
     these named tests covering every decision branch than from hitting a
     uniform percentage. A critical module at 80% that covers everything
     forbidden is worth more than one at 95% that only tested the happy
     path. Delete this whole block if the distinction doesn't apply. -->

**[The critical piece] doesn't carry a blanket coverage number.** It rests on
the tests named above, not on a uniform percentage — covering every
forbidden decision branch weighs more than a high number that only tests the
happy path.

## Security

<!-- [ADAPT] OWASP Top 10 as the baseline, but the list below must be
     SPECIFIC to what your project actually handles — not a copied generic
     list. Ask yourself: what's the worst that can happen here, and how is
     it prevented structurally (not with a promise)? -->

The OWASP Top 10 is the baseline, applied to what this project actually
handles:

- _—_
- _—_

## Stack conventions

<!-- [ADAPT] A "when to use what" table — only for decisions that genuinely
     cause repeated doubts (client state, forms, icons, HTTP calls). Don't
     fill it with more than 8-10 rows; if you need more, it's probably
     content for 06, not here. -->

Reach for these when the need actually appears — installing a library ahead
of the need is how a small project stops being small:

| Need | Choice |
| ---- | ------ |
| _—_  | _—_    |

## [Name the core technical work here]

<!-- [ADAPT] In Moor this section was called "Contract and chain work" (it
     was a smart-contract project). Rename it to whatever fits: "Database
     work", "API work", "ML pipeline work" — whatever the technical heart of
     your project is — and document there the 2-4 things that are never
     sacrificed for speed. -->

_—_

## [Agent section — delete if not applicable]

<!-- [OPTIONAL] Only if the project includes an AI agent that acts on its
     own (not just "we call an LLM once per request" — that doesn't need
     this section). Document: how often it runs, exactly what it can do,
     and — most importantly — what it can NOT do and how that's verified.
     This section is what proves the agent has real limits, not just a
     prompt asking it to behave. -->

It runs [cadence], and each cycle starts from [where it reads its state
from — it shouldn't hold memory it can't lose]. It can [what it can do] —
that is the whole of what it can do, and [the proof/mechanism] is what says
so. It never [what it can never do], and there is no code path that could.
