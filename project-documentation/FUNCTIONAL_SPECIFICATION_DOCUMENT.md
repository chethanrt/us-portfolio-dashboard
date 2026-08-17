# Functional Specification Document — AI Portfolio Dashboard

| | |
|---|---|
| **Document version** | 1.0 |
| **Date** | 2026-08-17 |
| **Status** | Living document — update alongside `PROJECT_DOCUMENTATION.md` whenever a feature changes |
| **Prepared for** | US Portfolio engineering organization (~30 people) |
| **Companion documents** | `project-documentation/PROJECT_DOCUMENTATION.md` (as-built architecture reference), `DATABASE_MIGRATION_PLAN.md`, `AUTHENTICATION_IMPLEMENTATION_PLAN.md` |

> **Please review before forwarding.** This document is generated from the
> current codebase and conversation history. Verify section 8 (Known
> Limitations) in particular before sharing outside the engineering team —
> it documents a real, unresolved security gap.

---

## 1. Introduction

### 1.1 Purpose
This Functional Specification Document (FSD) describes what the AI Portfolio
Dashboard does: its modules, the actions each user role can take, the data it
captures, and the business rules that govern it. It is the functional
counterpart to `PROJECT_DOCUMENTATION.md`, which covers *how* the system is
built; this document covers *what* it does and for *whom*.

### 1.2 Scope
The AI Portfolio Dashboard is an internal tool for tracking AI adoption
across a US Portfolio engineering organization: who is using AI tools, on
which projects, how much time it saves, what is being learned, what proofs
of concept exist, how AI capability categories are adopted per project, and
how people's time is scheduled. It is explicitly **not** a replacement for
Jira, Azure DevOps, an ERP, an HRMS, or a CRM.

### 1.3 Intended audience
Engineering leads, delivery/project managers, and anyone evaluating or
extending the application's functionality.

### 1.4 Definitions and abbreviations

| Term | Meaning |
|---|---|
| FSD | Functional Specification Document (this document) |
| POC | Proof of Concept — an AI-driven innovation initiative |
| RBAC | Role-Based Access Control |
| Module | One functional area of the app (Projects, Learning, etc.), the unit permissions are granted against |
| Scope (data) | Row-level visibility rule: `all`, `team`, or `own` |
| CRUD | Create, Read, Update, Delete |
| FR | Functional Requirement (numbered, e.g. `FR-PROJ-03`) |

---

## 2. Overall Description

### 2.1 Product perspective
A single-page web application with a real backend: a React 19 + TypeScript
frontend (Vite) talking to a small Express API, backed by one shared SQLite
database — so every user sees the same data. It replaced an earlier
no-backend design (JSON files + browser `localStorage`) once the app needed
to be genuinely multi-user.

### 2.2 Product functions (module summary)

| Module | One-line function |
|---|---|
| Dashboard | Role-scoped overview: KPIs, charts, quick actions, task widgets |
| Projects | Portfolio project records: team, technology, stage, AI adoption |
| Task Board | Kanban/grouped task tracking, project-linked or standalone |
| Activities | Log of individual AI-assisted work sessions and hours saved |
| People | Employee directory and profiles, org hierarchy, skills |
| Skill Matrix | Read-only view of who has which skill, filterable |
| **AI Adoption** | Category-level AI adoption tracking across projects and teams |
| Learning | Course/certification tracking, with bulk spreadsheet import |
| POCs | Proof-of-concept tracking with owner/team scheduling |
| Reports | On-demand generated reports (Weekly/Monthly/Skill/Learning/Project/etc.) |
| Settings | Editable master-data lists that back dropdowns/checkboxes everywhere |
| User Management | Login accounts and role assignment |
| Roles & Permissions | Per-role action/scope/field permission editor, plus per-user overrides |
| Audit Log | Login/logout and every create/update/delete, portfolio-wide |
| Calendar | Per-person schedule; auto-populated by Project/POC/Task assignment |

### 2.3 User classes (roles)
Ten fixed, non-deletable roles, from broadest to narrowest access:
`Super Admin`, `Director`, `Delivery Manager`, `Engineering Manager`,
`Project Manager`, `Senior Tech Lead`, `Tech Lead`, `Senior Developer`,
`Developer`, `Intern`. Section 6 gives the full per-module permission matrix.
Every role's access can be further adjusted per individual user via
**Permission Overrides** (§5.13.3) without changing the role itself.

