# Eleven — Agent context

Full-stack **CRM and project management** app: organizations, contacts, deals, pipelines, projects, tasks, file storage. Multi-tenant; org upgrade via one-time Stripe payment.

## Tech stack

- **Backend**: Bun + Elysia (port 3333), Prisma (PostgreSQL 16), Better Auth, Stripe webhook `POST /webhooks/stripe`, S3-compatible (e.g. R2) via `@aws-sdk/client-s3`, optional Sharp for images.
- **Frontend**: Next.js 16 App Router, shadcn/ui + Tailwind, TanStack Query + React Hook Form + Zod, TanStack Table, Recharts.
- **Local**: Docker Compose (PostgreSQL, Redis). Use **Bun** for install/run/scripts (see `.cursor/rules` and `backend/.cursor/rules`).

## Project layout

- `backend/` — Elysia API: `src/index.ts` (CORS, auth mount, routes), `src/auth/`, `src/plugins/`, `src/routes/` (contacts, deals, payments, projects, profile, team, tasks, upload, settings), `src/dummy/`, `prisma/schema.prisma` + migrations.
- `frontend/` — Next.js: `app/(auth)/`, `app/dashboard/`, `app/accept-invitation/`, `components/`, `services/` (API + TanStack Query), `lib/` (auth-client, utils, schema).

## Conventions

- **Language**: English only (UI, copy, comments, docs, errors). Rule: `.cursor/rules/english-only.mdc`.
- **Backend**: Prefer Bun over Node/npm/pnpm; run from `backend/` with `bun run dev`, `bun run db:migrate`, `bun run db:generate`, `bun run db:studio`. Rule: `backend/.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc`.
- **API**: REST; auth via Elysia auth plugin; org-scoped data where applicable.
- **DB**: Prisma schema in `backend/prisma/schema.prisma`; client output in `backend/prisma/generated/prisma`. Main entities: User, Session, Organization, Member, Contact, Deal, Pipeline, Stage, Activity, Project, Task, ProjectFile, TaskAttachment, Plan/paidAt.

## Key paths

- Backend entry: `backend/src/index.ts`
- Auth: `backend/src/auth/`, `backend/src/plugins/auth.plugin.ts`
- Routes: `backend/src/routes/` (contacts, deals, payments, projects, team, tasks, upload, settings)
- Frontend auth: `frontend/lib/auth-client.ts`
- Services (API + queries): `frontend/services/` (contacts, deals, payments, projects, tasks, team, upload, settings)

## Scripts

| Where    | Command           | Purpose              |
|----------|-------------------|----------------------|
| Backend  | `bun run dev`     | Elysia on :3333      |
| Backend  | `bun run db:migrate` | Prisma migrate dev |
| Backend  | `bun run db:generate` | Prisma generate   |
| Backend  | `bun run db:studio`   | Prisma Studio    |
| Frontend | `bun run dev`     | Next.js (default :3000) |
| Frontend | `bun run build`   | Next.js production   |

## Learned User Preferences

<!-- Add durable user preferences here as plain bullets. -->

## Learned Workspace Facts

<!-- Add stable workspace facts here as plain bullets. -->
