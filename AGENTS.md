# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Kasoku is a sports coaching/training management platform. It is a **Turborepo monorepo** with one active app:

- **`apps/web`** — Next.js 16 (React 19, TypeScript, Tailwind CSS v4) web application
- `supabase/` — Supabase migrations and edge functions
- `specs/` — Feature specs (speckit artifacts)

See `CLAUDE.md` for comprehensive project documentation, agent delegation rules, and code standards.

### External services

- **Supabase** (database + storage) — configured via `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Clerk** (authentication) — configured via `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- **OpenAI** (optional, AI features) — configured via `OPENAI_API_KEY`

No Docker or local database setup is needed — Supabase and Clerk are hosted SaaS.

### Environment setup

The update script generates `apps/web/.env.local` from environment variable secrets on each VM startup.

### Common commands

See `CLAUDE.md` and `README.md` for the full list. Key commands from the repo root:

| Action | Command |
|--------|---------|
| Dev server | `npm run dev` or `npm run dev:web` |
| Build | `npm run build` or `npm run build:web` |
| Lint | See gotchas below |
| Test | `npm test` |
| Format | `npm run format` |

The dev server runs at `http://localhost:3000`.

### Gotchas

- **`next lint` is removed in Next.js 16.** The `npm run lint` script calls `next lint` which no longer exists. Running ESLint directly (`npx eslint .`) also fails with a circular structure error due to `eslint-config-next` incompatibility with ESLint 8. This is a pre-existing issue.
- **Build has a pre-existing TS error.** `npm run build` fails on a type error in `actions/onboarding/onboarding-actions.ts` (`p_group_id` not in expected type). The dev server (`npm run dev`) works fine since it doesn't enforce strict TS at startup.
- **6 of 306 Jest tests fail.** The failing tests are in `onboarding-actions.test.ts` due to `server-only` module import in jsdom environment — a pre-existing mock issue, not an env problem.
- **Clerk auth is enforced on all protected routes** via `proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`). There is no `BYPASS_AUTH` mechanism in the staging branch — authentication is required.
- **The workspace package name is `@kasoku/web`** (not `web`), so workspace scripts use `--workspace=@kasoku/web`.
- **`legacy-peer-deps=true`** is set in `.npmrc` — `npm install` will use this automatically.