### 2.4 Operating environment

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Radix) |
| Forms/validation | React Hook Form + Zod |
| Tables/charts | TanStack Table, Recharts |
| Calendar UI | FullCalendar |
| Backend | Express (Node.js), one thin CRUD router per entity |
| Database | SQLite via `better-sqlite3`, WAL mode |
| Schema evolution | Numbered `.sql` files in `server/db/migrations/`, auto-applied on server start |

### 2.5 Assumptions and constraints
- Single deployment serves the whole portfolio team; no multi-tenant concept.
- Authentication is intentionally demo-grade for now (§8.1) — a scoped,
  deliberate deferral, not an oversight.
- All business logic and permission enforcement live in the frontend; the
  API itself performs no validation or auth check beyond the login endpoint
  (§8.1). This is safe only on a fully trusted network today.
- Seed/sample data (`src/data/*.json`) is read once to populate a fresh
  database and never read again at runtime.

---

## 3. System Architecture (functional view)

```
Pages → Feature components → Hooks (load data, expose CRUD) → Services
  (one class per entity, e.g. ProjectService) → Express API (/api/<entity>)
  → SQLite (server/db/portfolio.sqlite3)
```

Two cross-cutting layers wrap every page: the **permission framework**
(`usePermission()`, §6) decides what each role can see/do, and
**Settings-managed master-data lists** (§5.11) back nearly every dropdown
and checkbox group in the app, so new options (a skill, an AI Adoption
category, a project stage) never require a code change.

**Schema evolution**: `server/db/schema.sql` creates each table's baseline
shape only the first time it doesn't yet exist. Every structural change made
*after* a table exists — a new column, a new index — is a separate,
numbered file in `server/db/migrations/`, applied automatically and exactly
once per database on every server start. This is what let the People,
Learning, and Project schema changes in §5 ship without any manual
per-environment migration step.

---

## 4. Data Model

Every entity below is one row shape in SQLite and one TypeScript interface
in `src/types/index.ts`.

### 4.1 Employee
| Field | Type | Notes |
|---|---|---|
| id, name, email | string | email unique |
| role | enum (9 fixed titles) | domain title, not an auth role |
| experience | number | years |
| team | string | free text |
| skills | string[] | Settings-managed `skills` list |
| projects | string[] | project names; kept in sync with Project.members |
| status | Active / Inactive / Ex-Employee | never hard-deleted |
| managerId | employee id or null | direct manager (org hierarchy) |
| **leaderId** | employee id or null | skip-level leader |
| **businessUnit** | string | e.g. "TS-ADM" |
| **techNonTech** | "Tech" / "Non-Tech" | |

### 4.2 Project
| Field | Type | Notes |
|---|---|---|
| id, name, client, program | string | name must be unique |
| manager, techLead, projectManager | string (name) | each optional |
| technology | string[] | Settings-managed |
| stage | enum, 9 stages | incl. Planning |
| status | Active / On Hold / Completed | |
| aiAdoption | number 0–100 | overall adoption percentage |
| **aiAdoptionCategories** | string[] | which AI capability categories this project uses (§5.7) |
| members | employee id[] | drives Calendar/Task auto-blocking |
| startDate, endDate | date | |

### 4.3 Activity (AI usage log)
employeeId, projectId, date, tool (AITool enum), category, projectStage,
promptSummary, outcome, hoursSaved, impact (Low/Medium/High), attachment.

### 4.4 LearningRecord
| Field | Type | Notes |
|---|---|---|
| employeeId, course, platform, status | | platform/status are Settings-managed enums |
| progress | 0–100 | |
| hours | number | derived from minutesCompleted on import |
| certificate, completionDate | string | |
| **programCoordinator** | string | who runs the training program |
| **minutesCompleted** | number | raw minutes, as reported by source exports |

### 4.5 POC
title, ownerId, team (employee ids), projectId, category, description,
status, businessValue, hoursSaved, repo, demo, scheduling fields
(startDate/endDate/startTime/hoursPerDay/blockGroupId).

### 4.6 CalendarEvent
Modeled after a Microsoft Graph calendar event for future live-Outlook
compatibility: employeeId, title, eventType, start/end (ISO local),
attendees, `linkedTaskId`/`linkedPocId`/`linkedProjectId` (reciprocal links
for auto-created blocks), `blockGroupId`.

### 4.7 Task
See §5.3. Two ids (`id`, human-readable `taskNumber`), workflow status as a
plain string against a configurable pipeline, full comment/attachment
metadata, archive flag.

