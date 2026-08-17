# Test Case Document — AI Portfolio Dashboard

| | |
|---|---|
| **Document version** | 1.0 |
| **Date** | 2026-08-17 |
| **Companion documents** | `FUNCTIONAL_SPECIFICATION_DOCUMENT.md` (FR-ID source), `PROJECT_DOCUMENTATION.md` |
| **Scope** | Every module, cross-module data flow, RBAC, and known security gap |

---

## 1. Test Strategy

### 1.1 Test levels covered
| Level | What it checks |
|---|---|
| Smoke | The app boots, logs in, and every route is reachable — run first, always |
| Functional | Each module's CRUD, filters, and stated business rules (§3) |
| Negative / Validation | Bad input is rejected with the right message, not silently accepted |
| Cross-Functional / Integration | Data flows that cross module boundaries (§4) |
| RBAC / Permission | Each of the 10 roles sees and can do exactly what §6 of the FSD says (§5) |
| Security | The known, accepted auth gap — documented so it's tracked, not "discovered" later (§6) |

### 1.2 Test environment
- Local dev stack (`npm run dev`), local SQLite (`server/db/portfolio.sqlite3`).
- Start every functional pass from a known-clean seed: `npm run db:reset`.
- Exercise every role at least once: log in as each of the 10 seeded accounts (or use per-user Permission Overrides to simulate edge cases without creating new accounts).

### 1.3 Out of scope
Load/performance testing (current scale is ~30 users, low-hundreds of records — not a bottleneck yet), and automated browser testing setup (no test runner exists in the repo today; these are manual test cases).

### 1.4 Priority key
**P1** blocks release · **P2** should fix before release · **P3** nice to fix

---

## 2. Smoke Test Suite

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-SMK-01 | Fresh checkout boots cleanly | P1 | `npm install` → `npm run db:reset` → `npm run dev` | Client on :5173, server on :4000, no errors in either terminal |
| TC-SMK-02 | Login screen renders | P1 | Open the app while signed out | Login form shown, no console errors |
| TC-SMK-03 | Valid login succeeds | P1 | Log in with a seeded Super Admin account | Redirected to `/dashboard`; role badge shown in navbar |
| TC-SMK-04 | Invalid login rejected | P1 | Submit wrong password | "Invalid credentials" message; stays on `/login`; no session set |
| TC-SMK-05 | Sidebar matches role | P1 | Log in as each of the 10 roles in turn | Only modules that role has `view` on appear in the sidebar (§6 of FSD) |
| TC-SMK-06 | Session persists across refresh | P1 | Log in, refresh the browser tab | Still authenticated, no flash of the login screen |
| TC-SMK-07 | Logout clears session | P1 | Log out | Redirected to `/login`; refreshing does not restore the session |
| TC-SMK-08 | Direct URL to permitted module | P2 | Type a URL for a module the role can view | Module loads normally |
| TC-SMK-09 | Direct URL to forbidden module | P1 | Type a URL for a module the role cannot view | "Access Denied" page, not a crash or blank screen |
| TC-SMK-10 | Unknown route redirects | P3 | Navigate to a nonexistent path | Redirected to `/dashboard` |
| TC-SMK-11 | Every nav item loads without error | P1 | Click through every sidebar item as Super Admin | Each page renders its data with no console errors |

---

## 3. Functional Test Cases by Module

### 3.1 Authentication
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-AUTH-01 | Case-insensitive username | P2 | Log in with the username in a different case | Login succeeds |
| TC-AUTH-02 | Inactive user cannot log in | P1 | Attempt login with a user whose status is not Active | Login rejected |
| TC-AUTH-03 | Multiple simultaneous sessions | P2 | Log in as the same user in two different browsers | Both sessions remain active independently (FR-AUTH-03) |
| TC-AUTH-04 | Login is audited | P2 | Log in successfully | A `login` entry appears in Audit Log with correct username/timestamp |
| TC-AUTH-05 | Logout is audited | P3 | Log out | A `logout` entry appears in Audit Log |

