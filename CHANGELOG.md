# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versioning cadence, while pre-1.0:

- **Work on a branch adds its entry under `Unreleased`, with no version
  number.** A branch cannot know what number is free: two branches open at
  once both reach for the same one, and only whichever merges first is right.
- **The number is assigned when the branch merges to `main`**: the
  `Unreleased` entries become a released section, and the project's version
  file — `package.json`, `pyproject.toml`, `Cargo.toml`, a `VERSION` file,
  whatever the stack uses — moves to match in the same commit, if the stack
  tracks a version anywhere outside this file.
- **Patch** for ordinary work, **minor** when a phase of
  [the work plan](./spec/definicion/07_plan-de-trabajo.md) closes.

<!-- [ADAPTAR] Añade aquí la(s) convención(es) de evidencia propia de tu
     proyecto — lo que hace que una entrada sea verificable en vez de una
     afirmación. Ejemplos reales: "todo lo que pasó en una blockchain lleva
     su hash de transacción"; "toda mejora de UI lleva una captura o un
     enlace al preview de Vercel"; "todo cambio de rendimiento lleva el
     número antes/después". Bórralo si no aplica ninguno. -->

- **[Tu convención de evidencia]:** _—_

## [Unreleased]

### Added

- Starter kit scaffold: `spec/definicion/` document chain, the `AGENTS.md`
  commit ritual, this `CHANGELOG.md`, `README.md`, `PROJECT_README.template.md`,
  the PR template, and a stack-agnostic `.gitignore`.
- `.githooks/commit-msg`: enforces the Conventional Commits rules from
  `AGENTS.md`. Written in POSIX sh so it runs without any language runtime;
  enable it per clone with `git config core.hooksPath .githooks`.