### 4.8 Settings-managed enumerations (`AppSettings`)
| Key | Backs |
|---|---|
| roles | Employee.role |
| technicalSkills | Project.technology |
| skills | Employee.skills |
| projectStages | Project.stage, Activity.projectStage |
| aiTools | Activity.tool |
| learningPlatforms | LearningRecord.platform |
| activityTypes | Activity.category |
| pocCategories | POC.category |
| **aiAdoptionCategories** | Project.aiAdoptionCategories (§5.7) |
| eventTypes | CalendarEvent.eventType |
| impactLevels, statusValues.* | fixed enums, not user-editable |

---

## 5. Functional Requirements by Module

### 5.1 Dashboard
Role-scoped landing page. Three scopes drive everything on it —
`portfolio` (managers and above), `team` (Tech Lead), `personal` (everyone
else) — derived from the Dashboard module's own view scope.

| ID | Requirement |
|---|---|
| FR-DASH-01 | Show a KPI row appropriate to the user's scope (portfolio: Employees/Active Projects/AI Adoption %/Hours Saved; team: Team Members/Team Activities/Learning avg/Hours Saved; personal: My Activities/Hours Saved/Learning %/My POCs). |
| FR-DASH-02 | Show quick-action buttons (+ Activity, + Project, + POC) only for roles with create permission on that module. |
| FR-DASH-03 | Show a Task Board summary (assigned/in-progress/due-today/overdue counts, 4 most-recent tasks) if the user can view Tasks. |
| FR-DASH-04 | Chart AI activity trend (weekly, ~90 days), project status breakdown, tool usage, and top-4 learning courses by enrollment. |
| FR-DASH-05 | List the 6 most recent activities, scoped to the user's data visibility. |

### 5.2 Projects
| ID | Requirement |
|---|---|
| FR-PROJ-01 | List projects as cards: name, client, status, AI Adoption %, stage, technology, manager/tech lead, team avatars. |
| FR-PROJ-02 | Filter by search text, Status, Stage, Technology. |
| FR-PROJ-03 | Create/edit a project: name (unique, required), client, program, technology (multi-select), stage, status, Engineering Manager / Tech Lead / Project Manager (each optional, role-filtered dropdowns), start/end date (end after start), AI Adoption % (slider), **AI Adoption Categories** (multi-select, §5.7), team members (multi-select). |
| FR-PROJ-04 | Block deletion while any Activity or POC still references the project. |
| FR-PROJ-05 | Keep `Employee.projects` in sync automatically whenever team membership changes (both directions). |
| FR-PROJ-06 | Auto-block each newly assigned member's calendar for the project's full date range and create a linked "To Do" task; clean up the block/task when a member is removed or the project is deleted. |
| FR-PROJ-07 | Edit access limited to Super Admin/Director/Delivery Manager/Engineering Manager/Senior Tech Lead/Tech Lead/Project Manager; all other roles are view-only. |

### 5.3 Task Board
| ID | Requirement |
|---|---|
| FR-TASK-01 | Provide a Kanban board (drag-and-drop across 6 workflow columns: Backlog → To Do → In Progress → Code Review → Testing → Done) and a Grouped (static) view by Project/Assignee/Category/Priority. |
| FR-TASK-02 | Auto-apply the target column's `percentComplete` on status change; stamp `completedDate` only when moving into a final-state column. |
| FR-TASK-03 | Support a full task editor (15 fields) and a 6-field Quick Task shortcut. |
| FR-TASK-04 | Toolbar: search, saved views (All/My Tasks/Project/Standalone/Overdue/Due Today/Completed/AI Tasks), combinable filters, CSV export. |
| FR-TASK-05 | Task details drawer: inline status change, edit/duplicate/archive/delete, linked Activity/POC cards, comments, attachments (metadata only), history. |
| FR-TASK-06 | "Own task" = assignee **or** reporter, for scope purposes. |

### 5.4 Activities (AI usage log)
Reachable only via the Dashboard's "+ Activity" button or a direct URL —
intentionally not in the sidebar.
| ID | Requirement |
|---|---|
| FR-ACT-01 | Log an AI-assisted work session: employee, project, date (not future), AI tool, category, project stage, prompt summary, outcome, hours saved, impact. |
| FR-ACT-02 | List/filter by date range, tool, project, employee (hidden for own-data roles), category. |