### 3.2 Dashboard
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-DASH-01 | Portfolio-scope KPIs | P1 | Log in as Director | KPI row shows Employees / Active Projects / AI Adoption % / Hours Saved, portfolio-wide |
| TC-DASH-02 | Team-scope KPIs | P1 | Log in as Tech Lead | KPI row shows team-scoped variants only (own team's activities/learning/hours) |
| TC-DASH-03 | Personal-scope KPIs | P1 | Log in as Developer | KPI row shows only "My Activities / Hours Saved / Learning % / My POCs" |
| TC-DASH-04 | Quick actions respect create permission | P2 | Log in as Intern (no create on Projects/Activities/POCs per matrix) | "+ Project"/"+ POC" quick actions are hidden; only allowed ones show |
| TC-DASH-05 | Task widget hidden without Tasks view | P3 | Log in as a role without Tasks view (if any) | Task Board summary row is not rendered |
| TC-DASH-06 | Recent activities respects data scope | P2 | Log in as an own-data-scope role | Recent Activities list shows only that user's own entries |

### 3.3 Projects
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-PROJ-01 | Create a project (happy path) | P1 | Fill all required fields, at least one technology, at least one member, save | Project appears in the list with correct data |
| TC-PROJ-02 | Duplicate project name rejected | P1 | Create a project with a name identical (any case) to an existing one | Validation error: "A project with this name already exists." |
| TC-PROJ-03 | End date before start date rejected | P1 | Set End Date earlier than Start Date | Validation error: "End Date must be after Start Date." |
| TC-PROJ-04 | Technology requires ≥1 selection | P2 | Submit with zero technologies checked | Validation error: "Please select at least one technology." |
| TC-PROJ-05 | Members requires ≥1 selection | P2 | Submit with zero team members checked | Validation error: "Please assign at least one team member." |
| TC-PROJ-06 | AI Adoption Categories is optional | P2 | Save a project with zero categories checked | Saves successfully; project shows 0 categories |
| TC-PROJ-07 | Manager/Tech Lead/PM dropdowns are role-filtered | P2 | Open the Engineering Manager dropdown | Only employees with role = Engineering Manager appear (same for Tech Lead/Senior Tech Lead, Project Manager) |
| TC-PROJ-08 | Filter by Status/Stage/Technology | P2 | Apply each filter individually and combined | List updates correctly for each combination |
| TC-PROJ-09 | Delete blocked while referenced | P1 | Attempt to delete a project with a linked Activity or POC | Delete rejected, friendly error toast, project remains |
| TC-PROJ-10 | Delete succeeds when unreferenced | P2 | Delete a project with no Activities/POCs | Project removed from the list |
| TC-PROJ-11 | Edit scope: "own" restricted to manager of record | P1 | Log in as a role with `edit: own` scope on Projects, open a project where you are not the manager | Edit/Delete actions are disabled/hidden for that project |
| TC-PROJ-12 | View-only roles cannot see Edit/Delete | P1 | Log in as a view-only role (per matrix) | Add/Edit/Delete controls are absent everywhere on the page |

### 3.4 Task Board
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-TASK-01 | Drag a task across columns | P1 | Drag a card from To Do to In Progress | Status updates, `percentComplete` auto-set to that column's value |
| TC-TASK-02 | Completing a task stamps completedDate | P1 | Move a task into the Done column | `completedDate` set to today; moving it back out clears/keeps per business rule |
| TC-TASK-03 | Project-type task requires a project | P1 | Create a task with type = Project and no project selected | Validation error requiring a project |
| TC-TASK-04 | Due date before start date rejected | P2 | Set Due Date earlier than Start Date | Validation error |
| TC-TASK-05 | Quick Task minimal fields | P2 | Create via Quick Task with only the 6 required fields | Task created, lands in default "To Do" status at 0% |
| TC-TASK-06 | Grouped view sorts correctly | P3 | Switch grouping to Priority | Groups ordered Critical → High → Medium → Low |
| TC-TASK-07 | Saved view "My Tasks" | P2 | Select "My Tasks" as the current user | Shows only tasks where you are assignee OR reporter |
| TC-TASK-08 | Archived tasks hidden by default | P2 | Archive a task, leave "Show archived" unchecked | Task disappears from the board; re-appears when checkbox is checked |
| TC-TASK-09 | Comment permission gating | P2 | Log in as a role without `comment` action | Comment box is not shown/disabled on the task drawer |
| TC-TASK-10 | CSV export | P3 | Export the current filtered task list | Downloaded file matches the documented column set |

### 3.5 Activities
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-ACT-01 | Log an activity (happy path) | P1 | Fill all fields, save | Activity appears in the list |
| TC-ACT-02 | Future date rejected | P1 | Set Date to tomorrow | Validation error, date cannot be in the future |
| TC-ACT-03 | Hours Saved bounds | P2 | Enter a negative number, then >100 | Both rejected per the 0–100 constraint |
| TC-ACT-04 | Employee filter hidden for own-data roles | P2 | Log in as an own-data-scope role | Employee filter dropdown is not shown |
| TC-ACT-05 | Only reachable via Dashboard quick action or direct URL | P3 | Confirm no sidebar entry exists | Sidebar has no "Activities" item for any role |

### 3.6 People
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-PPL-01 | Create employee (happy path) | P1 | Fill all required fields including ≥1 skill, save | Employee appears in the list; a linked User login account is auto-created (TC-XF-13) |
| TC-PPL-02 | Duplicate email rejected | P1 | Create with an email already in use (any case) | Validation error: "This email already exists." |
| TC-PPL-03 | Name length bounds | P2 | Enter a 2-character name, then a 90-character name | Both rejected (3–80 char bounds) |
| TC-PPL-04 | Experience bounds | P2 | Enter -1, then 41 | Both rejected (0–40 bounds) |
| TC-PPL-05 | Skills requires ≥1 selection | P2 | Submit with zero skills | Validation error |
| TC-PPL-06 | Manager cycle prevention | P1 | Try to set an employee's manager to themselves, or to one of their own direct reports | That employee is excluded from the Reports-To dropdown entirely |
| TC-PPL-07 | Leader field independent of Manager | P2 | Set Leader to a different person than Manager | Both save independently; no cross-validation between them |
| TC-PPL-08 | Business Unit / Tech-Non-Tech optional-vs-required | P2 | Save with Business Unit blank, Tech/Non-Tech unset | Business Unit saves as blank; Tech/Non-Tech is required — verify actual required/optional behavior matches the form |
| TC-PPL-09 | Project assignments are read-only here | P2 | Open an existing employee's edit form | Project list shown read-only with a note to edit from the Projects page |
| TC-PPL-10 | Offboarding sets Ex-Employee, not delete | P1 | Offboard an employee | Status becomes Ex-Employee; record still exists; direct reports reassigned (TC-XF-14) |
| TC-PPL-11 | Field-level security hides restricted fields | P2 | Log in as a role with `experience` marked read-only | Experience field is visible but disabled, not editable |

### 3.7 Skill Matrix
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-SKL-01 | Filter by skill | P2 | Select a skill from the filter | Only employees with that skill shown |
| TC-SKL-02 | Search across name/role/skills | P3 | Search a partial skill name | Matching employees shown |
| TC-SKL-03 | Own-data scope shows only self | P2 | Log in as an own-data-scope role | Only your own row is visible, no search/filter for others |
| TC-SKL-04 | Export gated by permission | P3 | Log in as a role without export | Export button absent |

### 3.8 AI Adoption
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-AI-01 | KPI tiles are accurate | P1 | Compare Total Projects / Projects Using AI / Categories Tracked / Top Category against the actual project data | Numbers match a manual count |
| TC-AI-02 | Category table matches project data | P1 | Cross-check each category's project count and % against project records | Matches exactly |
| TC-AI-03 | Selecting a category shows correct drill-down | P1 | Pick a category with 2+ projects | Both the project list and the people (avatar group) are correct and de-duplicated |
| TC-AI-04 | Category with zero projects | P2 | Pick a newly-added category no project uses yet | Shows "No projects use this category yet" |
| TC-AI-05 | Live update after project edit | P1 | Toggle a category on a project, revisit `/ai-adoption` | Counts update immediately, no stale cache |
| TC-AI-06 | Own-data scope restricts to own projects | P2 | Log in as an own-data-scope role | KPIs/table reflect only projects that role is a member of |
| TC-AI-07 | New category shows up immediately | P2 | Add a category in Settings, open Project form | New category appears as a checkbox option with zero code change needed |
| TC-AI-08 | Learning data never leaks in | P1 | Confirm the page's data source | No Learning records or fields appear anywhere on this page (FR-AI-10) |
| TC-AI-09 | Export CSV matches on-screen table | P3 | Export, open the file | Category/Projects/% columns match what's displayed |

### 3.9 Learning
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-LRN-01 | Create a learning record (happy path) | P1 | Fill required fields, save | Record appears in the list |
| TC-LRN-02 | Completion Date required only when Completed | P1 | Set Status to Completed with no Completion Date | Validation error; setting to In Progress removes the requirement |
| TC-LRN-03 | Completion Date cannot be future | P2 | Set a future Completion Date on a Completed record | Validation error |
| TC-LRN-04 | Completed status forces progress to 100 | P2 | Set Status = Completed with Progress at, say, 60 | Saved value is forced to 100 |
| TC-LRN-05 | Program Coordinator / Minutes Completed optional | P2 | Save a manual record leaving both blank | Saves fine; hours stays independently editable |
| TC-LRN-06 | Import: happy path | P1 | Upload a well-formed `.xlsx` with valid emails, Course, Status | Preview shows all rows as "Ready"; Import creates records matching preview |
| TC-LRN-07 | Import: unmatched email | P1 | Include a row with an email not in the system | Row flagged "No match"; excluded from import; others still import |
| TC-LRN-08 | Import: missing Course | P1 | Omit the Course column value for one row | Row flagged "Invalid — Missing course" |
| TC-LRN-09 | Import: unrecognized Status | P2 | Put a typo'd status value | Row flagged invalid with the exact bad value shown |
| TC-LRN-10 | Import: missing Platform defaults to Other | P2 | Omit the Platform column entirely | Rows import successfully with Platform = "Other" |
| TC-LRN-11 | Import: minutes → hours conversion | P2 | Row with Minutes Completed = 120 | Imported record shows Hours = 2 |
| TC-LRN-12 | Import: employee backfill only when blank | P1 | Import a row with Leader/BU for an employee that already has a Leader set | That employee's existing Leader is **not** overwritten; only genuinely-blank fields get filled |
| TC-LRN-13 | Import: CSV format also works | P2 | Upload the same data as `.csv` instead of `.xlsx` | Identical result to the `.xlsx` case |
| TC-LRN-14 | Import: header row not on row 1 | P3 | Upload a file with a title row above the real header | Confirm current behavior (documented as row-1-only after the last fix) — file should be corrected before import, or flag clearly if it fails |
| TC-LRN-15 | Import: real duplicate emails in sheet | P2 | Two rows with the same employee email, different courses | Both import as separate Learning records for that employee |
| TC-LRN-16 | Leaderboard hidden for own-data roles | P2 | Log in as an own-data-scope role | No leaderboard section rendered |

### 3.10 POCs
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-POC-01 | Create a POC (happy path) | P1 | Fill required fields, schedule dates/time, save | POC created; owner+team calendars auto-blocked (TC-XF-07) |
| TC-POC-02 | Create restricted above Senior Developer | P1 | Log in as Senior Developer or Developer | "+ POC" button is absent |
| TC-POC-03 | Intern is view-only | P1 | Log in as Intern, open a POC you own/are on | Edit/Delete controls absent |
| TC-POC-04 | Owner must be a senior role | P2 | Open the Owner dropdown | Only senior-role employees are selectable |
| TC-POC-05 | Team must be junior roles | P2 | Open the Team multi-select | Only junior-role employees are selectable |
| TC-POC-06 | Schedule change refreshes calendar blocks | P1 | Edit an existing POC's date range | Old blocks removed, new ones created for the updated range |

### 3.11 Reports
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-RPT-01 | Generate each report type | P1 | Select each of the 10 report types in turn, Generate | Each renders 4 KPI tiles + a populated table with no errors |
| TC-RPT-02 | Skill Summary accuracy | P1 | Cross-check per-skill headcount/coverage % against People data | Matches a manual count |
| TC-RPT-03 | Date range filter | P2 | Apply Last 7/30/90 days to a date-sensitive report | Row counts change appropriately |
| TC-RPT-04 | Project filter | P2 | Filter Project Summary/AI Activities by one project | Only that project's data shown |
| TC-RPT-05 | Empty result set | P2 | Generate a report with filters that match nothing | "No Data" empty state, not a crash |
| TC-RPT-06 | CSV export | P2 | Export any generated report | File downloads with correct headers/rows |
| TC-RPT-07 | Excel/PDF export placeholders | P3 | Click Excel or PDF export | Info toast: "planned for a future release"; no file downloaded |
| TC-RPT-08 | Own-data scope restricts report contents | P1 | Log in as an own-data-scope role, generate Team Performance | Only your own row/data appears |

### 3.12 Settings
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-SET-01 | Add a list item | P1 | Add a new AI Adoption Category | Appears alphabetized in the list; immediately selectable on the Project form |
| TC-SET-02 | Rename a list item | P2 | Rename an existing skill | All existing records referencing the old value are **not** auto-migrated — verify actual behavior (may show stale references) |
| TC-SET-03 | Delete a list item in use | P2 | Delete a skill currently assigned to an employee | Confirm actual behavior: does it warn, or silently orphan the reference? |
| TC-SET-04 | Read-only for non-edit roles | P1 | Log in as a view-only-on-Settings role | Inputs disabled, "Read-only" badge shown |
| TC-SET-05 | Fixed enums are not editable | P2 | Attempt to edit Impact Levels or any statusValues.* list | No add/edit UI exists for these (per FSD §4.8) |

### 3.13 User Management
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-USR-01 | Create a user account | P1 | Fill username (unique), password, role, linked employee, save | Account created, can log in immediately |
| TC-USR-02 | Duplicate username rejected | P1 | Create with an existing username | Validation error |
| TC-USR-03 | Password optional on edit | P2 | Edit a user leaving password blank | Existing password unchanged |
| TC-USR-04 | Deactivating a user blocks login | P1 | Set status to Inactive, attempt login | Login rejected |
| TC-USR-05 | Only Super Admin/Director can access | P1 | Log in as any other role | `/users` is not in the sidebar and returns Access Denied by URL |

### 3.14 Roles & Permissions
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-ROL-01 | Cannot delete/rename a system role | P1 | Attempt to delete or rename any of the 10 roles | Action blocked/hidden |
| TC-ROL-02 | Toggling an action updates effective permission | P1 | Grant Developer `delete` on Learning, save, log in as a Developer | That Developer can now delete Learning records |
| TC-ROL-03 | Per-user override doesn't affect the role | P1 | Grant one Developer `create` on POCs via override, not the role | Other Developers still cannot create POCs |
| TC-ROL-04 | Override diff display | P2 | Open a user with an active override | "Additional Permissions Granted"/"Permissions Removed" chips shown correctly vs. their role default |
| TC-ROL-05 | Reverting an override checkbox removes it | P2 | Toggle an override back to the role's default value, save | Override entry for that action is removed, not just set equal |
| TC-ROL-06 | Field-level permission editor | P2 | Mark a field as not-visible for a role | That field disappears from that role's forms/detail views entirely |

### 3.15 Audit Log
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-AUD-01 | Every module's mutations are logged | P1 | Create, update, and delete a record in several different modules | One Audit Log entry per action, correct module/summary/actor |
| TC-AUD-02 | Read-only, no edit/delete UI | P2 | Open Audit Log | No create/edit/delete controls anywhere on the page |
| TC-AUD-03 | Restricted to Super Admin/Director | P1 | Log in as any other role | `/audit-log` not in sidebar, Access Denied by URL |

### 3.16 Calendar
| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-CAL-01 | Admin/manager can view anyone's calendar | P2 | Log in as Director, view a Developer's calendar | Allowed |
| TC-CAL-02 | Developer can only view own calendar | P1 | Log in as Developer, attempt to view someone else's | Blocked/not selectable |
| TC-CAL-03 | Intern cannot create events | P2 | Log in as Intern | No "create event" control available |
| TC-CAL-04 | Edit/delete restricted to creator (non-managers) | P1 | Log in as Senior Developer, try to edit an event created by someone else | Blocked |
| TC-CAL-05 | Auto-created blocks are visually distinct/linked | P3 | Open a "Calendar Block for Task" or "POC" event created by automation | Shows its link back to the source Task/POC/Project |

---

## 4. Cross-Functional / Integration Test Cases

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-XF-01 | Project team ↔ Employee.projects sync | P1 | Add a member to a project's team | That project's name appears on the employee's own profile; removing them removes it |
| TC-XF-02 | Team assignment auto-blocks calendar + creates task | P1 | Assign a new member to a project with a start/end date | A "Calendar Block for Task" event spanning the full range appears on their calendar, plus a linked To Do task |
| TC-XF-03 | Removing a member cleans up | P1 | Remove that member from the team | Their auto-created block and linked task are deleted |
| TC-XF-04 | Date range change refreshes all blocks | P2 | Change a project's start/end date with members still assigned | Every remaining member's block is deleted and recreated with the new dates |
| TC-XF-05 | No end date skips auto-blocking | P3 | Assign a member to a project with no End Date set | No calendar block/task is created (documented as skipped) |
| TC-XF-06 | Project delete guard | P1 | Attempt to delete a project referenced by an Activity or POC | Blocked with a friendly error |
| TC-XF-07 | Project rename propagates | P2 | Rename a project that has team members | Every affected employee's `projects` list shows the new name, not the old one |
| TC-XF-08 | POC scheduling mirrors Project's mechanism | P1 | Create/schedule a POC with owner + team | Owner's and team's calendars block for the schedule; a linked To Do task is created |
| TC-XF-09 | Task ↔ Calendar mirroring | P2 | Create a "Calendar Block for Task" event manually | A corresponding Standalone task is created; editing one side stays in sync per the documented mirror behavior |
| TC-XF-10 | Learning import → employee profile backfill | P1 | Import a sheet with Leader/BU values for an employee whose fields are currently blank | Those fields populate; re-importing the same sheet after they're already set does **not** change them |
| TC-XF-11 | AI Adoption dashboard reflects project edits live | P1 | Toggle categories on a project, revisit the AI Adoption page without reloading the whole app | Numbers reflect the change on next data fetch |
| TC-XF-12 | Employee profile AI Adoption rollup | P1 | Change the categories on a project an employee belongs to | Their Profile Drawer's AI Adoption badges update to match, with no duplicate categories across multiple projects |
| TC-XF-13 | New employee auto-creates a login | P1 | Create an employee via People | A matching User account exists with a generated username and default password |
| TC-XF-14 | Offboarding reassigns direct reports | P1 | Offboard a manager who has direct reports | Their reports' `managerId` is reassigned (to the offboarded person's own manager, or cleared) and their own login is deactivated |
| TC-XF-15 | Universal audit trail | P1 | Perform one mutation in every module in a single pass | Audit Log shows one correctly-labeled entry per action, in order |
| TC-XF-16 | Settings list changes propagate everywhere at once | P1 | Add a new Project Stage in Settings | Immediately appears as an option on the Project form's Stage dropdown and any Stage-based filters |
| TC-XF-17 | Skill Matrix and People stay consistent | P2 | Add a skill to an employee via People | That employee immediately appears when filtering Skill Matrix by that skill |
| TC-XF-18 | Reports reflect real-time underlying data | P2 | Add a new Learning record, then generate Learning Progress / Skill Summary | New record's contribution is reflected without any separate "refresh data" step |

