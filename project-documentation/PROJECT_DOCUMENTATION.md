# AI Portfolio Dashboard — Project Documentation

> **Purpose of this document.** A single, current, as-built reference to every
> feature in the application, organized section by section, with enough
> structural detail (entities, fields, services, permission rules, data flow)
> to draw architecture diagrams, flow diagrams, and data-flow diagrams from.
> This is a **living document** — update it whenever a feature is added,
> changed, or removed. It reflects the actual current implementation, not the
> original aspirational spec (see `docs/` for the original requirements/specs
> that seeded this project).
>
> Last updated: 2026-08-13
>
> **Architecture note**: this app was originally built with no backend at
> all (JSON files + `localStorage`, per §1's original design). It has
> since been migrated to a real shared backend — see the fully rewritten
> §1, §2, and §3 below, and `project-documentation/DATABASE_MIGRATION_PLAN.md`
> for the complete story of why and how, including disaster recovery and
> schema migration tracking.

---

## 1. Overview

The AI Portfolio Dashboard is an internal tool for tracking AI adoption across
a ~30-person US Portfolio engineering organization: who's using AI tools, on
which projects, how many hours it's saving, what's being learned, what
proofs-of-concept are being built, and how everyone's time is scheduled. It is
explicitly **not** a replacement for Jira, Azure DevOps, an ERP, an HRMS, or a
CRM — it stays lightweight and single-purpose.

There **is a backend**: a small Express API (`server/`) in front of a real
shared SQLite database (`server/db/portfolio.sqlite3`, via `better-sqlite3`),
so every user sees the same data instead of each browser keeping its own
private copy. This replaced an earlier no-backend design (JSON files +
`localStorage`) once the app needed to be genuinely multi-user — see
`DATABASE_MIGRATION_PLAN.md` for the full rationale and migration writeup.

The original JSON files in `src/data/` still exist, but only as the
**one-time seed** for a fresh database (`npm run db:migrate`) — the running
app never reads them directly. Every entity shape in §4 below is unchanged
from the original design (the migration was deliberately built so every
data shape already mirrored what a REST response would look like, and every
access already went through a service class rather than a direct
component-to-JSON import) — that's exactly what made swapping each
service's internals from `localStorage` to real HTTP calls a contained
change instead of a rewrite.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| UI framework | React 19 + TypeScript, Vite |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Charts | Recharts |
| Forms | React Hook Form + Zod validation |
| Tables | TanStack Table |
| Drag & drop | `@dnd-kit` (Task Board kanban) |
| Calendar | FullCalendar (`@fullcalendar/react`, `daygrid`, `timegrid`, `interaction`) |
| Icons | Lucide React |
| Routing | React Router v7 |
| Dates | `date-fns` |
| Toasts | Sonner |
| State management | React Context + custom hooks only — no Redux/MobX/Zustand |
| Backend API | Express (`server/`), one router per entity, mounted at `/api/<entity>` |
| Database | SQLite via `better-sqlite3` (`server/db/portfolio.sqlite3`), WAL mode |
| Seed data | `src/data/*.json` — read once by `npm run db:migrate`, never at runtime |

`CLAUDE.md`'s original tech stack list still says "No backend, no Express,
no database" — that constraint was superseded by the migration described in
`DATABASE_MIGRATION_PLAN.md` and should be treated as outdated wherever the
two documents disagree.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Pages (src/pages/*.tsx)                                        │
│  One per route. Own page-level state (filters, dialogs open).   │
└───────────────┬───────────────────────────────────────────────┬─┘
                │                                                 │
                ▼                                                 ▼
┌───────────────────────────────┐              ┌───────────────────────────────┐
│  Feature components            │              │  Hooks (src/hooks/*.ts)       │
│  (src/components/<module>/*)   │◄────uses─────│  Load data, expose CRUD       │
│  Forms, cards, drawers, tables │              │  callbacks, own loading state │
└───────────────┬────────────────┘              └───────────────┬────────────────┘
                │                                                 │
                ▼                                                 ▼
┌───────────────────────────────┐              ┌───────────────────────────────┐
│  Common components              │             │  Services (src/services/*.ts) │
│  (src/components/common/*)     │             │  One class per entity.        │
│  PageHeader, FilterBar, Modal,  │             │  getAll/getById/create/update/│
│  DataTable, EmptyState, etc.    │             │  delete + entity-specific     │
└───────────────────────────────┘              │  methods and side effects     │
                                                  └───────────────┬────────────────┘
                                                                   │ apiRequest()
                                                                   │ (fetch, JSON over HTTP)
                                                                   ▼
                                                  ┌───────────────────────────────┐
                                                  │  Express API (server/)         │
                                                  │  One thin CRUD router per      │
                                                  │  entity (server/routes/*.ts) — │
                                                  │  no business logic, no auth,   │
                                                  │  no validation (see below)     │
                                                  └───────────────┬────────────────┘
                                                                   │ better-sqlite3
                                                                   ▼
                                                  ┌───────────────────────────────┐
                                                  │  SQLite database               │
                                                  │  server/db/portfolio.sqlite3   │
                                                  │  (src/data/*.json only seeds   │
                                                  │  it once, via db:migrate)      │
                                                  └───────────────────────────────┘
```

**Important, and different from what the diagram might suggest**: moving
persistence into a real database did **not** add any server-side
enforcement. All business logic (cross-entity sync, delete guards,
scheduling-conflict checks, etc.) and all permission/field-visibility
checks (§6) still live entirely in the frontend service classes and the
`usePermission()` hook — exactly as before the migration, by deliberate
design (see the comment at the top of `server/routes/_crud.ts`). The
Express routes are intentionally "dumb": they read/write whatever they're
given, with **no request validation and no authentication check** on any
endpoint (the one exception is `POST /api/users/authenticate`, which does
the login credential match server-side — see §6). Practically, this means
anyone who can reach the API's port on the network can read or write any
data directly, bypassing the UI and every permission rule entirely, with no
login required. This was an accepted, explicit tradeoff to keep the
migration scoped (see `DATABASE_MIGRATION_PLAN.md` Phase 2, "Real
authentication," which was intentionally deferred) — it is a real gap, not
an oversight, and should be closed before this is treated as production-hardened.

Cross-cutting layers wrap all of the above:

- **`src/security/*`** — the permission framework (see §6). Every page/component
  calls `usePermission()` to decide what to show, not raw role checks.
- **`src/context/AuthContext.tsx`** — the signed-in `User` account + linked
  `Employee` record.
- **`src/layouts/AppLayout.tsx`** — the shell (navbar + sidebar + content) every
  authenticated route renders inside.

**Service-to-service dependencies** (important for data-flow diagrams — some
services call other services to keep related data in sync):

```
EmployeeService ──creates──► UserService        (new employee ⇒ new login account)
EmployeeService ──reads────► RoleService         (map Employee.role name → Role.id)
ProjectService  ──reads────► ActivityService,    (block delete while referenced)
                              POCService
POCService      ──creates/deletes──► CalendarService   (owner+team schedule blocking)
POCService      ──reads────► EmployeeService     (resolve names/emails for the block)
CalendarService ──creates/updates/deletes──► TaskService   ("Calendar Block for Task" mirroring)
```

No other services call each other — everything else is a page/hook composing
multiple independent service calls with `Promise.all`.

---

## 4. Data Model

All entity shapes live in `src/types/index.ts` (plus `src/types/tasks.ts` for
Task Board types and `src/types/permissions.ts` for the RBAC framework — both
re-exported from `index.ts`). Every JSON file in `src/data/` corresponds to
exactly one interface below **and to one SQLite table** of the same shape
(see `server/db/schema.sql`) — the JSON file is only ever read once, as the
seed for that table, not at runtime.

### 4.1 Employee (`employees.json`)
```ts
interface Employee {
  id: string;                    // "EMP001"
  name: string;
  email: string;
  role: EmployeeRole;            // one of 8 fixed job titles (see §4.9)
  experience: number;            // years
  team: string;                  // free text, e.g. "Software Engineering"
  primarySkill: string;
  secondarySkill: string;
  projects: string[];             // project names (free text, not foreign keys); synced with each Project's members list
  profileImage: string;
  status: "Active" | "Inactive" | "Ex-Employee";
  managerId: string | null;      // self-referencing — org hierarchy
}
```
Employees are **never hard-deleted** — "removing" one sets `status:
"Ex-Employee"` (see `EmployeeService.offboard()`) so historical
activities/POCs/learning stay valid.

### 4.2 Project (`projects.json`)
```ts
interface Project {
  id: string;                    // "P001"
  name: string;
  client: string;
  program: string;
  manager: string;               // Engineering Manager's name (free text)
  techLead: string;               // free text
  technology: string[];          // multi-select, sourced from Settings > Technical Skills
  stage: ProjectStage;           // 8-stage delivery pipeline (see §4.9)
  status: "Active" | "On Hold" | "Completed" | "Planning";
  aiAdoption: number;            // 0-100
  members: string[];             // Employee ids
  startDate: string;             // yyyy-MM-dd
  endDate: string;
}
```
Deletion is blocked while any `Activity` or `POC` references the project
(`ProjectService.delete()` checks both before allowing removal).

### 4.3 Activity — AI usage log (`activities.json`)
```ts
interface Activity {
  id: string;
  employeeId: string;
  projectId: string;
  date: string;
  tool: AITool;                  // Claude/ChatGPT/GitHub Copilot/Gemini/Cursor/Perplexity/Other
  category: ActivityCategory;    // 11 categories, Settings-managed as "AI Activity Categories"
  projectStage: ProjectStage;
  promptSummary: string;
  outcome: string;
  hoursSaved: number;
  impact: "Low" | "Medium" | "High";
  attachment: string;
}
```

### 4.4 SkillRecord (`skills.json`)
One record per employee, flat per-skill columns (not a name/value list):
```ts
interface SkillRecord {
  employeeId: string;
  Magento: SkillLevel; PHP: SkillLevel; React: SkillLevel; JavaScript: SkillLevel;
  GraphQL: SkillLevel; MySQL: SkillLevel; Docker: SkillLevel; Git: SkillLevel;
  Claude: SkillLevel; ChatGPT: SkillLevel; GitHubCopilot: SkillLevel;
  Cursor: SkillLevel; PromptEngineering: SkillLevel;
}
// SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert"
```
> Note: this struct's 13 skill columns are **hardcoded** — they do not read
> from Settings' "Technical Skills"/"AI Skills" lists at runtime (a known gap;
> those two Settings lists are otherwise only consumed by Project's Technology
> field and Settings itself).

### 4.5 LearningRecord (`learning.json`)
```ts
interface LearningRecord {
  id: string; employeeId: string; course: string;
  platform: "Udemy AI Lab" | "Internal Training" | "Other";
  status: "Not Started" | "In Progress" | "Completed";
  progress: number;              // 0-100
  hours: number; certificate: string; completionDate: string;
}
```

### 4.6 POC (`pocs.json`)
```ts
interface POC {
  id: string; title: string;
  ownerId: string;               // senior-role employee (see §16.5 for the role split)
  team: string[];                 // junior-role employee ids
  projectId: string;
  category: POCCategory;         // 7 categories
  description: string;
  status: "Idea" | "In Progress" | "Completed" | "On Hold";
  businessValue: string;
  hoursSaved: number;
  repo: string; demo: string;
  startDate: string;             // yyyy-MM-dd
  endDate: string;               // yyyy-MM-dd
  startTime: string;             // HH:mm
  hoursPerDay: number;
  blockGroupId: string | null;   // ties this POC to its Calendar-blocked events
}
```
Scheduling fields (`team`, `startDate`…`blockGroupId`) were added to support
automatic Team Calendar blocking — see §16.5.

### 4.7 CalendarEvent (`calendarEvents.json`)
```ts
interface CalendarEvent {
  id: string;
  employeeId: string;            // whose calendar this event is on
  title: string; description: string;
  eventType: CalendarEventType;  // Settings-managed list, see §4.9
  start: string; end: string;     // ISO datetime, local (not UTC)
  timeZone: string;
  organizer: string;
  attendees: { name: string; email: string }[];
  location: string;
  outlookEventId: string | null; // reserved for a future live Outlook/Graph sync
  createdBy: string;              // Employee id
  linkedTaskId?: string | null;   // set when eventType === "Calendar Block for Task"
  linkedPocId?: string | null;    // set when eventType === "POC"
  blockGroupId?: string | null;   // shared id across sibling events blocked together
}
```
Deliberately shaped like a Microsoft Graph calendar event so a future live
Outlook integration only has to replace `CalendarService`'s internals.

### 4.8 Task (`tasks.json`) — see §10 for the full Task Board module
```ts
interface Task {
  id: string; taskNumber: string;        // "TASK-0001"
  title: string; description: string;
  type: "Project" | "Standalone";
  category: string;                       // taskCategories.json id, see §10.3
  projectId: string | null;               // required for Project tasks
  assigneeId: string; reporterId: string;
  createdBy: string; lastModifiedBy: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: string;                         // taskWorkflow.json name, see §10.2
  estimateHours: number; actualHours: number; percentComplete: number;
  startDate: string; dueDate: string; completedDate: string;
  displayOrder: number;                   // position within its board column
  labels: string[];
  aiTool: string;
  linkedActivityId: string; linkedPocId: string;
  linkedCalendarEventId?: string | null;  // reciprocal of CalendarEvent.linkedTaskId
  comments: { id: string; authorId: string; date: string; message: string }[];
  attachments: { id: string; fileName: string; uploadedBy: string; uploadDate: string; fileSize: string }[];
  archived: boolean;
  createdDate: string; updatedDate: string;
}
```

### 4.9 Settings-managed enumerations (`settings.json` → `AppSettings`)
These lists back every dropdown/checkbox-group across the app and are edited
on the **Settings** page (§18). All are kept alphabetically sorted on every
read (`SettingsService.withSortedLists()`), regardless of insertion order —
including stale cached data from before a field existed.

| Settings key | Backs | Editable on Settings page? |
|---|---|---|
| `roles` | Employee.role, Owner/Team pickers everywhere | ✅ |
| `technicalSkills` | Project.technology (multi-select) | ✅ |
| `aiSkills` | (label only, not yet wired to a form) | ✅ |
| `skillLevels` | Skill Matrix badges | ❌ (fixed progression) |
| `projectStages` | Project.stage, Activity.projectStage | ✅ |
| `aiTools` | Activity.tool | ✅ |
| `learningPlatforms` | LearningRecord.platform | ✅ |
| `activityTypes` (labeled "AI Activity Categories") | Activity.category | ✅ |
| `pocCategories` | POC.category | ✅ |
| `impactLevels` | Activity.impact | ❌ (fixed progression) |
| `eventTypes` (labeled "Calendar Event Types") | CalendarEvent.eventType | ✅ |
| `statusValues.{project,employee,learning,poc}` | the 4 status enums | ❌ (fixed lifecycles) |

### 4.10 Auth & permission entities — see §6.

---

## 5. Routing & Navigation

Routing (`src/App.tsx`) is a flat table — every protected page is one entry:

```ts
const PROTECTED_ROUTES = [
  { path: "/dashboard", module: "dashboard", Page: Dashboard },
  { path: "/projects",  module: "projects",  Page: Projects },
  { path: "/tasks",     module: "tasks",     Page: TaskBoard },
  { path: "/activities",module: "activities",Page: Activities },  // not in sidebar — see below
  { path: "/people",    module: "people",    Page: People },
  { path: "/calendar",  module: "people",    Page: CalendarPage },
  { path: "/skills",    module: "skills",    Page: SkillMatrix },
  { path: "/learning",  module: "learning",  Page: Learning },
  { path: "/pocs",      module: "pocs",      Page: POCs },
  { path: "/reports",   module: "reports",   Page: Reports },
  { path: "/settings",  module: "settings",  Page: Settings },
  { path: "/users",     module: "users",     Page: Users },
  { path: "/roles",     module: "roles",     Page: Roles },
];
```
Every route is wrapped in `<RequireAuth>` (redirects to `/login` if not signed
in) then `<RequirePermission module="...">` (renders `AccessDenied` if the
signed-in role has no View permission on that module). Unknown paths redirect
to `/dashboard`.

The **sidebar** (`src/utils/navigation.ts` → `NAV_ITEMS`, rendered by
`src/components/layout/Sidebar.tsx`) is a separate, shorter list — filtered
live by `canView(module)` so users only ever see links they can open:

```
Dashboard → Projects → Task Board → People → Calendar → Skill Matrix →
Learning → POCs → Reports → Settings → User Management → Roles & Permissions
```

`/activities` has **no sidebar entry** — the only entry point anywhere in the
app is the **"+ Activity" quick-action button on the Dashboard** (§8, only
rendered if `canCreate("activities")`); otherwise it's reachable only by
typing the URL directly (still permission-gated by `RequirePermission`).

---

## 6. Authentication & Permission Framework

### 6.1 Authentication
Still demo-grade auth, **not production security** — the migration to a
real database (§1–§3) moved *where* the credential check runs, but not
*how* it works: passwords are plaintext, unhashed, in the `users` table.
Flow:

```
Login page → UserService.authenticate(username, password)
  → POST /api/users/authenticate
  → server: SELECT * FROM users WHERE username = ? AND password = ? AND status = 'Active'
      (plaintext comparison, no hashing — see server/routes/users.ts)
  → on success: localStorage["ai-portfolio-dashboard.session"] = user.id
  → AuthContext loads the linked Employee (via user.employeeId) as `currentUser`
```

This credential check is the **one deliberate exception** to "all business
logic stays in the frontend" (§3) — doing the match server-side means a
failed or successful login attempt never ships the full plaintext-password
user list to the browser's network tab the way a naive `GET /api/users`
would. Every other read/write on `/api/users` (and every other entity) has
no such protection: there is no session token or credential required to
call the API directly (see §3's callout) — the session stored in
`localStorage` after login is only ever checked by the **frontend**, never
sent to or verified by the server on subsequent requests.
`AuthContext` (`src/context/AuthContext.tsx`) exposes: `account` (the `User`),
`currentUser` (the linked `Employee`, null for accounts like Super Admin with
no employee), `isAuthenticated`, `isLoading`, `login()`, `logout()`.

### 6.2 Permission model
Chain: **User → Role (roleId) → Permission entry (permissions.json) → one
`ModulePermission` per module → actions + scope + field overrides.**

- **`ModuleId`** (12 values): `dashboard, projects, tasks, activities, people,
  skills, learning, pocs, reports, settings, users, roles`.
- **`PermissionAction`**: `view, create, edit, delete, export, assign,
  comment` (assign/comment are Task-Board-specific).
- **`DataScope`**: `"all" | "team" | "own"` — row-level visibility/edit scope.
  `"team"` currently only appears on Tech Lead's `dashboard` module
  (`{view: "team"}`); every other scoped entry uses `"all"` or `"own"`.
- **Field-level security**: a `ModulePermission` can include a `fields` map —
  each field defaults to `{visible: true, editable: true}` unless explicitly
  overridden (e.g. Intern's `pocs.hoursSaved` is `{visible: false}`).

`src/data/roles.json` — 9 fixed, `isSystem: true` roles (cannot be deleted or
renamed): `super-admin, director, delivery-manager, engineering-manager,
senior-tech-lead, tech-lead, senior-developer, developer, intern`.

`src/data/resources.json` — the registry of all 12 modules: label, path,
supported actions, and the full list of protectable fields per module (used
to render the Roles & Permissions editor UI).

**Full current permission matrix** (from `src/data/permissions.json`):

| Module | super-admin | director | delivery-mgr | eng-mgr | sr-tech-lead | tech-lead | sr-developer | developer | intern |
|---|---|---|---|---|---|---|---|---|---|
| dashboard | view (all) | view (all) | view (all) | view (all) | view (all) | view (**team**) | view (own) | view (own) | view (own) |
| projects | full CRUD (all) | full CRUD (all) | full CRUD (all) | full CRUD (all) | full CRUD (all) | view (all) | view (all)¹ | view (all)¹ | view (all)¹² |
| tasks | full CRUD+assign+comment (all) | same | same | same | same | full CRUD+assign+comment (all) | CRUD+assign+comment (own)³ | CRUD+comment (own)⁴ | edit+comment (own)⁵ |
| activities | full CRUD (all) | same | same | same | same | create/edit/delete, no delete-scope⁶ (all) | CRUD (own) | CRUD (own) | CRUD (own) |
| people | full CRUD (all) | same | same | same | same | view (all) | view (own)⁷ | view (own)⁷ | view (own) |
| skills | view+export (all) | same | same | same | same | view+export (all) | view+export (own) | view+export (own) | view+export (own) |
| learning | full CRUD (all) | same | same | same | same | CRUD, no delete⁸ (all) | CRUD (own) | CRUD (own) | CRUD (own) |
| pocs | full CRUD (all) | same | same | same | same | CRUD (view all / **edit own**) | CRUD (own) | CRUD (own) | **view only** (own)⁹ |
| reports | view+export (all) | same | same | same | same | view+export (all) | view+export (own) | view+export (own) | view+export (own) |
| settings | view+edit | same | **view only** | view only | ❌ no access | ❌ | ❌ | ❌ | ❌ |
| users | full CRUD | same | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| roles | full CRUD | same | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

Footnotes: ¹ `aiAdoption` field read-only. ² Intern additionally hides
`client`. ³/⁴/⁵ decreasing action sets (sr-dev has delete+assign, dev has
delete but no assign, intern has no create/delete, only edit+comment); ⁴/⁵
also cap `estimateHours`/`actualHours` field editability. ⁶ tech-lead's
`activities` entry omits `export`. ⁷ `experience` field read-only. ⁸ tech-lead
can't delete learning records. ⁹ intern's `pocs` also hides `hoursSaved`.

> This table supersedes `docs/05_ROLE_BASED_DASHBOARDS.md`'s original
> aspirational matrix — that document describes the intended design; this
> section reflects what `permissions.json` actually encodes today.

### 6.3 `src/security/` — files & the `usePermission()` API
- **`PermissionService.ts`** — pure evaluator class, built from one role's
  `ModulePermission[]` (internally a `Map<ModuleId, ModulePermission>`).
  `PermissionService.denyAll()` grants nothing (used while loading/signed out).
- **`PermissionContext.ts`** — the `PermissionContextValue` interface + the
  React `Context` object; also defines `DashboardScope = "portfolio" | "team"
  | "personal"`.
- **`PermissionProvider.tsx`** — on `account.roleId` change, loads the `Role`
  + its `Permission` entry, builds a `PermissionService`, and memoizes the
  full context value (including the `canMutateRow` helper and
  `dashboardScope` derivation).
- **`usePermission.ts`** — the hook (throws outside a provider).
- Route guarding itself lives in `src/components/auth/RequirePermission.tsx`
  (§5), which just calls `canView(module)`.

| `usePermission()` member | What it checks |
|---|---|
| `isLoading` | role/permissions still loading |
| `role` | resolved `Role` object, or `null` |
| `hasPermission(module, action)` | raw one-action-on-one-module check |
| `canView/Create/Edit/Delete/Export(module)` | shorthands for the 5 core actions |
| `canViewField(module, field)` | `false` if module isn't viewable at all; else `fields[field].visible`, default `true` |
| `canEditField(module, field)` | `false` if the field isn't even viewable; else `fields[field].editable`, default `true` |
| `getViewScope(module)` | `DataScope` for reads, default `"all"` |
| `getEditScope(module)` | `DataScope` for writes, falls back to view scope then `"all"` |
| `isOwnDataScope(module)` | `getViewScope(module) === "own"` |
| `canEditRow(module, ownerEmployeeId)` | edit permission AND (scope ≠ "own" OR row belongs to the current employee) |
| `canDeleteRow(module, ownerEmployeeId)` | same, for delete |
| `dashboardScope` | `"personal" \| "team" \| "portfolio"`, derived from the `dashboard` module's view scope |

Task-specific extensions (own = assignee **or** reporter, `assign`,
`comment`) live one layer up in `TaskPermissionService` (§10.9), not in
`src/security/` itself.

**`DataScope` in practice** — `"team"` is used in exactly **one** place across
the entire seed data: `tech-lead`'s `dashboard` module (`{view: "team"}`).
`useDashboardData.ts` implements what "team" means specially for that case:
Engineering Managers see everyone sharing `employee.team`; other "team"-scoped
roles see themselves plus members of any project where they're the
`techLead`. Every other scoped module across all 9 roles uses only `"all"` or
`"own"`.

### 6.4 Calendar's bespoke permission layer
Calendar access/mutation rules do **not** go through the module framework
above (there is no `"calendar"` module in `resources.json` — the new
`/calendar` route piggybacks on the `"people"` module's View permission just
to gate the page/nav-item itself). Instead, `src/utils/permissions.ts` hosts
four hand-written, role-id-keyed functions — kept separate deliberately
because "whose calendar" vs. "who authored this block" is a dual-owner
concept the single-scope (`all`/`own`) framework doesn't fit:

- `canViewCalendar(roleId, targetEmployeeId, currentEmployeeId)` — admins
  (`super-admin`, `director`), managers (`delivery-manager`,
  `engineering-manager`, `senior-tech-lead`), and `tech-lead` can view anyone's
  calendar; everyone else only their own.
- `canCreateCalendarEvent(...)` — same admins/managers/tech-lead can block
  time on anyone; `senior-developer`/`developer` only their own; `intern`
  cannot create at all.
- `canEditCalendarEvent(roleId, event, currentEmployeeId)` /
  `canDeleteCalendarEvent(...)` — admins/managers can edit/delete any event;
  tech-lead/senior-developer/developer only events where
  `event.createdBy === currentEmployeeId`.

---

## 7. Layout Shell

`src/layouts/AppLayout.tsx` — every authenticated route renders inside this:
- Fixed **Navbar** (70px) — logo, a (currently static/non-functional) global
  search input, current date, a notifications bell (shows a placeholder toast
  — no real notification system implemented), the signed-in role badge, and
  an account dropdown (sign out).
- Fixed **Sidebar** (260px on desktop; collapses to a slide-out `Sheet` drawer
  below `lg`), rendering the permission-filtered `NAV_ITEMS`.
- Scrollable content area (`<Outlet/>`, lazy-loaded per route with a
  `LoadingSkeleton` fallback) + a `Footer`.

---

## 8. Dashboard *(`/dashboard`, module: `dashboard`)*

**Page**: `src/pages/Dashboard.tsx`. **Data hooks**: `useDashboardData()`
(employees/projects/activities/learning/POCs, in parallel) +
`useTaskStats()` (Task Board widgets). Fully driven by `dashboardScope`
(§6.3) — `"portfolio" | "team" | "personal"` — derived from the `dashboard`
module's view scope.

- **Header**: "Welcome back, {name} — {scope label} ({role name})", where
  scope label is "Portfolio overview" / "Team overview" / "Your personal
  overview".
- **Quick actions** (each only rendered if `canCreate(module)` is true): **+
  Activity** → navigates to `/activities` (the *only* entry point to that
  page anywhere in the app, see §5/§11), **+ Project** → `/projects`, **+
  POC** → `/pocs`.
- **KPI row** — three different card sets depending on scope:
  - *portfolio*: Employees, Active Projects (of N total), AI Adoption %,
    Hours Saved.
  - *team*: Team Members, Team Activities, Learning (team avg %), Hours
    Saved (by team).
  - *personal*: My Activities, Hours Saved, Learning %, My POCs.
- **Task Board row** (only if `canView("tasks")`): `MyTasksWidget` (stat
  tiles — Assigned/Total, In Progress, Due Today, Overdue [flagged if >0] —
  plus the 4 most-recently-updated tasks, and an "Open Task Board" button)
  and `TasksByStatusChart` (Recharts bar chart colored per workflow-column
  color, plus a Critical/High/Medium/Low priority breakdown row).
- **Row 1**: `ActivityTrendChart` (Recharts line chart, weekly activity count
  over ~90 days) and `ProjectStatusChart` (Recharts donut with a center total
  + legend across Active/Completed/On Hold/Planning).
- **Row 2**: `ToolUsageChart` (Recharts bar chart, activities per AI tool)
  and `LearningProgressWidget` (2 stat tiles + a `ProgressBar` per top-4
  courses by enrollment).
- **Recent Activities** — last 6, enriched with employee/project names, or an
  `EmptyState`.

KPI math (`useDashboardData.ts`): `aiAdoption` = average of scoped
`project.aiAdoption`; `hoursSaved` = sum of scoped `activity.hoursSaved`;
`learningCompletion` = average of scoped `learning.progress`; weekly trend
buckets via `date-fns startOfWeek`. A `TopContributors.tsx` component exists
but is **not currently rendered** on the page (dead/unused code).

---

## 9. Projects *(`/projects`, module: `projects`)*

**Page**: `src/pages/Projects.tsx`. **Form**:
`src/components/projects/ProjectFormDialog.tsx`. **Card**:
`ProjectCard.tsx`. **Details**: `ProjectDetailsDrawer.tsx`. **Hook**:
`useProjects()`. **Service**: `ProjectService.ts`.

- **List view**: a responsive card grid (`sm:grid-cols-2 xl:grid-cols-3`), one
  `ProjectCard` per project — name, client, `StatusBadge`, AI Adoption
  `ProgressBar`, stage, technology (comma-joined), manager/tech lead, an
  `AvatarGroup` of team members, and View Details / Edit / Delete actions
  (permission-gated per row via `canEditRow`/`canDeleteRow` — "own" edit scope
  means "I'm the manager on record", checked by name match against
  `currentUser.name` since Project has no `managerId` foreign key).
- **Filters**: search (name/client/technology/manager/techLead), Status,
  Stage, Technology — Status/Stage options come from `settingsService`
  (`statusValues.project`, `projectStages`); Technology options come from
  `settings.technicalSkills` (see §16.5 for how the same field is now
  role-restricted on the near-identical POC form).
- **Add/Edit form fields**: Project Name, Client, Program (hardcoded 3
  options), **Technology** (multi-select checkbox group, sourced from
  Settings > Technical Skills — was a single hardcoded `<select>` before being
  converted), Project Stage, Status, Engineering Manager (dropdown filtered to
  employees with `role === "Engineering Manager"`), Tech Lead (filtered to
  `"Tech Lead"` or `"Senior Tech Lead"`), Start/End Date, AI Adoption (slider),
  **Team Members** (multi-select checkbox group over all employees).
- **Validation**: project name must be unique (case-insensitive, excluding the
  record being edited); End Date must be after Start Date.
- **Delete guard**: `ProjectService.delete()` throws `"REFERENCED"` (shown as
  a friendly toast) if any `Activity` or `POC` still points at the project.
- **Data-shape migration note (historical)**: `technology` used to be a
  single `string`, and `ProjectService.load()` used to defensively coerce
  any legacy single-string value found in `localStorage` into a one-item
  array. That coercion no longer exists — the SQLite migration (§1–§3)
  removed it along with the rest of `ProjectService`'s `localStorage`
  logic, since the `technology` column now has one fixed shape (a JSON-array
  column) from creation. Any future column-shape change now goes through a
  schema migration (`server/db/migrations/`) instead.
- **Team ↔ People sync**: `ProjectService.create()`/`update()` call
  `employeeService.syncProjectMembership(projectName, members, previousMembers)`
  after persisting, which adds the project's name to every newly added
  member's `Employee.projects` and removes it from anyone dropped off the
  team — keeping each employee's People profile in sync with the project's
  **Team Members** field automatically in both directions. Employees who
  were never part of the team (manually tagged from the People form instead)
  are left untouched by this sync. Renaming a project
  (`employeeService.removeProjectEverywhere(oldName)`) and deleting one both
  clean up the stale name from every employee record too.

---

## 10. Task Board *(`/tasks`, module: `tasks`)*

The most complex module in the app. **Page**: `src/pages/TaskBoard.tsx`.
**Components**: `src/components/tasks/*`. **Services**: 8 `Task*Service`
files (§10.9).

### 10.1 `Task` entity (`src/types/tasks.ts`) — see §4.8, confirmed complete.

### 10.2 Workflow columns (`taskWorkflow.json`) — 6, in order
| order | id | name | color | final? | auto % |
|---|---|---|---|---|---|
| 1 | backlog | Backlog | `#64748b` | no | 0 |
| 2 | to-do | To Do | `#3b82f6` | no | 0 |
| 3 | in-progress | In Progress | `#6366f1` | no | 50 |
| 4 | code-review | Code Review | `#a855f7` | no | 70 |
| 5 | testing | Testing | `#f97316` | no | 80 |
| 6 | done | Done | `#22c55e` | **yes** | 100 |

`Task.status` is a plain string (not a closed TS union) matching one of these
names — deliberately, so workflow columns are configuration, not code — but
there's no Settings/admin UI to edit them yet (JSON-only today).
`TaskWorkflowService.getTransitionChanges()` auto-applies the target status's
`percentComplete`, and auto-stamps `completedDate` only when the new status
`isFinalState`.

### 10.3 Task Categories (`taskCategories.json`) — 12, alphabetized
Administration, AI, Bug Fix, Development, Documentation, General, Innovation,
Learning, Meeting, Research, Support, Training. Filter + form field; no CRUD
UI yet (direct JSON edit only, unlike the 9 Settings-managed lists in §4.9).

### 10.4 Views: Board vs Grouped
- **`BoardView.tsx`** — true Kanban, one column per workflow status,
  drag-and-drop via `@dnd-kit` (`DndContext` + `PointerSensor`, 6px
  activation distance so a plain click still opens the details drawer
  instead of starting a drag). Cross-column drops persist via
  `TaskBoardService.computeDropChanges()` → batched `taskService.updateMany`.
  Only rendered when grouping = "Status".
- **`GroupedView.tsx`** — static (non-draggable) stacked sections, one per
  group; cards show their own status badge since the section no longer
  implies it.
- **`TaskGrouping`** (`TaskBoardService.ts`): `Status | Project | Assignee |
  Category | Priority`. Priority groups sort by fixed severity
  (Critical→Low); others sort alphabetically with "Standalone" pushed last.

### 10.5 Creating a task: full form vs Quick Task
- **`TaskFormDialog.tsx`** — full editor, 15 fields (title, description,
  type, project, category, assignee, priority, status, estimate/actual
  hours, start/due date, labels, aiTool, linkedActivityId, linkedPocId),
  every field individually field-permission gated. Project-type tasks must
  reference a project; due date ≥ start date.
- **`QuickTaskDialog.tsx`** — 6 fields only (title, assignee, optional
  project, category, priority, due date), no field-permission gating, always
  lands in the default status ("To Do") at 0 hours/0%.

### 10.6 Toolbar (`TaskToolbar.tsx`)
Row 1: search, then whichever optional controls the user has opted into
(persisted per-browser in `localStorage`) — Saved View select, Grouping
select, Board/List view toggle, Export (if `canExport`), Quick Task (if
`canCreate`) — plus "New Task". Row 2: whichever filters are enabled (all on
by default) — Project, Type, Category, Status, Priority, Assignee, Reporter,
AI Tool, Label, Due (Overdue/Due Today/Due This Week) — plus a fixed "Show
archived tasks" checkbox. All filters AND together. Saved views: All Tasks,
My Tasks (assignee OR reporter = me), Project Tasks, Standalone Tasks,
Overdue, Due Today, Completed, AI Tasks.

### 10.7 Task Details Drawer
Every section individually field-permission gated: header (number, priority,
Archived badge) + inline editable status, action buttons (Edit / Duplicate /
Archive-Restore / Delete), description, progress bar, Project & Type,
Assignment (assignee/reporter/createdBy/lastModifiedBy), Scheduling
(estimate/actual hours, start/due/completed dates), AI Information (aiTool +
linked Activity/POC cards), Labels, **Attachments** (metadata display only —
no upload UI exists), **Comments** (newest-first, add-comment gated by the
dedicated `comment` action), and a History footer.

### 10.8 CSV export (`TaskExportService.ts`)
Columns: Task Number, Title, Type, Project, Category, Assignee, Reporter,
Priority, Status, Estimate/Actual Hours, % Complete, Start/Due/Completed
Date, Labels, AI Tool, Archived. Downloads `task-board-export.csv`.
Excel/PDF are explicitly future/not implemented.

### 10.9 Task-prefixed services
| Service | Purpose |
|---|---|
| `TaskService.ts` | CRUD, duplicate, archive, comments; generates `TASK-####` numbers |
| `TaskWorkflowService.ts` | loads workflow statuses & categories; default-status + transition math |
| `TaskBoardService.ts` | groups tasks into columns/sections; computes drag-drop displayOrder/status changes |
| `TaskFilterService.ts` | applies the combinable filter set + saved views |
| `TaskSearchService.ts` | free-text search across number/title/description/category/names/labels/comments |
| `TaskStatisticsService.ts` | dashboard/People/Reports aggregations (overview, myTasks, overdue, workload, completion trend) |
| `TaskPermissionService.ts` | own-task = assignee OR reporter; edit/delete/comment/assign checks; self-only assignee restriction without `assign` |
| `TaskExportService.ts` | builds & downloads the CSV export |

### 10.10 Cross-module links
`linkedActivityId`, `linkedPocId` (plain string ids, shown as read-only cards
in the details drawer) and `linkedCalendarEventId` (reciprocal of
`CalendarEvent.linkedTaskId` — see §13.5's "Calendar Block for Task"
mirroring, the one flow that creates a Task automatically rather than by
hand).

---

## 11. Activities — AI Usage Log *(`/activities`, module: `activities`)*

**Not in the sidebar** — see §5/§8: the only way in is the Dashboard's "+
Activity" button (or a direct URL, still permission-gated).

**Page**: `src/pages/Activities.tsx`. **Form**: `ActivityFormDialog.tsx`.
**Service**: `ActivityService.ts`. Entity fields — see §4.3.

- **List view**: `DataTable` (TanStack Table) — Date, Employee (+ prompt
  summary sub-line), Project, Tool (badge), Category, Stage, Hours
  (sortable), Impact (status badge), row actions (Edit/Delete, ownership by
  `employeeId`).
- **Filters**: search, Date range (Last 7/30/90 days), Tool, Project,
  Employee (hidden entirely for own-data-scope roles), Category.
- **Add/Edit form fields**: Employee, Project, Date (cannot be future), AI
  Tool (`settings.aiTools`), Activity Type (`settings.activityTypes`),
  Project Stage (`settings.projectStages`), Prompt Summary (≤1000 chars),
  Outcome (≤2000 chars), Hours Saved (0–100), Impact
  (`settings.impactLevels`) — every field individually field-permission
  gated.

---

## 12. People *(`/people`, module: `people`)*

**Page**: `src/pages/People.tsx`. **Form**:
`src/components/people/EmployeeFormDialog.tsx`. **Card**: `EmployeeCard.tsx`.
**Profile**: `EmployeeProfileDrawer.tsx`. **Hook**: `useEmployees()`.
**Service**: `EmployeeService.ts`.

- **List view**: card grid with search + Role/Technology/Project filters
  (Role options from `settings.roles`; Technology from each employee's
  `primarySkill`, not Settings). "Own data" scope roles (senior-developer,
  developer, intern) see only their own card and no filter bar.
- **Add/Edit form fields**: Name, Email (uniqueness-checked), **Role**
  (restricted to `settings.roles` — was a hardcoded constant before being
  wired live), Experience, Team (4 hardcoded options), Status, Reports To
  (excludes self and anyone who'd create a manager cycle), Primary/Secondary
  Skill, **Projects** (multi-select checkbox list of real `Project` names;
  optional — an employee can have zero, one, or several). Assignments made
  here are independent of formal project team membership; see the Projects
  section below for the auto-sync direction that runs the other way.
- **Side effect on create**: `EmployeeService.create()` also creates a
  matching `User` login account (`generateUsername()` → `firstname.lastname`,
  deduplicated; default password `"Welcome@123"`; `roleId` resolved by
  matching the RBAC `Role.name` to the chosen `EmployeeRole` string, falling
  back to `"developer"`). This is the People↔User Management sync mentioned
  throughout the code as "docs/10: must never drift apart".
- **Offboarding** (`OffboardEmployeeDialog.tsx` → `EmployeeService.offboard()`):
  sets `status: "Ex-Employee"` (never a hard delete), requires every direct
  report to be reassigned to a new manager first (throws `"REPORTS_UNASSIGNED"`
  otherwise), and deactivates (not deletes) their linked `User` account.
- **Employee Profile Drawer** — 5–7 tabs depending on permission:
  **Overview** (all core fields, field-level-security gated individually),
  **Skills** (this employee's `SkillRecord`, one row per skill column),
  **Learning** (progress bars per course), **Activities** (latest 8, prompt
  summary + tool/category/date/hours), **Tasks** (only if `canView("tasks")`
  — assigned-task stats + latest 8), **POCs** (owned POCs), and **Calendar**
  (only if `canViewCalendar()` allows it for this viewer/target pair — embeds
  `PeopleCalendar`, the single-person calendar, see §13.6).

---

## 13. Calendar *(`/calendar`, module: `people`)* — Team Calendar

A dedicated top-level page (moved out from being a tab inside People).
**Page**: `src/pages/Calendar.tsx`. **Core component**:
`src/components/people/TeamCalendar.tsx`. **Toolbar**: `CalendarToolbar.tsx`.
**Block form**: `CalendarEventFormDialog.tsx`. **Event detail popover**:
`CalendarEventModal.tsx`. **Multi-select filter**: the reusable
`src/components/common/MultiSelectDropdown.tsx`. **Hook**:
`useTeamCalendarEvents(employeeIds)` (in `useCalendarEvents.ts`). **Service**:
`CalendarService.ts`.

### 13.1 Default view & filtering
Opens showing **everyone's** blocked time merged onto one timeline by
default — no manual selection required. State model (`TeamCalendar.tsx`):
`filterIds: string[]` where **empty means "everyone"**; a non-empty array is
an explicit subset. The `MultiSelectDropdown` trigger reads "All People" /
a name / "N selected" accordingly; picking anyone from it narrows the view;
selected people also show as removable badges directly under the dropdown
(clicking a badge's × removes just that person); a "Clear" action inside the
dropdown (or removing every badge) returns to "All People". Only employees
the viewer has `canViewCalendar()` permission for ever appear as options.

### 13.2 Rolling week view
`CalendarViewOption` = `"dayGridMonth" | "timeGridRollingWeek" |
"timeGridDay"`. The Week view is a **custom FullCalendar view**
(`ROLLING_WEEK_VIEWS` in `CalendarToolbar.tsx`: `{type: "timeGrid", duration:
{days: 7}, dateAlignment: "day"}`) that always shows *today* in the first
column and the next 6 days after it — not the stock Sunday-aligned week. The
same custom view is used by both `TeamCalendar` and the single-person
`PeopleCalendar`.

### 13.3 Empty state
When the current filter has zero events, the FullCalendar grid is not shown
at all — only an `EmptyState` ("No Calendar Events Found — Use Block Calendar
above to block time."). The `FullCalendar` instance stays **mounted but
visually hidden** (`className="hidden"`, not conditionally unrendered) so
Today/Prev/Next navigation and the date-range title keep working even with
nothing to show.

### 13.4 Creating a block — "Block Calendar"
The **Block Calendar** button (renamed from the generic "Create Event") opens
`CalendarEventFormDialog` with its **own independent people-picker** — who
you're currently viewing/filtering on the page has no bearing on who a new
block targets. Field: **"Block For"** (`FormCheckboxGroupField`), populated
from `blockableEmployees` (everyone the viewer has `canCreateCalendarEvent()`
for), starting **empty** — except when there's only one possible candidate
(e.g. the single-person `PeopleCalendar` tab), in which case the field is
skipped entirely and that one person is targeted automatically. Editing an
existing event always keeps its original single `employeeId` — the picker
never applies to edits.

Other fields: Title, Description, **Event Type** (Settings-managed list, see
§4.9 — includes the special `"Calendar Block for Task"` and `"POC"` types),
Start/End Date (multi-day blocks fan out into one event per day), Start/End
Time, Location, Attendees (free-text comma-separated emails). A multi-day ×
multi-person block creates `days.length × targets.length` individual
`CalendarEvent` records sharing one `blockGroupId` (capped at 31 days via
`MAX_RANGE_DAYS`).

### 13.5 "Calendar Block for Task" mirroring (`CalendarService.ts`)
Choosing this specific Event Type makes the calendar block **auto-create a
linked Task Board task** (status "To Do", `labels: ["Calendar Block"]`) and
store the task's id back on the event (`linkedTaskId`); the task stores
`linkedCalendarEventId` reciprocally. On update, only a narrow field set
(`title`, `description`, `estimateHours`, `startDate`, `dueDate`) is
re-synced to the task — status/percentComplete/comments are never clobbered,
since the Task Board owns those from creation onward. On delete, the linked
task is deleted first.

### 13.6 Single-person calendar (`PeopleCalendar.tsx`)
The Calendar tab inside an `EmployeeProfileDrawer` (§12) — same
`CalendarEventFormDialog`/toolbar/rolling-week machinery, scoped to one
employee's own calendar via `useCalendarEvents(employee)`.

### 13.7 No conflict detection (generic events)
Ordinary calendar blocking has **no double-booking check** — any employee can
be freely over-booked via `CalendarEventFormDialog`. (Contrast with POC
scheduling, §16.5, which does hard-block on conflicts — that check lives in
`POCService`, not in the shared calendar form, so it only applies to
POC-originated blocks.)

---

## 14. Skill Matrix *(`/skills`, module: `skills`)*

**Page**: `src/pages/SkillMatrix.tsx`. **Service**: `SkillService.ts`.
Entity — `SkillRecord`, §4.4.

- **Grid**: rows = employees, columns = the 13 skills in `SKILL_COLUMNS`
  (`src/utils/skills.ts`), rendered as a `DataTable`. Each cell is a
  `SkillBadge` (4-level color scale).
- **Read-only — no editing exists at all.** `SkillService.ts` exposes only
  `getAll()`/`getByEmployee()`; there is no create/update/delete, no form
  dialog, no inline editing anywhere in the Skill Matrix page. (The
  Employee Profile Drawer's Skills tab, §12, is likewise read-only display.)
- **Export** button (`canExport("skills")`-gated) is a placeholder toast
  ("Export arrives with the Reports phase") — the real Skill Matrix CSV
  export lives inside the Reports module instead (§17, report type 6).
- **Filters**: search (name/role/team, hidden for own-data-scope), Skill,
  Level. Own-data-scope roles see only their own row, no search box.

---

## 15. Learning *(`/learning`, module: `learning`)*

**Page**: `src/pages/Learning.tsx`. **Card**: `LearningCard.tsx`. **Form**:
`LearningFormDialog.tsx`. **Service**: `LearningService.ts`. Entity — §4.5.

- **KPI row**: Overall Completion %, Courses Completed, In Progress, Hours
  Learned — computed per-user for own-data-scope roles, portfolio-wide
  otherwise.
- **List view**: card grid (`LearningCard`) — course title, employee name,
  `StatusBadge`, `ProgressBar`, platform/hours/certificate badges (Award icon
  if a certificate is on file), completion date, row-permission-gated
  Edit/Delete. A `LearningLeaderboard` side panel shows for non-own-data-scope
  roles only.
- **Filters**: search (course/employee/platform), Platform, Status, Employee
  (hidden for own-data-scope).
- **Add/Edit form fields**: Employee, Course (≤100 chars), Platform, Status,
  Completion % (forced to 100 when status = Completed), Hours, Completion
  Date (required only when status = Completed, cannot be future).

---

## 16. POCs & Innovation *(`/pocs`, module: `pocs`)*

**Page**: `src/pages/POCs.tsx`. **Form**: `src/components/pocs/POCFormDialog.tsx`.
**Card**: `POCCard.tsx`. **Details**: `POCDetailsDrawer.tsx`. **Hook**:
`usePOCs()`. **Service**: `POCService.ts` (also exports the standalone
`checkPOCScheduleConflicts()` function used by the form).

### 16.1 List view
Card grid; search (title/owner/project/description/businessValue) + Status,
Owner (hidden for own-data-scope users), Category filters. "Own data scope"
roles see only POCs they own. Each `POCCard` shows title, project, status,
business value (clamped), category/hoursSaved/repo/demo badges, an Owner
avatar row, and — if any — a **Team** avatar row (`teamNames`, only rendered
when non-empty).

### 16.2 Owner / Team role split
- **Owner** — restricted to senior roles: Director, Delivery Manager,
  Engineering Manager, Senior Tech Lead, Tech Lead. Exception: if the caller's
  edit scope is `"own"` (senior-developer/developer/intern-tier POC creation),
  the Owner field collapses to just themselves regardless of role — a forced
  single candidate isn't a "choice" the role gate needs to police.
- **Team** — a `FormCheckboxGroupField` restricted to junior roles: Senior
  Developer, Developer, Intern. Optional (a solo-owner POC is valid). Always
  sourced from the **full** employee roster, independent of the Owner field's
  scope restriction.

### 16.3 Scheduling fields
`startDate`, `endDate`, `startTime`, `hoursPerDay` (all required). Validated:
End Date ≥ Start Date, range capped at **120 days** (`MAX_POC_RANGE_DAYS` —
deliberately larger than the generic calendar block's 31-day cap, since POCs
are longer-running engagements), `hoursPerDay` between 0.5 and 12.

### 16.4 Hard conflict check before save
`POCFormDialog.handleSubmit` calls `checkPOCScheduleConflicts({employeeIds:
[owner, ...team], schedule, excludeBlockGroupId})` **before** calling
`onSave`. It fetches existing events for everyone involved
(`calendarService.getByEmployees`), walks every day in the proposed range,
and flags any existing event whose time range overlaps — skipping events
belonging to the POC's own `blockGroupId` (so editing doesn't flag itself).
Any conflict **blocks the save entirely** and renders a specific banner:
*"`{name}` is busy `{date}` `{start}`–`{end}` (`{event title}`)"* for each
conflict found — the only cross-entity async validation in the app that
surfaces a structured error like this rather than a generic toast.

### 16.5 Calendar auto-blocking (`POCService.ts`)
Every POC's schedule is mirrored onto the Team Calendar automatically,
modeled on §13.5's task-mirroring pattern but inverted (one POC → many
calendar events, tied together by `POC.blockGroupId` rather than a single
`linkedTaskId`):
- **`create()`**: always mints a fresh `blockGroupId`
  (`crypto.randomUUID()`), builds one `CalendarEvent` (`eventType: "POC"`,
  `title: "POC: {title}"`, `linkedPocId`, synthesized `attendees` from each
  target's `Employee` record) per (day × [owner, ...team]), and creates them
  all before persisting the POC.
- **`update()`**: only re-syncs (delete old group's events, create new ones)
  when `team`/`startDate`/`endDate`/`startTime`/`hoursPerDay`/`ownerId`
  actually changed — a plain retitle doesn't touch the calendar. Legacy POCs
  with no `blockGroupId` yet get one minted on their first qualifying edit.
- **`delete()`**: deletes every event in the POC's `blockGroupId` first (via
  `CalendarService.deleteByGroup()`), then the POC itself.
- **Trust boundary**: `POCService` does **not** re-run the conflict check
  itself — §16.4's check is the sole gate, run once by the form. A future
  second entry point (bulk import, API) would need to call
  `checkPOCScheduleConflicts()` itself.
- **Data migration (historical)**: `POCService.load()` used to normalize any
  POC (seed or `localStorage`) missing the newer scheduling fields to safe
  defaults (`team: []`, empty dates/time, `hoursPerDay: 0`,
  `blockGroupId: null`) rather than crashing. That normalization no longer
  exists post-SQLite-migration — the `pocs` table's columns have a fixed
  shape with real `DEFAULT` values from creation (`server/db/schema.sql`),
  and any future field addition goes through a schema migration
  (`server/db/migrations/`) instead of per-read JS coercion.

---

## 17. Reports *(`/reports`, module: `reports`)*

**Page**: `src/pages/Reports.tsx`. **Definitions**:
`src/utils/reportDefinitions.ts`. **Hook**: `useReportsData()` — supplies all
7 source arrays at once: employees, projects, activities, learning, skills,
pocs, tasks.

Flow: pick a report type + date range + project filter → **Generate Report**
→ `computeReport(type, sources, filters)` (own-data-scope roles get their
sources pre-scoped to just themselves first) → renders 4 `KPICard` metric
tiles + a detail `DataTable`. **Only CSV export is implemented**
(`reportToCSV` + Blob download); Excel and PDF buttons show a "planned for a
future release" toast.

**The 10 report types**:
1. **Weekly Summary** — last 7 days: Activities/Hours Saved/Active
   Contributors/Top Tool + per-employee breakdown.
2. **Monthly Summary** — same, last 30 days.
3. **Project Summary** — per-project client/status/stage/AI adoption
   %/activities/hours saved/POC count.
4. **AI Activities** — flat activity log + a high-impact metric.
5. **Learning Progress** — per-employee course/completion/hours rollup.
6. **Skill Matrix** — counts of each skill level per skill column (the "real"
   Skill Matrix export the Skill Matrix page itself defers to).
7. **POCs** — title/owner/project/category/status/hours saved rows.
8. **Team Performance** — per-employee activities/hours/learning%/POCs.
9. **Task Workload** — per-employee assigned/completed/overdue/estimate vs.
   actual hours.
10. **Tasks by Project** — tasks bucketed per project + a "Standalone Tasks"
    bucket.

---

## 18. Settings *(`/settings`, module: `settings`)*

**Page**: `src/pages/Settings.tsx`. **Generic list editor**:
`src/components/settings/SettingsSection.tsx` +
`ValueFormDialog.tsx`. **Service**: `SettingsService.ts`.

A single generic component renders every tab — Roles, Technical Skills, AI
Skills, AI Tools, Project Stages, **AI Activity Categories**, POC Categories,
Learning Platforms, **Calendar Event Types** (9 tabs total, see §4.9 for what
each backs) — as an "Add / Edit / Delete" table over a plain `string[]`.
Read-only for anyone without `canEdit("settings")` (a `Badge` shows
"Read-only ({role name})" instead of the edit controls).

**Always-sorted lists**: every editable list is re-sorted alphabetically on
every read *and* every write. This logic now lives server-side
(`server/routes/settings.ts`'s `sortIfEditableList()`, applied both when
returning `GET /api/settings` and when persisting `PUT /api/settings/:key`)
— it moved from the frontend's `SettingsService.withSortedLists()` (which
no longer exists) during the SQLite migration, since sorting on write there
means every reader always gets an already-sorted list, regardless of which
client wrote it last. `SettingsSection` also re-sorts its local state on
every add/rename, so new entries land in the right place immediately in
the UI, ahead of the next full refetch.

---

## 19. User Management *(`/users`, module: `users`)*

**Page**: `src/pages/Users.tsx`. **Form**: `UserFormDialog.tsx`. **Hook**:
`useUsers()`. **Service**: `UserService.ts`. Entity — `User`, §4/§6.1.

- **List**: `DataTable` — Username (+ id sub-line), Employee, Role (badge),
  Status, row actions. Search across username/employee/role.
- **Add/Edit form**: Username (regex-validated + uniqueness-checked),
  Password (required on create, optional on edit — blank keeps the current
  one), Role (from `roleService`), Status, Linked Employee (excludes
  employees already linked to a *different* account).
- **Guardrails**: cannot delete your own signed-in account (button disabled);
  cannot delete the last active Super Admin (`UserService.delete()` throws
  `"LAST_ADMIN"`).
- **Sync with People** (§12): creating an `Employee` auto-creates a matching
  `User` here; offboarding an employee auto-deactivates their account. The
  People page itself re-checks which employees still lack an account
  whenever the employee list changes.
- **Legacy data migration**: `UserService.load()` maps any account saved
  before the permission framework existed (old role-name strings like
  `"Super Admin"`) to the current `roleId` via a hardcoded `LEGACY_ROLE_IDS`
  table.

---

## 20. Roles & Permissions *(`/roles`, module: `roles`)*

**Page**: `src/pages/Roles.tsx`. **Editor**: `PermissionMatrix.tsx` inside
`RoleFormDialog.tsx`. **Hook**: `useRoles()`.

- **List**: `DataTable` — Role name (+ id), Description, Modules count, Users
  count, Type badge (System/Custom). System roles (`isSystem: true`, all 9
  seeded roles) can't be deleted or renamed, but **their permissions are
  fully editable**. Deleting a role still assigned to any user throws
  `"ROLE_IN_USE"`.
- **The permission editor** renders one collapsible block per `Resource`
  (§4.9/§6.2's `resources.json`), each with:
  1. **Action checkboxes** — one per action the resource supports (from
     `resource.actions`: view/create/edit/delete/export/assign/comment).
  2. **Data scope pickers** — only for `scopable: true` modules: a View
     scope select (All / Team / Own) and, only if `edit` is one of the
     module's actions, a separate Edit scope select (defaults to the view
     scope).
  3. **Field Permissions** — a sub-panel (only if the resource has any
     registered fields) with Visible + Editable checkboxes per field;
     Editable is force-disabled whenever Visible is off.
- This is genuinely the entire permission surface — no additional row-level
  allow-list mechanism exists beyond the three `DataScope` values.

---

## 21. Cross-Module Data Flows

These are the flows most worth turning into sequence/data-flow diagrams —
each one crosses a service boundary that isn't obvious from any single page.

### 21.1 Login → session restore
```
Login page → UserService.authenticate(username, password)
  → POST /api/users/authenticate → server-side match against the `users`
    table, require status === "Active" (see §6.1 — the one credential
    check that runs server-side; everything else below is frontend-only)
  → success: localStorage["ai-portfolio-dashboard.session"] = user.id
  → AuthContext: EmployeeService.getAll() → find by user.employeeId → currentUser
  → PermissionProvider: RoleService.getById(user.roleId) + PermissionService.getByRoleId(user.roleId)
    → builds the PermissionService evaluator used by every canView/canEdit/... call app-wide
```

### 21.2 Add Employee → auto-create login account
```
People > Add Employee → EmployeeFormDialog → EmployeeService.create()
  ├─ persist new Employee row
  ├─ generateUsername(name)  — "firstname.lastname", deduped against existing usernames
  ├─ RoleService.getAll() — map Employee.role name → matching Role.id (fallback "developer")
  └─ UserService.create({ username, password: "Welcome@123", roleId, employeeId, status: "Active" })
```

### 21.3 Offboard Employee → deactivate account + reassign reports
```
People > Remove → OffboardEmployeeDialog (must supply a new manager for every direct report)
  → EmployeeService.offboard(id, reassignments)
      ├─ set employee.status = "Ex-Employee" (never hard-deleted)
      ├─ reassign each direct report's managerId
      └─ UserService.update(linkedAccount, { status: "Inactive" })
```

### 21.4 Add/Edit POC → conflict check → calendar fan-out
```
POCs > Add/Edit POC → POCFormDialog.handleSubmit
  → checkPOCScheduleConflicts({ employeeIds: [owner, ...team], schedule, excludeBlockGroupId })
      → CalendarService.getByEmployees(employeeIds) → overlap-check per day in range
      → any conflict found ⇒ STOP, render banner, do not save
  → (no conflicts) onSave → POCService.create()/update()
      ├─ mint/reuse blockGroupId
      ├─ EmployeeService.getAll() → resolve names/emails for attendees
      └─ CalendarService.create() × (days × [owner, ...team])   [eventType: "POC", linkedPocId]
```

### 21.5 Delete POC → cascade-delete its calendar blocks
```
POCs > Delete → POCService.delete(id)
  → CalendarService.deleteByGroup(poc.blockGroupId)   — every sibling event, and any Task each one mirrored
  → remove the POC row
```

### 21.6 "Calendar Block for Task" event → mirrored Task
```
Calendar > Block Calendar (Event Type = "Calendar Block for Task") → CalendarEventFormDialog
  → CalendarService.create()
      → eventType === TASK_BLOCK_TYPE ⇒ TaskService.create(taskInputFor(event))
      → store the new task's id back on the event as linkedTaskId
  (edit: narrow re-sync of title/description/estimateHours/dates only — never status/percentComplete)
  (delete: linked Task deleted first, then the event)
```

### 21.7 Project deletion guard
```
Projects > Delete → ProjectService.delete(id)
  → Promise.all([ ActivityService.getByProject(id), POCService.getAll() ])
  → any Activity or POC still references this project ⇒ throw "REFERENCED", block deletion
```

### 21.8 Permission evaluation (every gated UI element)
```
Component renders → usePermission() → canView/canEdit/canViewField/... (§6.3)
  → PermissionContextValue built once per role by PermissionProvider
  → looks up the module's ModulePermission in the current role's Permission.modules[]
  → action ⇒ actions[action] ?? false
  → field  ⇒ fields[field]?.visible/editable ?? true
  → scope  ⇒ scope.view / scope.edit ?? "all"
```

---

## 22. Non-Functional Notes

- **Real shared backend (as of 2026-08-13)** — every service persists to a
  shared SQLite database via a small Express API (§1–§3), not to each
  browser's own `localStorage`. `src/data/*.json` is only ever read once, by
  `npm run db:migrate`, to seed a fresh database. Seed content is unchanged
  from the original design: most transactional entities (`activities.json`,
  `calendarEvents.json`, `learning.json`, `pocs.json`, `projects.json`,
  `skills.json`, `tasks.json`) ship **empty** (`[]`) — only
  `employees.json`, `users.json`, `roles.json`, `permissions.json`,
  `resources.json`, `settings.json`, `taskCategories.json`, and
  `taskWorkflow.json` have real seeded content. The app is meant to be
  populated by its ~30 users at runtime, same as before.
- **Real network latency, no more artificial delay** — the old
  `simulateRequest()` flat 300ms `setTimeout` (written to make the UI behave
  correctly against Promises/loading states before a real API existed) is
  gone. `src/services/BaseService.ts` now exports `apiRequest()`, a thin
  `fetch()` wrapper — latency is whatever the actual network/API round-trip
  takes (small and consistent for a same-VM setup, but real).
- **Self-healing reads were retired, not replaced 1:1** — the old pattern of
  normalizing legacy data shapes on every `localStorage` read
  (`SettingsService.withSortedLists()`, `ProjectService`'s technology-array
  coercion, `EmployeeService`'s `normalizeEmployee()`, `POCService`'s
  scheduling-field migration) no longer exists in the frontend services —
  none of those functions are present anymore. A SQLite column has one
  fixed shape from the moment it's created, so there's nothing to coerce on
  read. **Evolving that shape later** (e.g. adding a column) is now handled
  by versioned schema migrations (`server/db/migrations/`, tracked in a
  `schema_migrations` table, applied automatically on server start) instead
  of ad-hoc JS normalization — see `DATABASE_MIGRATION_PLAN.md`'s
  "Update — 2026-08-13" section for the full mechanism and why it's needed
  (`schema.sql`'s `CREATE TABLE IF NOT EXISTS` only takes effect once, on a
  table's first creation).
- **Migration to a real API — completed.** This was possible as a contained
  change specifically because every data shape in `src/types/` already
  mirrored what a REST response would look like, and because components
  only ever called service methods — never imported JSON directly. Swapping
  each service's internals from `localStorage` to real HTTP calls
  (`apiRequest()`) required zero changes to any component or page.
- **Demo-only authentication, unchanged in substance** — plaintext
  passwords, no hashing, no session tokens verified per request. The
  migration moved *where* the login credential check runs (server-side now,
  §6.1) but did not add real security; still explicitly documented in code
  as not production-grade.
- **Permission enforcement is still entirely client-side — and the bypass
  surface got bigger, not smaller.** Before this migration, bypassing a
  permission check meant editing your own browser's `localStorage` via
  devtools — limited to your own local data. Now, the Express API accepts
  any request with **no authentication or authorization check at all**
  (aside from the one login-matching exception in §6.1): anyone who can
  reach the API's network port can read or write *any* user's data
  directly — `curl`, Postman, or a script, no login required — completely
  bypassing every `canView`/`canEdit`/field-level rule in §6. This was an
  explicit, scoped-out decision (`DATABASE_MIGRATION_PLAN.md` Phase 2, "Real
  authentication," deferred rather than skipped by accident) and should be
  treated as a real, open item — not a theoretical one — before this app is
  relied on with real, sensitive data on a network reachable by more than a
  fully trusted audience.

---

## 23. Changelog

Track feature work here as it lands, newest first — this keeps the document
honest as a living reference.

- **2026-08-13** — Rewrote §1–§3, §6.1, §18, and §22 to describe the actual
  current architecture: a real Express + SQLite backend (`server/`) exists,
  replacing the original no-backend/`localStorage` design these sections
  had described since this document was first written. This backend was
  built outside this document's awareness (discovered mid-conversation
  while debugging a `npm install`/login issue) and had already been running
  for some time before the docs caught up — a reminder that "living
  document" only holds if updates happen in the same session as the change,
  which didn't happen here. Also corrected several "current behavior"
  claims that had quietly gone stale in the same way: `SettingsService`,
  `ProjectService`, and `POCService`'s old `localStorage`-era self-healing
  normalization functions no longer exist in the frontend at all (moved
  server-side for settings, or simply unnecessary now that SQLite columns
  have a fixed shape) — those sections now say so explicitly rather than
  describing removed code as current. Most explicitly: documented that
  permission/field-level enforcement (§6) and all request validation remain
  entirely client-side even with a real backend in place — the Express API
  currently accepts any request with no authentication check at all except
  the login endpoint, which is a materially larger bypass surface than the
  old "devtools on your own local data" gap, and is called out as a real
  open item rather than a theoretical one.
- **2026-08-13** — Incremental schema migration tracking added for the
  SQLite backend: `server/db/migrations/` (versioned `.sql` files, one per
  structural change) + `server/db/migrations.ts` (tracks which ones have
  applied per-database in a `schema_migrations` table, runs pending ones
  automatically on every `getDb()` call). This fixes a real gap —
  `schema.sql`'s `CREATE TABLE IF NOT EXISTS` statements only take effect
  the first time a table is created, so editing them to add a column to an
  *existing* table on dev/production silently did nothing. Also added
  `npm run db:migrate-schema` for applying migrations as an explicit deploy
  step. Full writeup, including the exact problem this solves and how test
  data stays out of it, is in `DATABASE_MIGRATION_PLAN.md`'s "Update —
  2026-08-13" section.
- **2026-08-08** — Multi-project assignment + auto-sync with Project teams:
  `Employee.currentProject: string` was replaced with
  `Employee.projects: string[]`, so a person can now belong to zero, one, or
  several projects. The People "Add/Edit Employee" form's Current Project
  dropdown became a multi-select checkbox group (`FormCheckboxGroupField`,
  optional). More importantly, `ProjectService.create()`/`update()` now call
  `employeeService.syncProjectMembership()` after saving: selecting someone
  as a Project's team member automatically adds that project to their People
  profile, and removing them from the team automatically removes it — no
  manual double-entry between the two pages. Renaming or deleting a project
  cleans up the stale project name from every employee record
  (`removeProjectEverywhere()`). `EmployeeService.load()` gained a
  `normalizeEmployee()` migration so already-persisted (localStorage)
  records using the old single-string shape are converted automatically.
  Updated: `src/types/index.ts`, `src/data/employees.json`,
  `src/services/EmployeeService.ts`, `src/services/ProjectService.ts`,
  `src/components/people/EmployeeFormDialog.tsx`, `src/pages/People.tsx`
  (filter now checks array membership), `src/components/people/EmployeeCard.tsx`
  and `EmployeeProfileDrawer.tsx` (display a comma-joined list),
  `src/data/resources.json` (field-permission key renamed
  `currentProject` → `projects`), and `docs/01`, `docs/02`, `docs/06`,
  `docs/07`, `docs/10`.

- **2026-08-08** — Removed the hardcoded "US Portfolio" placeholder as the
  default/fallback value for `Employee.currentProject`. It was never a real
  Project record — it's the org/portfolio name (correctly used elsewhere in
  the Navbar, Login screen, and Footer) — but was mistakenly reused as the
  default project assignment for every seed employee and for new employees
  in `EmployeeFormDialog`. This meant filtering People by an actual Project
  (e.g. one created via the Projects page) silently returned no results for
  anyone, since no employee record ever pointed at a real project. Fixed by:
  clearing `currentProject` to `""` on all 34 seed records in
  `src/data/employees.json`; adding a `normalizeEmployee()` self-healing
  migration in `EmployeeService.load()` (same pattern as
  `SettingsService.withSortedLists()` / `POCService.normalizePOC()`) so
  already-persisted localStorage records are fixed automatically, without
  requiring a storage reset; removing the `"US Portfolio"` default/fallback
  from `EmployeeFormDialog`'s `EMPTY_VALUES` and from the Current Project
  options list in both `EmployeeFormDialog.tsx` and `People.tsx` (now built
  purely from real `Project` records). Per user decision, existing employees
  are left with an unassigned (blank) Current Project until manually
  reassigned via Edit Employee — no bulk auto-assignment was performed.
- **2026-08-08** — Bug fix: the People page's "Projects" filter and the
  Add/Edit Employee form's "Current Project" field both built their options
  list as `["US Portfolio", ...projects.map(p => p.name)]` with no
  deduplication. Since `"US Portfolio"` is also the app's hardcoded default
  `currentProject` value, creating a real Project literally named
  "US Portfolio" produced a duplicate option with an identical value, which
  broke the dropdown (React duplicate-key warning, unreliable selection).
  Fixed in `src/pages/People.tsx` and
  `src/components/people/EmployeeFormDialog.tsx` by wrapping both lists in
  `[...new Set(...)]`. Swept the codebase for the same
  hardcoded-default-plus-spread pattern; no other occurrences found.
- **2026-08-08** — Calendar rework: moved Team Calendar to its own top-level
  `/calendar` page (out of a People tab); default view now merges everyone's
  blocked time; replaced the old "search-and-accumulate" picker with a
  `MultiSelectDropdown` (empty selection = everyone); added a rolling
  7-day week view (today-first, not Sunday-aligned) to both the Team and
  single-person calendars; renamed "Create Event" to "Block Calendar" with
  its own independent people-picker, decoupled from the page's view filter;
  hid the empty calendar grid behind an `EmptyState` when there are no events
  for the current filter (calendar instance stays mounted so navigation still
  works).
- **2026-08-08** — POC scheduling & calendar integration: added
  `team`/`startDate`/`endDate`/`startTime`/`hoursPerDay`/`blockGroupId` to
  `POC`; Owner restricted to senior roles, new Team field restricted to
  junior roles; adding/editing a POC now hard-blocks on calendar conflicts
  and auto-blocks the owner's + team's calendars (mirrored/cleaned up on
  edit/delete), modeled on the existing "Calendar Block for Task" pattern.
- **2026-08-08** — New Settings tab "Calendar Event Types"
  (`eventTypes`) — was previously a hardcoded list.
- **2026-08-07/08** — Settings-managed lists made durably alphabetical
  (self-healing on every read, including stale caches); Roles/Activity
  Types/Event Types tabs renamed for clarity ("AI Activity Categories",
  "Calendar Event Types"); Project's Technology field converted from a
  single hardcoded `<select>` to a Settings-driven multi-select; People's
  Role field wired to live Settings data (was a hardcoded constant).
- **Earlier** — initial build of Dashboard, Projects, Task Board, Activities,
  People, Skill Matrix, Learning, POCs, Reports, Settings, Role & Permission
  framework (see `FEATURES.md` for the original feature-ownership tracker).

---

*End of document. Update §23 (and the relevant feature section) whenever a
feature changes — do not let this drift from the actual code the way the
original `docs/` spec files have.*
