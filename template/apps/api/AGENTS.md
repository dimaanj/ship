# API — Scoped Agent Instructions

> Applies when working inside `apps/api/`. Read root `AGENTS.md` first.

---

## Architecture at a Glance

NestJS + MongoDB (Mongoose) + Zod 4. ESM (`"type": "module"`). TypeScript with `baseUrl: "src"`.

Domain logic lives in modules (`src/auth/`, `src/users/`, etc.). Controllers use `@Controller()`, services use `@Injectable()`.

---

## Import Convention

`tsconfig.baseUrl` is `src`. Always use bare specifiers:

```typescript
import { UsersService } from 'users/users.service'; // ✅
import { AppConfigService } from 'config/config.service'; // ✅

import { something } from 'src/users/users.service'; // ❌ never
import { something } from '../../../users/users.service'; // ❌ never
```

The ESLint plugin `no-relative-import-paths` enforces this (max depth 1, same-folder allowed).

---

## Guards and Decorators

- **AuthGuard** (global) — validates JWT from cookie, attaches user. Use `@Public()` to skip on specific routes.
- **AdminGuard** — `@UseGuards(AdminGuard)` checks `x-admin-key` header.
- **@CurrentUser()** — param decorator to inject the authenticated user.
- **ZodValidationPipe** — global pipe for Zod validation. Parse body/query in controller with `schema.parse(rawBody)`.
- **@Throttle()** — from `@nestjs/throttler` for rate limiting.

---

## Config (Environment Variables)

Zod-validated in `src/config/index.ts`. When adding a new env var:

1. Add it to the Zod schema in `src/config/index.ts`
2. Add it to `.env` and `.env.example`

Required vars: `APP_ENV`, `API_URL`, `WEB_URL`, `MONGO_URI`, `MONGO_DB_NAME`.
Optional vars: `REDIS_URI`, `RESEND_API_KEY`, `ADMIN_KEY`, `MIXPANEL_API_KEY`, cloud storage, Google OAuth.

---

## Services (`src/services/`)

External integrations — not domain logic. Current services: `analytics`, `auth`, `cloud-storage`, `email`, `google`, `socket`, `stripe`.

To add a new service: create a folder in `src/services/`, export the service. Import where needed.

---

## Migrator & Scheduler

- Migrator: `src/migrator/migrations/<version>.ts` — each exports `Migration` with `migrate()`. Runs via `npm run migrate-dev -w api`.
- Scheduler: `src/scheduler/scheduler.service.ts` — uses `@Cron()` decorators. Runs via `nest start --entryFile scheduler.main`.

---

## Verification

```bash
npm exec -w api tsc --noEmit   # typecheck
npm run eslint -w api         # lint
npm run build -w api          # full build
```

After adding endpoints, verify NestJS logs show the registered routes.

---

## Update Triggers

Update this file when:

- App module or guard configuration changes
- New decorators or pipes are added
- Config schema changes significantly
- New modules are added