---

## 5. RBAC / Permission Verification

Run this pass once per role against the matrix in `FUNCTIONAL_SPECIFICATION_DOCUMENT.md` §6. For each role:

| ID | Title | Priority | Steps | Expected Result |
|---|---|---|---|---|
| TC-RBAC-01 | Sidebar exactly matches view permissions | P1 | Log in as the role | Every module the matrix marks ❌ is absent from the sidebar; every ✅ module is present |
| TC-RBAC-02 | Direct-URL access matches view permissions | P1 | Manually navigate to every module's path | ❌ modules show Access Denied; ✅ modules load |
| TC-RBAC-03 | Create controls match create permission | P1 | Open every module the role can view | "Add/Create" buttons appear only where the matrix grants `create` |
| TC-RBAC-04 | Edit/Delete controls match edit/delete permission and scope | P1 | Attempt to edit/delete both your own and someone else's record | `all` scope: both allowed. `own` scope: only your own allowed, other rows' controls disabled/hidden |
| TC-RBAC-05 | Export controls match export permission | P2 | Open a module with export capability | Export button present only where granted |
| TC-RBAC-06 | Field-level visibility/editability | P2 | Open a form/detail view with a role that has field restrictions | Restricted fields are hidden (not visible) or shown-but-disabled (visible, not editable) exactly as configured |
| TC-RBAC-07 | Own-data scope never leaks other people's rows | P1 | On every `own`-scoped module | No amount of filtering/searching surfaces another employee's records |
| TC-RBAC-08 | Team scope (Tech Lead dashboard) | P2 | Log in as Tech Lead | Dashboard shows exactly the "team" definition (own team + projects where they're tech lead), not portfolio-wide, not personal-only |
| TC-RBAC-09 | Permission Override changes only the target user | P1 | Apply an override to one user, verify a second user with the same role | Second user's effective permissions are unaffected |

---

## 6. Security Test Cases — Known Gap

These document the **current, accepted-risk** state described in FSD §8.1. They
are expected to currently **pass in the "vulnerable" direction** — i.e. the
request currently succeeds when it should be rejected. Re-run this section
against `AUTHENTICATION_IMPLEMENTATION_PLAN.md` once auth hardening ships,
at which point the "Expected Result" column flips.

| ID | Title | Priority | Steps | Current (accepted-risk) Result |
|---|---|---|---|---|
| TC-SEC-01 | Unauthenticated direct API write | P1 (tracked, not a new bug) | With no browser session at all, `PUT /api/projects/:id` with a modified body, via curl/Postman | Request succeeds and the record is updated — no auth check exists on this endpoint today |
| TC-SEC-02 | Unauthenticated direct API read | P1 | `GET /api/employees` with no session/token | Full employee list returned, bypassing every view-scope rule |
| TC-SEC-03 | Spoofed actor on audit log | P2 | Send a mutating request with an arbitrary `X-Actor-Id` header value | The audit log records the spoofed id as the actor — it is never verified server-side |
| TC-SEC-04 | Plaintext password storage | P1 | Inspect the `users` table / a `GET /api/users` response | Passwords are stored and returned as plaintext, unhashed |
| TC-SEC-05 | Permission bypass via direct API | P1 | As a low-privilege role, call a `POST`/`DELETE` endpoint for a module that role has no create/delete permission on, directly against the API | Request succeeds — permission checks are frontend-only |

---

## 7. Traceability Note
Every `TC-*` case above maps to at least one `FR-*` requirement ID in
`FUNCTIONAL_SPECIFICATION_DOCUMENT.md` §5. When a functional requirement
changes, search this file for its module prefix (e.g. `TC-AI-` for AI
Adoption) and update the affected cases in the same change.