### 5.5 People
| ID | Requirement |
|---|---|
| FR-PPL-01 | List employees as cards with search + Role/Skills/Project filters. |
| FR-PPL-02 | Create/edit an employee: name, email (unique), role, experience, team, skills (multi-select), status, Reports To (manager, cycle-safe picker), **Leader** (skip-level, §4.1), **Business Unit**, **Tech/Non-Tech**. |
| FR-PPL-03 | Show each employee's current project assignments (read-only, derived from Project.members/manager/techLead/projectManager) with a role badge per project. |
| FR-PPL-04 | Show each employee's **AI Adoption** categories (read-only, computed) — the union of `aiAdoptionCategories` across every project they're assigned to (§5.7.3). Updates automatically whenever their project assignments or a project's categories change; nothing is stored on the Employee record itself. |
| FR-PPL-05 | Offboarding sets status to Ex-Employee (never a hard delete) and reassigns direct reports. |
| FR-PPL-06 | Profile Drawer's Access tab (admin-only) shows the linked login account and lets an admin grant/remove individual permission overrides on top of the employee's role (§6.4). |

### 5.6 Skill Matrix
Read-only, filterable list of `Employee.skills` — not a separate scored
proficiency matrix (that legacy design was removed as dead/unused).
| ID | Requirement |
|---|---|
| FR-SKL-01 | List employees with a Skills filter and search. |
| FR-SKL-02 | Export (permission-gated). |

### 5.7 AI Adoption — *new segment*
Tracks **which kinds** of AI capability are used on each project, distinct
from the Project's existing overall `aiAdoption` percentage.

#### 5.7.1 Category management
| ID | Requirement |
|---|---|
| FR-AI-01 | AI Adoption Categories are a Settings-managed, extensible list — editable the same way as every other master-data list (add/rename/remove), starting seeded with: Claude Code, AI Design, UI Generation, Code Generation, API Generation. |
| FR-AI-02 | Adding a new category (e.g. "AI Testing", "AI Documentation") requires no code change — it immediately becomes selectable on every project's form and appears on the AI Adoption dashboard. |

#### 5.7.2 Project-level tracking
| ID | Requirement |
|---|---|
| FR-AI-03 | Each project's Add/Edit form includes an "AI Adoption Categories" multi-select checkbox group, sourced live from the Settings list. |
| FR-AI-04 | A project may have zero, one, or many categories selected. |

#### 5.7.3 AI Adoption dashboard (`/ai-adoption`)
| ID | Requirement |
|---|---|
| FR-AI-05 | Show portfolio KPIs: Total Projects, Projects Using AI (≥1 category), Categories Tracked, Top Category. |
| FR-AI-06 | Show a table of every tracked category with its project count and % of total projects. |
| FR-AI-07 | Let the user pick one category and see the specific projects using it and the people on those projects (avatar group). |
| FR-AI-08 | All counts are computed live from current Project data — no caching, no manual refresh step; editing a project's categories is reflected immediately on revisiting the page. |
| FR-AI-09 | Own-data-scope roles see only their own projects' contribution to the aggregates (mirrors the Reports module's scoping pattern). |
| FR-AI-10 | Explicitly out of scope: individual AI learning/training records (Learning module, §5.8) never feed into this segment — it is project-adoption only. |

### 5.8 Learning
| ID | Requirement |
|---|---|
| FR-LRN-01 | Track a course/certification per employee: course, platform, status, completion %, hours, certificate, completion date, **Program Coordinator**, **Minutes Completed** (§4.4). |
| FR-LRN-02 | Show portfolio (or personal, for own-data roles) KPIs: overall completion, courses completed, in progress, hours learned; show a top-5 leaderboard (hidden for own-data roles). |
| FR-LRN-03 | **Bulk import** learning records from an uploaded `.xlsx`/`.xls`/`.csv` file: match each row to an existing employee by email (case-insensitive), parse Course/Platform/Status/% Completion/Minutes Completed/Program Coordinator per row. |
| FR-LRN-04 | Import preview shows each row's match/validation result (Ready / No email match / Invalid) before committing; unmatched or invalid rows are excluded, never silently guessed. |
| FR-LRN-05 | Import may also backfill an employee's Leader/Business Unit from sheet columns (Direct Manager, Leader, BU, Tech/Non-Tech) **only when that field is currently blank** on the employee — it never overwrites existing profile data. |

