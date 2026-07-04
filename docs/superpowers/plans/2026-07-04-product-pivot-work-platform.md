# Product Pivot: CRM → Team Work Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Granularity note:** This is a whole-product pivot (~15 subsystems). Tasks are phase-grained with exact file lists; micro-stepping every edit would make the plan longer than the diff. Each phase ends with a typecheck/build verification step.

**Goal:** Remove all CRM concepts (contacts, deals, pipelines, stages) and rebuild Eleven as a Slack+Jira+Linear+Notion-style platform for software teams: tasks, sprints, chat, files, projects, activities, AI analytics, notifications, and a shared status-badge design system.

**Architecture:** Single Prisma mega-migration adds/removes all models at once. Backend stays Elysia route-per-domain (org-scoped via existing session guard pattern). Frontend stays Next 16 App Router + TanStack Query service-per-domain. New shared `StatusBadge` component + semantic status color tokens power every status display. AI reports use `@anthropic-ai/sdk` with tool-calling against Prisma aggregates, generated lazily on request when stale (no cron daemon).

**Tech Stack:** Next 16, React 19, Tailwind v4, shadcn, TanStack Query, Elysia, Prisma 7, Bun, better-auth, @anthropic-ai/sdk.

**Decisions locked in:**
- Contacts/People/Companies ARE CRM → removed entirely (with deals/pipelines/stages/imports).
- CRM data is dropped (dev DB); migration deletes rows using removed enum values before altering enums.
- Chat realtime stays polling but optimized (cursor-based `after=` fetch, typing/presence endpoints). WebSocket remains a next-phase item.
- AI reports: on-demand generation with staleness windows (daily/weekly/monthly) instead of cron — no scheduler infra needed.
- File version history = `versionHistory` Json on ProjectFile (upload same fileName in same folder ⇒ push old to history). Folders = string path column, no Folder model.

---

