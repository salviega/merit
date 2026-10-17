---
name: changelog
description: Used when updating CHANGELOG.md, writing a release entry, or
  choosing a release's version number. Contains the mapping from Conventional
  Commits to Keep a Changelog sections and the SemVer rules.
---

# CHANGELOG.md — Keep a Changelog 1.1.0 + SemVer 2.0.0

## What an entry is
Write from the perspective of whoever consumes the project: what changed and
what they need to do if it affects them. The root cause and the alternatives
you discarded belong in the PR or in an ADR, not here. Exception: breaking
changes carry a migration note, even if it's three lines long.

Don't paste the commit message verbatim. The commit is for the team; the
entry is for the outside.

`Deprecated` is for what still works but is going away: say in which version
it's removed and what the replacement is. When it's actually removed, that's
a new entry under `Removed`, not an edit to the old one.

## Structure
- File title: `# Changelog`. Don't use variants.
- Every unpublished change goes under `## [Unreleased]`.
- Versions go in descending order: the most recent on top.
- Valid sections, in this order: Added, Changed, Deprecated, Removed, Fixed,
  Security. Omit the empty ones. Don't invent others.
- Version header: `## [1.2.0] - 2026-09-09`. ISO 8601 date.
- A pulled release is marked `## [1.0.1] - 2026-01-01 [YANKED]` and stays in
  the history. The number is never deleted or reused.
- Compare links at the bottom are optional. If the file already has them,
  keep them updated; if it doesn't, don't add them.

## From commit to section
| Commit | Section | Version |
|---|---|---|
| `feat` | Added | minor |
| `fix` | Fixed | patch |
| `refactor`, `perf` | Changed, only if it's visible from outside | patch |
| marking something for future removal | Deprecated | minor |
| `feat!` / `BREAKING CHANGE` | Changed or Removed | major (minor on `0.x`) |
| vulnerability fix | Security | patch |
| `docs`, `test`, `chore`, `ci`, `build` | doesn't enter | — |

The table is a guide to the destination, not a translator. A `fix` that also
changes visible behavior goes in both Fixed and Changed.

## Versioning
SemVer 2.0.0 rules:
- The version is `MAJOR.MINOR.PATCH`, three numbers, no leading zeros.
- Pre-release: `1.0.0-rc.1`. Build metadata: `1.0.0+20260909`.
- There are no free-form suffixes. `1.4.4hotfix1` is not a valid version.
- A published version is never modified. Any change is a new version.

Additional convention, not part of the spec: on `0.x`, breaking changes bump
the minor. SemVer §4 only says that on `0.y.z` the public API should not be
considered stable, without prescribing which segment to bump. The convention
holds because npm and Cargo treat `^0.2.0` as locked to `<0.3.0`.

## When preparing a release
1. Rename `[Unreleased]` to the version, with its date.
2. Create an empty `[Unreleased]` above it.
3. Verify the version matches the most severe change in the list.
4. If the file uses compare links, update them.

## Anti-patterns
- Auto-generating the changelog from `git log`.
- Entries that describe the diff instead of the effect: "refactored the
  handler".
- Invented sections: `Investigation`, `Known limitations`, `Notes`. If the
  content doesn't fit in the six sections, it doesn't go in the changelog.
- One entry per commit. Several commits that resolve one thing are one entry.
- Editing an already published version.
- Multiple `[Unreleased]` headers, or one with a date or commit prefix stuck
  to it (`## [Unreleased] 2026-08-19 — feat: ...`).
- Sections with a placeholder: "Nothing.", "No changes", "No new
  functionalities." If there's nothing of that kind, the section doesn't
  exist in that version.
- The same `### Changed` twice under one version. It's a single block.
- Date in `DD-MM-YYYY` or `MM-DD-YYYY`, or without the dash separator. It
  sneaks in when copying the previous version's header.
- Removing something that never went through `Deprecated`, unless it's a
  security fix.

## File header

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
```
