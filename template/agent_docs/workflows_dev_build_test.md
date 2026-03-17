# Workflows: Dev / Build / Test

> Read this for any task that involves running, building, or validating code.

---

## Prerequisites

- **Node ≥22.13.0** (see `.nvmrc`). Use `nvm use` if needed.
- **npm** (comes with Node.js).
- **Docker** for local MongoDB + Redis.

---

## Install

```bash
npm install
```

Run after pulling, after changing any `package.json`, or after modifying workspace packages.

---

## Infrastructure (Local)

```bash
npm run infra          # starts MongoDB (27017) + Redis (6379) via Docker
```

MongoDB runs as a replica set (`rs`) — required for change streams and transactions.

---

## Dev Mode

```bash
# Everything at once (infra → migrate → schedule → api + web dev):
npm run start

# Or with Turborepo (assumes infra already running):
npm run turbo-start
```

Individual apps:

```bash
npm run dev -w api       # API on :3001 (nest start --watch)
npm run dev -w web       # Web on :3002 (next dev)
```

Turbo pipeline order: `api#migrate-dev` → `api#schedule-dev` → `dev` (all apps).

---

## Build

```bash
npx turbo build            # builds all packages + apps
npm run build -w api       # API only (nest build)
npm run build -w web       # Web only (next build)
```

---

## Typecheck

```bash
npm exec -w api tsc --noEmit
npm exec -w web tsc --noEmit
npm exec -w shared tsc --noEmit
```

No project-wide `tsc` — run per-package. These are the verification commands to run after changes.

---

## Lint

```bash
npm run eslint -w api
npm run eslint -w web
```

Uses `@antfu/eslint-config` (flat config, ESLint 9). Key enforced rules:
- `no-explicit-any` is an **error** (not warning)
- Import ordering is enforced (don't hand-sort — let eslint fix)
- No relative imports beyond 1 level deep in API (`no-relative-import-paths` plugin)

Run `eslint . --fix` to auto-fix. Don't fight the linter — if it's enforced, comply.

---

## Codegen

```bash
npm run generate -w shared          # one-shot
npm run generate:watch -w shared   # watches API resources for changes
```

Must run after any change to `apps/api/src/resources/*/endpoints/*.ts` or `*.schema.ts`.
See `agent_docs/shared_codegen_contract.md` for details.

---

## When to Run What

| I changed... | Run |
|---|---|
| Any `package.json` or catalog | `npm install` |
| API endpoint or schema file | `npm run generate -w shared`, then typecheck |
| API code (any) | `npm exec -w api tsc --noEmit` |
| Web code (any) | `npm exec -w web tsc --noEmit` |
| Shared package code | `npm exec -w shared tsc --noEmit`, then typecheck consumers |
| `app-constants` | Typecheck any package that imports it |
| Before committing | `npm exec -w api tsc --noEmit && npm exec -w web tsc --noEmit` |

---

## Turborepo Filter Patterns

```bash
npm run <script> -w api          # apps/api
npm run <script> -w web          # apps/web
npm run <script> -w shared       # packages/shared
npm run <script> -w app-constants
```

Package names match their `package.json` `name` field. Check with `npm ls --depth -1` if unsure.

---

## Update Triggers

Update this doc when:
- Root or app-level `package.json` scripts change
- `turbo.json` pipeline tasks change
- Node/npm version requirements change
- New packages are added to the workspace
