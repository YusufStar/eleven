# Eleven — Roadmap

CRM and project management app. CRUD is done for core entities; next phase is **detail pages** and filling gaps.

---

## Routes (from sidebar)

| Section | Routes |
|--------|--------|
| **Dashboard** | `/dashboard` (Overview), `/dashboard/metrics` |
| **Contacts** | `/dashboard/contacts/people`, `/dashboard/contacts/companies` |
| **Pipeline** | `/dashboard/deals`, `/dashboard/deals/list`, `/dashboard/deals/stages` |
| **Projects** | `/dashboard/projects` |
| **Files** | `/dashboard/files` |
| **Tasks** | `/dashboard/tasks` |
| **Team** | `/dashboard/team` (Members), `/dashboard/team/invite` |
| **Activities** | `/dashboard/activities`, `/dashboard/activities/calendar`, `/dashboard/activities/log` |
| **Reports** | `/dashboard/reports`, `/dashboard/reports/win-loss`, `/dashboard/reports/pipeline` |
| **Settings** | `/dashboard/settings`, `/dashboard/settings/profile`, `/dashboard/settings/plan`, `/dashboard/settings/integrations` |
| **Notifications** | `/dashboard/notifications`, `/dashboard/notifications/preferences` |
| **Billing** | `/dashboard/billing`, `/dashboard/billing/upgrade`, `/dashboard/billing/payment` |

---

## Current state

- **Done (CRUD):** Team members, Invite, Sign-in/Sign-up, Tasks, Files, Projects, Contacts (People), Contacts (Companies).
- **Task** has a detail **modal** only; no dedicated detail **page** for any entity.

---

## Next steps (priority order)

### 1. Detail pages (entity drill-down)

- [x] **Contact (Person)** — e.g. `/dashboard/contacts/people/[id]`: full contact info, linked company, deals, activities, tasks, notes.
- [x] **Contact (Company)** — e.g. `/dashboard/contacts/companies/[id]`: company info, linked people, deals, activities.
- [ ] **Deal** — e.g. `/dashboard/deals/[id]` or modal: value, stage, contact, activities, tasks, timeline.
- [ ] **Project** — e.g. `/dashboard/projects/[slug]` or `[id]`: description, links, members, files, tasks list.
- [ ] **Task** — optional full-page detail `/dashboard/tasks/[id]` in addition to existing modal (or keep modal-only and skip).
- [ ] **Team member** — e.g. `/dashboard/team/[id]`: profile, role, assigned tasks/contacts/deals (read-only or minimal edit).
- [ ] **File** — e.g. `/dashboard/files/[id]` or preview: metadata, download, which project, uploader.

### 2. List ↔ detail navigation

- [ ] Ensure every list row (contacts, companies, deals, projects, tasks, team, files) can open the corresponding detail (page or modal).
- [ ] Breadcrumbs and back navigation from detail to list.

### 3. Pipeline / Deals

- [ ] Board view (`/dashboard/deals`) fully working (drag-and-drop stages).
- [ ] Stages config (`/dashboard/deals/stages`) CRUD if not done.
- [ ] Deal detail (see above).

### 4. Activities

- [ ] `/dashboard/activities` — list/filter (type, contact, deal).
- [ ] `/dashboard/activities/calendar` — calendar view.
- [ ] `/dashboard/activities/log` — timeline/log view.
- [ ] Create/edit activity from contact or deal detail.

### 5. Reports

- [ ] `/dashboard/reports` — sales analytics (e.g. Recharts).
- [ ] `/dashboard/reports/win-loss` — win/loss summary.
- [ ] `/dashboard/reports/pipeline` — pipeline metrics.

### 6. Settings & other

- [ ] `/dashboard/settings/plan` — show current plan, upgrade CTA (Stripe).
- [ ] `/dashboard/settings/integrations` — list/configure integrations (e.g. GitHub already under Organization).
- [ ] `/dashboard/notifications` and `/dashboard/notifications/preferences` — if planned.
- [ ] `/dashboard/metrics` — ensure it shows useful org metrics.

### 7. Polish

- [ ] Empty states for lists and detail pages.
- [ ] Loading and error states.
- [ ] SEO/meta for public or shareable pages (if any).
- [ ] Mobile responsiveness for key views (board, forms, detail).

---

## Suggested order to implement

1. **Contact (Person) detail** — most used in CRM.
2. **Deal detail** — core for pipeline.
3. **Project detail** — central for project + files + tasks.
4. **Company detail** — then link person/company in both directions.
5. **Team member detail** (lightweight).
6. **File detail/preview**.
7. **Activities** list + calendar + log.
8. **Reports** (sales, win/loss, pipeline).
9. **Settings/Plan & Integrations** and **Notifications** as needed.

---

*Update this file as you complete or reprioritize items.*
