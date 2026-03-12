# Eleven

A full-stack **CRM and project management** application with organizations, contacts, deals, pipelines, projects, tasks, and file storage. Built for teams that need a single place to manage relationships, sales pipelines, and project work.

---

## Overview

**Eleven** combines classic CRM (contacts, deals, pipelines) with project and task management. It is multi-tenant: each **organization** has its own members, contacts, deals, projects, and tasks. Organizations can be upgraded via a one-time Stripe payment.

### Core Capabilities

| Area | Features |
|------|----------|
| **Auth & orgs** | Email/password and OAuth (Better Auth), sessions, organizations, invitations, role-based members |
| **Contacts** | People and companies, status (Lead → Prospect → Customer), ownership, custom fields, company–person links |
| **Sales** | Pipelines with configurable stages, deals with value/currency/probability, linked to contacts and activities |
| **Projects** | Projects with slug, description, links (e.g. Figma, GitHub), project members, project-scoped files |
| **Tasks** | Tasks with status/priority, assignee/creator, optional link to project/contact/deal, subtasks, markdown details, attachments |
| **Files** | Project files (drive-like) and task attachments; uploads to S3-compatible storage (e.g. Cloudflare R2) with optional image processing |
| **Billing** | One-time organization payment ($1000) via Stripe; webhook handling for payment confirmation |

### Planned / Advanced Features (Roadmap)

- **AI integrations**: Smart summarization, content generation, suggestions, and automation.
- **Notifications**: Real-time/push notifications for tasks, deals, projects, and team events.
- **Finance**: Financial analyses, budget and spend controls, reporting.
- **Invoices & receipts**: Upload, validation, and tracking of invoices and receipts.
- **Microsoft Teams**: Automatic meeting attendance (check-in), access to meeting history, team sync.
- **Employee analytics**: Performance, attendance, and activity metrics; reporting and dashboards.
- Additional complex features are planned along the same lines.

---

## Tech Stack

### Backend