### 5.9 POCs
| ID | Requirement |
|---|---|
| FR-POC-01 | Track a proof of concept: title, owner (senior role), team (junior roles), project, category, description, status, business value, hours saved, repo/demo links, and a schedule (start/end date, start time, hours/day). |
| FR-POC-02 | Creating/scheduling a POC auto-blocks the owner's and team's calendars and creates a linked "To Do" task, kept in sync with schedule changes. |
| FR-POC-03 | POC creation is restricted to Tech Lead and above; Senior Developer/Developer keep view/edit/delete on their own POCs but not create; Intern is view-only. |

### 5.10 Reports
On-demand generated reports — pick a type, optional date range/project
filter, Generate.
| ID | Requirement |
|---|---|
| FR-RPT-01 | Support report types: Weekly Summary, Monthly Summary, Project Summary, **Skill Summary**, AI Activities, Learning Progress, POCs, Team Performance, Task Workload, Tasks by Project. |
| FR-RPT-02 | **Skill Summary** (new): per-skill headcount and % team coverage, derived from `Employee.skills` — no new data source required. |
| FR-RPT-03 | Every report shows 4 summary KPI tiles plus a sortable, paginated results table. |
| FR-RPT-04 | Export the current report as CSV (Excel/PDF are placeholders, explicitly future work). |
| FR-RPT-05 | Own-data-scope roles generate reports restricted to their own records only. |

### 5.11 Settings
| ID | Requirement |
|---|---|
| FR-SET-01 | Provide one tabbed editor per master-data list (Roles, Technical Skills, AI Skills, Skills, AI Tools, Project Stages, AI Activity Categories, POC Categories, **AI Adoption Categories**, Learning Platforms, Calendar Event Types): add, rename, delete, alphabetized automatically on save. |
| FR-SET-02 | Read-only for any role without Settings edit permission (shown with a "Read-only" badge). |

### 5.12 User Management
Login accounts (username, password, role, linked employee, status) —
full CRUD, Super Admin/Director only.

### 5.13 Roles & Permissions
| ID | Requirement |
|---|---|
| FR-ROL-01 | 10 fixed roles; permissions editable per role: per-module action grants (view/create/edit/delete/export/assign/comment), row scope (all/team/own), and field-level visible/editable overrides. |
| FR-ROL-02 | **Per-user permission overrides** (§4.1/FR-PPL-06): grant or remove individual actions for one user without touching their role, shown as "Additional Permissions Granted"/"Permissions Removed" diffs against the role default. |
| FR-ROL-03 | Roles cannot be deleted or renamed (`isSystem: true`), but their permissions remain fully editable. |

### 5.14 Audit Log
Read-only, admin-visible (Super Admin/Director) append-only trail of every
login/logout and create/update/delete across every module, with actor,
timestamp, module, record, and a human-readable summary.

### 5.15 Calendar
Per-person schedule, populated both manually and automatically (Project
team assignment, POC scheduling, and a Task's due-date block all create
linked events). Bespoke, role-keyed visibility rules (not the standard
module-permission framework) govern who can view/create/edit/delete whose
events (§6.5).

### 5.16 Authentication (see §8.1 for the security caveat)
| ID | Requirement |
|---|---|
| FR-AUTH-01 | Log in with username/password; on success the session is remembered in the browser until logout. |
| FR-AUTH-02 | Unauthenticated users are redirected to `/login`; unauthorized routes render an Access Denied page. |
| FR-AUTH-03 | Multiple simultaneous sessions across different browsers/devices are supported by default (no single-session restriction). |

---

## 6. Roles & Permissions Matrix

| Module | super-admin / director | delivery-mgr / eng-mgr / project-mgr | senior-tech-lead | tech-lead | senior-developer / developer | intern |
|---|---|---|---|---|---|---|
| Dashboard | view (all) | view (all) | view (all) | view (**team**) | view (own) | view (own) |
| Projects | full CRUD (all) | full CRUD (all) | full CRUD (all) | full CRUD (all) | view only | view only |
| Tasks | full CRUD+assign+comment (all) | same | same | full CRUD+assign+comment (all) | CRUD+comment (own) | edit+comment (own) |
| Activities | full CRUD (all) | same | same | create/edit/delete (all) | CRUD (own) | CRUD (own) |
| People | full CRUD (all) | same | same | view (all) / edit own | view+edit (own) | view+edit (own) |
| Skill Matrix | view+export (all) | same | same | view+export (all) | view+export (own) | view+export (own) |
| **AI Adoption** | view+export (all) | same | same | view+export (all) | view+export (own) | view+export (own) |
| Learning | full CRUD (all) | same | same | CRUD, no delete (all) | CRUD (own) | CRUD (own) |
| POCs | full CRUD (all) | same | same | CRUD (view all/edit own) | view+edit+delete, no create (own) | view only (own) |
| Reports | view+export (all) | same | same | view+export (all) | view+export (own) | view+export (own) |
| Settings | view+edit | view only (delivery-mgr); view only (eng-mgr/project-mgr) | ❌ | ❌ | ❌ | ❌ |
| Users / Roles | full CRUD (super-admin/director only) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Log | view only | ❌ | ❌ | ❌ | ❌ | ❌ |

