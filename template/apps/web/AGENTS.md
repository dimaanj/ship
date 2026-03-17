# Web — Scoped Agent Instructions

> Applies when working inside `apps/web/`. Read root `AGENTS.md` first.

---

## Architecture at a Glance

Next.js 15, App Router, React 19, Tailwind CSS 4, shadcn/ui (New York), TanStack React Query v5, React Hook Form v7, Zod 4.

---

## Routing: App Router

Routes are defined in `src/app/` with `page.tsx`, `layout.tsx`, and `route.ts` files.

- `app/(auth)/sign-in/page.tsx` → `/sign-in`
- `app/(dashboard)/app/page.tsx` → `/app`
- `app/(dashboard)/app/profile/page.tsx` → `/app/profile`
- `app/posts/[slug]/page.tsx` → `/posts/:slug`

Route groups like `(auth)` and `(dashboard)` don't add to the URL path. Layouts wrap child routes.

---

## Layouts and Auth

- `app/(auth)/layout.tsx` — redirects logged-in users to `/app`
- `app/(dashboard)/layout.tsx` — requires auth, redirects to `/sign-in` if not logged in, wraps with MainLayout

---

## Import Conventions

`tsconfig.baseUrl` is `src`. Paths alias: `@/*` → `src/*`.

```tsx
import { apiClient } from 'services/api-client.service'; // ✅ bare
import { useApiQuery } from 'hooks'; // ✅ bare
import { Button } from '@/components/ui/button'; // ✅ @/ alias for ui
import { Table, Page, ScopeType } from 'components'; // ✅ barrel
import config from 'config'; // ✅ bare
```

---

## Component Organization

| Location                   | Scope                | Import pattern              |
| -------------------------- | -------------------- | --------------------------- |
| `src/components/ui/`       | shadcn/ui primitives | `@/components/ui/button`    |
| `src/components/`          | Shared components    | `'components'` (barrel)     |
| `pages/<name>/components/` | Page-scoped          | Relative import within page |

**Don't modify shadcn/ui files** unless necessary. Wrap instead.
Add new shadcn components via: `npx shadcn@latest add <component>` (from `apps/web/`).

---

## Styling Rules

- **Tailwind CSS only**. No CSS modules, no styled-components.
- `cn()` from `@/lib/utils` for conditional class merging.
- Mobile-first: `sm:`, `md:`, `lg:` breakpoints.
- Dark mode: semantic CSS variables (`text-foreground`, `bg-background`, `text-muted-foreground`, `border`, etc.).
- Icons: `lucide-react` (`import { Icon } from 'lucide-react'`).

---

## Environment & Services

- Env vars **must** use `NEXT_PUBLIC_` prefix. Validated in `src/config/index.ts`.
- Socket.IO client: `src/services/socket.service.ts`. Handlers in `socket-handlers.ts` (imported as side-effect in PageConfig).
- Toasts: Sonner (`import { toast } from 'sonner'`). Already set up in `_app`.
- Theming: `next-themes` (system/light/dark). Use CSS variables, not hardcoded colors.

---

## Verification

```bash
npm run tsc --noEmit -w web    # typecheck
npm run eslint -w web         # lint
npm run build -w web          # full build (catches SSR issues)
```

---

## Update Triggers

Update this file when:

- `next.config.mjs` changes (pageExtensions, i18n, output mode)
- `_app/PageConfig` changes (new scope types, layouts)
- shadcn/ui configuration changes (`components.json`)
- New shared component patterns emerge
- Tailwind config changes significantly