- **Runtime / framework**: [Bun](https://bun.sh) + [Elysia](https://elysiajs.com)
- **Database**: PostgreSQL 16+ with [Prisma](https://www.prisma.io) ORM
- **Auth**: [Better Auth](https://www.better-auth.com) (sessions, accounts, verification)
- **Payments**: [Stripe](https://stripe.com) (one-time product; webhook at `POST /webhooks/stripe`)
- **Storage**: S3-compatible (e.g. [Cloudflare R2](https://www.cloudflare.com/products/r2/)); uploads via `@aws-sdk/client-s3`; optional image processing with Sharp
- **API**: REST; CORS configured for frontend origin

### Frontend

- **Framework**: [Next.js](https://nextjs.org) 16 (App Router)
- **UI**: [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- **Data**: [TanStack Query](https://tanstack.com/query) (server state), React Hook Form + Zod (forms/validation)
- **Tables**: TanStack Table (contacts, projects, team, etc.)
- **Auth**: Better Auth client (login, signup, session, org switching)
- **Charts**: Recharts where needed

### DevOps / Local

- **Local stack**: Docker Compose — PostgreSQL 16, Redis (for future use)
- **Package manager**: Bun (backend and frontend use Bun)

---

## Project Structure

```
eleven/
├── backend/                 # Elysia API (Bun)
│   ├── prisma/
│   │   ├── schema.prisma    # Data model (User, Session, Org, Member, Contact, Deal, Pipeline, Stage, Project, Task, etc.)
│   │   ├── migrations/
│   │   └── generated/      # Prisma client output
│   ├── src/
│   │   ├── index.ts         # App entry, CORS, auth mount, routes, listen(3333)
│   │   ├── auth/            # Better Auth config
│   │   ├── plugins/         # Elysia auth plugin
│   │   ├── routes/          # contacts, payments, projects, team, tasks, upload
│   │   └── dummy/           # Dev dummy data
│   └── package.json
├── frontend/                # Next.js 16 App Router
│   ├── app/
│   │   ├── (auth)/          # login, signup
│   │   ├── dashboard/      # tasks, team, files, etc.
│   │   ├── accept-invitation/
│   │   └── layout.tsx
│   ├── components/          # UI, layout, features (contacts, projects, tasks, team, payment, etc.)
│   ├── services/             # API client + TanStack Query (contacts, projects, tasks, team, payments)
│   ├── lib/                  # auth-client, utils, schema, file-types
│   └── package.json
├── docker-compose.yml       # postgres, redis
├── tech-stack.txt           # High-level stack notes
└── readme.md                # This file
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- Docker and Docker Compose (for PostgreSQL and Redis)
- Node 20+ (if you run Next.js with npm; Bun is still preferred)

### 1. Database and services

```bash
docker compose up -d
```

Ensure PostgreSQL is ready (default: `crm_user` / `crm_password` / `crm_db` on port 5432).

### 2. Backend

```bash
cd backend
bun install
```

Create `.env` (see backend README and below). Then:

```bash
bun run db:generate
bun run db:migrate
bun run dev
```

Backend runs at **http://localhost:3333**.

#### Backend env (main ones)

- `DATABASE_URL` — PostgreSQL connection string
- `FRONTEND_URL` — Frontend origin for CORS (e.g. `http://localhost:3000`)
- `BETTER_AUTH_*` — Better Auth config (secret, base URL, etc.)
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- R2/S3: `R2_*` or equivalent S3 env vars for uploads; `R2_PUBLIC_BASE_URL` for public file URLs

### 3. Frontend

```bash
cd frontend
bun install
bun run dev
```

Frontend runs at **http://localhost:3000**. Use the same `FRONTEND_URL` in the backend so auth and API calls work.

### 4. Stripe (one-time org payment)

- Create product and one-time price in Stripe; set `STRIPE_PRICE_ID`.
- Local webhook: `stripe listen --forward-to localhost:3333/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET` to the CLI signing secret.
- Production: add endpoint `POST /webhooks/stripe` in Stripe Dashboard and use that webhook secret.

Details: see `backend/README.md`.

---

## Main Data Model (summary)

- **User** – identity; **Session** – auth session; **Account** – OAuth/password.
- **Organization** – tenant; **Member** – user-in-org with role; **Invitation** – pending invite.
- **Contact** – person or company; status/source; optional company link and owner (Member).
- **Pipeline** / **Stage** – sales stages; **Deal** – linked to Contact, Stage, Pipeline, owner.
- **Activity** – call, email, meeting, etc.; optional link to Contact and Deal.
- **Project** – name, slug, description, links; **ProjectMember** – access control; **ProjectFile** – drive-like files.
- **Task** – title, description (markdown), status, priority, assignee, creator; optional project/contact/deal; **TaskAttachment** – file on task.
- **Plan** (FREE/PROFESSIONAL) and **paidAt** on Organization for Stripe one-time payment.

---

## Scripts

| Where | Command | Purpose |
|-------|---------|---------|
| Backend | `bun run dev` | Watch mode, Elysia on port 3333 |
| Backend | `bun run db:migrate` | Prisma migrate dev |
| Backend | `bun run db:generate` | Prisma generate |
| Backend | `bun run db:studio` | Prisma Studio |
| Backend | `bun run db:seed` | Seed DB (if configured) |
| Frontend | `bun run dev` | Next.js dev server (default 3000) |
| Frontend | `bun run build` | Next.js production build |

---

## API Overview

- **Auth**: Mounted under Better Auth base path (e.g. sign-in, sign-up, session).
- **Webhook**: `POST /webhooks/stripe` — Stripe payment events.
- **REST**: Contacts, payments, projects, team, tasks, upload — all under the same origin (e.g. `http://localhost:3333`), protected by the Elysia auth plugin where required.
- **Dummy data**: `GET /dummy-create` — creates sample data (dev only; guard in production).

---

## License

This project is open source and available under the [MIT License](LICENSE). You may use, copy, modify, and distribute it under the terms of that license.

## Contributing

Contributions are welcome. Please open an issue to discuss larger changes, or submit a pull request for bug fixes and small improvements.