### Task 1: Prisma schema pivot (one migration)

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/<ts>_product_pivot/migration.sql` (via `--create-only`, then edit)

**Remove:** `Contact`, `Pipeline`, `Stage`, `Deal` models; `ContactType`, `ContactStatus`, `ContactSource`, `DealStatus` enums; `contactId`/`dealId` on Task; `ownedContacts`/`ownedDeals` on Member; `contacts`/`deals`/`pipelines` on Organization; `CONTACT`, `DEAL`, `PIPELINE`, `STAGE` from `ActivityEntityType`; `DEAL_*`, `CONTACT_*`, `CONTACTS_IMPORTED` from `NotificationType`.

**Extend:**
- `TaskStatus`: + `IN_REVIEW`, `BLOCKED`
- `Task`: + `labels String[]`, `estimate Int?`, `sprintId`, `milestoneId`, `timeSpentMinutes Int @default(0)`, `watchers TaskWatcher[]`, `comments TaskComment[]`, `dependsOn/dependedOnBy TaskDependency[]`
- New: `Sprint` (org-scoped, name/goal/startsAt/endsAt), `Milestone` (project-scoped, name/dueAt), `TaskComment`, `TaskWatcher`, `TaskDependency`, `TimeEntry`
- `Member`: + `statusText`, `statusEmoji`, `workingOn`, `timezone`, `skills String[]`, `lastSeenAt`
- `Message`: + `replyToId` (self-rel), `pinnedAt`, `editedAt`, `mentionUserIds String[]`, `reactions MessageReaction[]`
- New: `MessageReaction` (unique [messageId,userId,emoji]), `ChatRead` (unique [chatId,userId], lastReadAt)
- `ProjectFile`: + `folder String @default("/")`, `versionHistory Json @default("[]")`
- `Notification`: + `category String`, `priority String @default("normal")`, `archivedAt`, `snoozedUntil`; `NotificationType` + `MENTION`, `COMMENT`, `SPRINT_STARTED`
- New: `NotificationPreference` (memberId unique; Json category prefs; quietHoursStart/End Int?; digest String)
- New: `AiReport` (org-scoped; kind `AiReportKind` MINI/MEDIUM/HIGH; periodStart/End; content markdown; metrics Json)
- `ActivityAction`: + `COMMENT`, `ASSIGN`, `COMPLETE`; `ActivityEntityType`: + `SPRINT`, `MILESTONE`, `MESSAGE`, `MEETING`, `MEMBER`, `AI_REPORT`

**Steps:**
- [ ] Edit schema.prisma with all changes above
- [ ] `bunx prisma migrate dev --create-only --name product_pivot`; edit SQL to `DELETE FROM notifications WHERE type IN (...removed...)` and `DELETE FROM activities WHERE "entityType" IN (...removed...)` before enum recreation; drop CRM tables
- [ ] `bunx prisma migrate dev` to apply + regenerate client
- [ ] Verify: `bunx prisma validate` passes

### Task 2: Backend CRM removal + touched routes

**Files:**
- Delete: `backend/src/routes/contacts.ts`, `deals.ts`, `imports.ts`
- Modify: `backend/src/routes/index.ts`, `backend/src/index.ts`, `backend/src/lib/notify.ts`, `backend/src/lib/activity-log.ts` (if entity types referenced), `backend/src/routes/tasks.ts` (drop contact/deal joins), `backend/src/dummy/create-dummy-data.ts` (gut CRM seeding), `backend/src/auth/auth.ts` + `backend/src/lib/email-templates.ts` (check refs)
- Rewrite: `backend/src/routes/home-data.ts` (dashboard payload: myTasks, statusCounts, projects+progress, recentActivity, presence, todayMeetings), `backend/src/routes/metrics.ts` (throughput, velocity, cycle time, team load, completion rate)

- [ ] Delete files, fix all imports, rewrite home-data + metrics
- [ ] Verify: `cd backend && bunx tsc --noEmit` (or `bun build`) passes

### Task 3: Backend new/extended domain routes

**Files:**
- Modify: `backend/src/routes/tasks.ts` — labels/sprint/estimate in CRUD, `GET/POST /tasks/:id/comments`, watchers toggle, dependencies add/remove, `PATCH /tasks/bulk`, `POST /tasks/:id/time`
- Create: `backend/src/routes/sprints.ts` — CRUD + active sprint
- Modify: `backend/src/routes/projects.ts` — milestones CRUD, `GET /projects/:id/insights` (progress, health, burndown, velocity)
- Modify: `backend/src/routes/chat.ts` — cursor fetch (`?after=`), reactions toggle, reply threads, pin/unpin, edit/delete message, read receipts (`POST /chat/:id/read`), typing (`POST/GET /chat/:id/typing`, in-memory map), `GET /chat/:id/search`
- Create: `backend/src/routes/files.ts` — org-wide file list (search/recents/folders), version-aware upload record, delete
- Modify: `backend/src/routes/team.ts` — `POST /team/presence` heartbeat, `PATCH /team/me` (status/workingOn/timezone/skills), presence in list
- Modify: `backend/src/routes/activities.ts` — filters (entityType/action/memberId/q/date range) + pagination
- Modify: `backend/src/routes/notifications.ts` — category filter, archive, snooze, mark-all, `GET/PUT /notifications/preferences`
- Create: `backend/src/routes/ai-reports.ts` — Anthropic tool-calling report engine (tools: task_stats, team_load, project_health, activity_summary, sprint_stats), staleness-based generate + list
- Modify: `backend/src/lib/notify.ts` — mention/comment triggers; respect NotificationPreference + quiet hours

- [ ] Implement each route; register in `routes/index.ts` + `src/index.ts`
- [ ] Add `@anthropic-ai/sdk` to backend deps
- [ ] Verify: backend typecheck passes; boot server briefly

### Task 4: Design system — StatusBadge + color tokens

**Files:**
- Create: `frontend/components/ui/status-badge.tsx` (cva variants: task status, priority, project health, sprint state, notification priority; icon + tooltip + `role="status"`; sizes sm/md)
- Modify: `frontend/app/globals.css` — semantic tokens (light+dark): `--status-neutral|blue|orange|red|green|purple|yellow` (+`-fg`), soft gradients util
- Delete: `frontend/components/tasks/task-status-badge.tsx`, `task-priority-badge.tsx` (replace usages)

- [ ] Build component, migrate all usages (grep `task-status-badge`, `task-priority-badge`, ad-hoc Badge status displays)
- [ ] Verify: frontend `bunx tsc --noEmit`

### Task 5: Frontend CRM removal + navigation

**Files:**
- Delete: `frontend/app/dashboard/contacts/**`, `frontend/app/dashboard/deals/**`, `frontend/components/contacts/**`, `frontend/components/deals/**`, `frontend/services/contacts/**`, `frontend/services/deals/**`, `frontend/services/imports/**`, `frontend/app/dashboard/team/team/**` (redirect shim)
- Modify: `frontend/components/layout/app-sidebar.tsx` (new nav: Dashboard, Tasks, Sprints?, Projects, Team, Chat, Meet, Files, Activity, Analytics, Notifications, Settings), `frontend/components/tasks/add-task-modal.tsx` (drop contact/deal selects), task pages, `frontend/components/notifications/notification-bell.tsx` (type icons)

- [ ] Delete + fix every import; typecheck clean

### Task 6: Dashboard redesign
- Rewrite `frontend/app/dashboard/page.tsx` (+ small components under `frontend/components/dashboard/`): greeting + Today's Focus, My Tasks, Projects w/ progress bars, Recent Activity, Team presence avatars, unread notifications/mentions, quick actions. Accent colors, gradients, hover micro-interactions, skeletons, empty states.
- Uses rewritten `/home-data`.

### Task 7: Tasks Jira-level UX
- Task detail page `frontend/app/dashboard/tasks/[id]/` (exists, extend): subtasks, labels, watchers, dependencies, estimate, time tracking, comments, activity timeline, StatusBadge everywhere.
- List view: bulk actions bar (status/assignee/delete). Kanban: new statuses columns. `frontend/services/tasks/*` updated types/hooks + comments/watchers/bulk/time hooks. Sprint picker + `frontend/app/dashboard/sprints/page.tsx` (lightweight: list + create + assign view).

### Task 8: Team page
- `frontend/app/dashboard/team/*` + `frontend/components/team/**`: presence dot (lastSeenAt), status text/emoji edit for self, working-on, timezone w/ local time, skills chips, member profile sheet. `frontend/services/team/*` presence heartbeat hook (60s interval + on focus).

### Task 9: Chat Slack-level
- `frontend/app/chat/*`, `frontend/components/chat/*`, `frontend/services/chat/*`: cursor polling (2s active/10s blurred), unread separators + counts (ChatRead), typing indicator, reactions + emoji picker (small curated set, popover), reply threads (inline thread panel), pin/pinned list, edit/delete own messages, mentions (@ autocomplete → mention notification), search box, file share via existing upload.

### Task 10: Files module
- `frontend/app/dashboard/files/page.tsx` rewrite: org-wide table (recents, search, folder tree from path strings, project filter), drag&drop upload (react-dropzone installed), preview dialog (image/pdf/video/audio by mimetype), version history sheet, delete w/ confirm. Permissions = project membership (backend enforced already).

### Task 11: Projects modern
- `frontend/app/dashboard/projects/[slug]/*`: tabs Overview (progress ring, health badge, milestones, activity feed) / Board (kanban filtered by project) / List / Files / Members. Burndown + velocity mini-charts from `/projects/:id/insights`.

### Task 12: Activities
- Filters bar (entity, action, member, date, search) + day-grouped timeline w/ entity icons.

### Task 13: AI Analytics (read `claude-api` skill first)
- Backend already in Task 3. Frontend: `frontend/app/dashboard/metrics/page.tsx` → work analytics (velocity, throughput, cycle, load) + `frontend/app/dashboard/reports/page.tsx`: AI report cards (Mini/daily, Medium/weekly, High/monthly), markdown render, generate-now button, metrics JSON chips. `frontend/services/metrics` + new `frontend/services/ai-reports`.

### Task 14: Notifications pages
- `frontend/app/dashboard/notifications/page.tsx`: category tabs, read/unread, archive, snooze menu, priority markers, bulk mark-read.
- `frontend/app/dashboard/notifications/preferences/page.tsx`: per-category in-app/email toggles, quiet hours, digest select.

### Task 15: Landing pivot + cleanup
- `frontend/components/landing/*`: copy/features pivot to dev-team platform (tasks/sprints/chat/AI reports). No CRM words anywhere (`grep -ri "crm\|deal\|pipeline\|lead" frontend/ backend/src`).

### Task 16: Docs
- Rewrite `next-phases.md` for new vision (roadmap, technical debt, future improvements).

### Verification (each phase + final)
- [ ] `cd backend && bunx tsc --noEmit`
- [ ] `cd frontend && bunx tsc --noEmit && bun run build` (final)
- [ ] Boot backend + frontend, smoke the main pages