Field-level visibility/editability can further restrict individual fields
per role (e.g. `experience` is read-only for own-profile edits); see
`src/data/permissions.json` for the authoritative, complete matrix.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Pages are lazy-loaded per route; report/dashboard aggregation runs client-side over already-fetched data (no server-side pagination yet — acceptable at current ~30-person, low-hundreds-of-records scale). |
| Usability | Every list view supports search plus 2–4 targeted filters; every form is field-permission-aware so a role only ever sees fields it's allowed to see. |
| Compatibility | Modern evergreen browsers (Chromium/Firefox/Safari); no IE/legacy support. |
| Maintainability | New dropdown/checkbox options (skills, AI Adoption categories, stages, etc.) are data, not code — added via Settings, no deploy required. |
| Data integrity | Foreign-key-shaped deletes are guarded (e.g. a Project can't be deleted while referenced by an Activity/POC); employees are never hard-deleted. |
| **Security** | See §8.1 — a known, explicit gap, not yet closed. |

---

## 8. Known Limitations and Open Items

### 8.1 Authentication and API security — real, open gap
Authentication is demo-grade: passwords are stored in plaintext, and the
Express API performs **no authentication check on any endpoint** except the
login endpoint itself. Every permission/field-visibility rule in §6 is
enforced only by the frontend. In practice: anyone who can reach the API's
port on the network can read or write any data directly (e.g. `PUT
/api/projects/:id`), bypassing every permission rule and the UI entirely,
with no login required. This is a deliberate, scoped-out decision (see
`AUTHENTICATION_IMPLEMENTATION_PLAN.md`), not an oversight — but it means
this application should not be relied on with sensitive data on a network
reachable by more than a fully trusted audience until it's closed.

### 8.2 Other known gaps
- Excel and PDF report export are UI placeholders only (CSV works today).
- Task attachments show metadata only — no file upload capability exists.
- No server-side pagination — all list/report data loads in full per page.
- The Project's overall `aiAdoption` percentage (§4.2) and the new
  category-based `aiAdoptionCategories` (§5.7) are edited independently;
  nothing keeps them consistent with each other automatically.

---

## 9. Future Extensibility

The application is deliberately built so most "add a new X" requests are
data changes, not code changes:
- **New master-data options** (a skill, an AI Adoption category, a project
  stage, a learning platform): add via Settings, live everywhere
  immediately.
- **New AI Adoption categories** beyond the initial 5 (e.g. AI Testing, AI
  Documentation, AI Data Analysis, AI Debugging, AI Research, AI
  Automation): same mechanism, zero code change (FR-AI-02).
- **New report types**: follow the existing `reportDefinitions.ts` pattern
  (a pure function over already-loaded data sources) — the Skill Summary
  report added in this cycle took a single new function.
- **Schema changes**: add a numbered file to `server/db/migrations/`; it
  applies automatically everywhere on next server start, no manual
  per-environment step (§3).

---

## 10. Appendix

### 10.1 Document references
- `project-documentation/PROJECT_DOCUMENTATION.md` — full architectural
  as-built reference, including every service, hook, and component involved
  in each module above.
- `project-documentation/DATABASE_MIGRATION_PLAN.md` — why/how the SQLite
  backend and schema-migration system exist.
- `project-documentation/AUTHENTICATION_IMPLEMENTATION_PLAN.md` — the
  planned fix for §8.1.

### 10.2 Change history
| Date | Change |
|---|---|
| 2026-08-17 | Learning import, Skill Summary report, AI Adoption segment, Employee org fields (Leader/Business Unit/Tech-Non-Tech) added. Schema-migration system (`server/db/migrations/`) restored and adopted for all schema changes. |
