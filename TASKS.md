# TASKS.md

# AI Portfolio Dashboard Development Tasks

Version 1.0

---

# Instructions for Claude

Before starting any task:

- Read CLAUDE.md
- Read README.md
- Read all files under docs/
- Review existing code
- Reuse existing components
- Do not modify completed features unless required
- Complete only ONE task at a time
- Stop after completing the current task

---

# Phase 1 - Project Setup

## Project Initialization

- [x] T001 - Create React + TypeScript + Vite project
- [x] T002 - Install required npm packages
- [x] T003 - Configure Tailwind CSS
- [x] T004 - Install and configure shadcn/ui
- [x] T005 - Configure React Router
- [ ] T006 - Configure ESLint & Prettier
- [x] T007 - Create project folder structure
- [x] T008 - Create application theme
- [x] T009 - Verify application builds successfully

---

# Phase 2 - Core Layout

- [x] T010 - Build Sidebar component
- [x] T011 - Build Top Navigation component
- [x] T012 - Build Main Layout component
- [x] T013 - Configure page routing
- [x] T014 - Create placeholder pages
- [x] T015 - Make layout responsive

---

# Phase 3 - Shared Components

- [x] T016 - Create PageHeader component
- [x] T017 - Create KPI Card component
- [x] T018 - Create Search Bar component
- [x] T019 - Create Filter Bar component
- [x] T020 - Create Status Badge component
- [x] T021 - Create Progress Bar component
- [x] T022 - Create Empty State component
- [x] T023 - Create Loading Skeleton component
- [x] T024 - Create Confirmation Dialog
- [x] T025 - Create Reusable Modal
- [x] T026 - Create Drawer Component
- [x] T027 - Create Chart Card component

---

# Phase 4 - Data Layer

- [x] T028 - Create TypeScript interfaces
- [x] T029 - Create employees.json
- [x] T030 - Create projects.json
- [x] T031 - Create activities.json
- [x] T032 - Create learning.json
- [x] T033 - Create pocs.json
- [x] T034 - Create settings.json (+ skills.json per docs/02)
- [x] T035 - Create EmployeeService
- [x] T036 - Create ProjectService
- [x] T037 - Create ActivityService
- [x] T038 - Create LearningService
- [x] T039 - Create POCService
- [x] T040 - Create SettingsService (+ SkillService)

---

# Phase 5 - Dashboard

- [x] T041 - Create Dashboard page layout
- [x] T042 - Build KPI Cards
- [x] T043 - Build AI Adoption chart
- [x] T044 - Build Project Status chart
- [x] T045 - Build AI Tool Usage chart
- [x] T046 - Build Learning Progress widget
- [x] T047 - Build Top Contributors widget
- [x] T048 - Build Recent Activities widget
- [x] T049 - Connect dashboard to JSON data
- [x] T050 - Make dashboard responsive

---

# Phase 6 - Projects

- [x] T051 - Create Projects page
- [x] T052 - Build Project Cards
- [x] T053 - Build Project Search
- [x] T054 - Build Filters
- [x] T055 - Build Project Details Drawer
- [x] T056 - Connect Projects to JSON
- [x] T057 - Make Projects responsive
- [x] T057a - Build Add/Edit Project Dialog (added)
- [x] T057b - Build Project Delete Confirmation (added)
- [x] T057c - Role-based project access: DM/Super Admin any, EM own projects (added)

---

# Phase 7 - AI Activities

- [x] T058 - Create Activities page
- [x] T059 - Build Activities Table
- [x] T060 - Build Search
- [x] T061 - Build Filters
- [x] T062 - Build Add Activity Dialog
- [x] T063 - Build Edit Activity Dialog
- [x] T064 - Build Delete Confirmation
- [x] T065 - Connect Activities to JSON
- [x] T066 - Make Activities responsive

---

# Phase 8 - People

- [x] T067 - Create People page
- [x] T068 - Build Employee Cards
- [x] T069 - Build Employee Profile
- [x] T070 - Build Statistics Cards
- [x] T071 - Connect Employees JSON
- [x] T072 - Make People page responsive (+ Employee CRUD: add/edit/delete)

---

# Phase 9 - Skill Matrix

- [x] T073 - Create Skill Matrix page
- [x] T074 - Build Skill Table
- [x] T075 - Add Skill Filters
- [x] T076 - Add Color Coding
- [x] T077 - Connect Skill Data
- [x] T078 - Make Skill Matrix responsive

---

# Phase 10 - Learning

- [x] T079 - Create Learning page
- [x] T080 - Build Learning Cards
- [x] T081 - Build Progress Widgets
- [x] T082 - Add Filters
- [x] T083 - Connect Learning JSON
- [x] T084 - Make Learning page responsive (+ Learning CRUD: add/edit/delete)

---

# Phase 11 - POCs

- [x] T085 - Create POCs page
- [x] T086 - Build POC Cards
- [x] T087 - Build POC Details
- [x] T088 - Add Filters
- [x] T089 - Connect POC JSON
- [x] T090 - Make POC page responsive (+ POC CRUD: add/edit/delete)

---

# Phase 12 - Reports

- [x] T091 - Create Reports page
- [x] T092 - Build Report Filters
- [x] T093 - Build Summary Cards
- [x] T094 - Build Export Buttons (CSV functional; Excel/PDF UI only)
- [x] T095 - Make Reports responsive

---

# Phase 13 - Settings

- [x] T096 - Create Settings page
- [x] T097 - Build Settings Sections
- [x] T098 - Build Settings Tables
- [x] T099 - Connect Settings JSON
- [x] T100 - Make Settings responsive (+ Settings CRUD, Director-only editing)

---

# Phase 14 - Role Based Dashboards

- [x] T101 - Create Role Context
- [x] T102 - Create Mock Login
- [x] T103 - Implement Role Switching
- [x] T104 - Show Role-specific Dashboard
- [x] T105 - Configure Sidebar Permissions
- [x] T106 - Restrict Actions by Role
- [x] T106a - Own-data visibility: roles below Tech Lead see only their own records across Activities, Learning, POCs, People, Skill Matrix and Reports (added)
- [x] T106b - Elevated access: Director = Super Admin; DM/EM/STL full access except Settings editing and User Management (added)

---

# Phase 14b - Authentication (added by request)

- [x] T117 - Create users.json (accounts for all employees + Super Admin)
- [x] T118 - Create UserService (authenticate + CRUD, Local Storage)
- [x] T119 - Build Login page (username/password, validation, demo accounts)
- [x] T120 - Guard routes; redirect to /login when signed out
- [x] T121 - Working logout (navbar + sidebar)
- [x] T122 - Super Admin role with full access
- [x] T123 - User Management page (create users, set/reset passwords, delete)

---

# Phase 15 - Polish

- [ ] T107 - Add Toast Notifications
- [ ] T108 - Improve Loading States
- [ ] T109 - Improve Empty States
- [ ] T110 - Improve Accessibility
- [ ] T111 - Improve Responsive Design
- [ ] T112 - Optimize Performance
- [ ] T113 - Refactor Components
- [ ] T114 - Final UI Review
- [ ] T115 - Verify All Modules
- [ ] T116 - Production Readiness Review

---

# Definition of Done

A task is complete only if:

- UI matches wireframe
- Uses reusable components
- Responsive
- TypeScript compliant
- No console errors
- Uses JSON services
- Has loading state
- Has empty state
- Follows CLAUDE.md
- No duplicated code

---

# After Every Task

Claude should provide:

## Completed Task

Example

✔ Completed T041 - Dashboard Layout

## Files Created

- src/pages/Dashboard.tsx
- src/components/dashboard/KPICard.tsx

## Files Modified

- App.tsx
- routes.tsx

## Summary

Brief explanation of what was implemented.

## Suggested Next Task

Example

T042 - Build KPI Cards

Then STOP and wait for approval.
# TASKS.md

# AI Portfolio Dashboard Development Tasks

Version 1.0

---

# Instructions for Claude

Before starting any task:

- Read CLAUDE.md
- Read README.md
- Read all files under docs/
- Review existing code
- Reuse existing components
- Do not modify completed features unless required
- Complete only ONE task at a time
- Stop after completing the current task

---

# Phase 1 - Project Setup

## Project Initialization

- [x] T001 - Create React + TypeScript + Vite project
- [x] T002 - Install required npm packages
- [x] T003 - Configure Tailwind CSS
- [x] T004 - Install and configure shadcn/ui
- [x] T005 - Configure React Router
- [ ] T006 - Configure ESLint & Prettier
- [x] T007 - Create project folder structure
- [x] T008 - Create application theme
- [x] T009 - Verify application builds successfully

---

# Phase 2 - Core Layout

- [x] T010 - Build Sidebar component
- [x] T011 - Build Top Navigation component
- [x] T012 - Build Main Layout component
- [x] T013 - Configure page routing
- [x] T014 - Create placeholder pages
- [x] T015 - Make layout responsive

---

# Phase 3 - Shared Components

- [x] T016 - Create PageHeader component
- [x] T017 - Create KPI Card component
- [x] T018 - Create Search Bar component
- [x] T019 - Create Filter Bar component
- [x] T020 - Create Status Badge component
- [x] T021 - Create Progress Bar component
- [x] T022 - Create Empty State component
- [x] T023 - Create Loading Skeleton component
- [x] T024 - Create Confirmation Dialog
- [x] T025 - Create Reusable Modal
- [x] T026 - Create Drawer Component
- [x] T027 - Create Chart Card component

---

# Phase 4 - Data Layer

- [x] T028 - Create TypeScript interfaces
- [x] T029 - Create employees.json
- [x] T030 - Create projects.json
- [x] T031 - Create activities.json
- [x] T032 - Create learning.json
- [x] T033 - Create pocs.json
- [x] T034 - Create settings.json (+ skills.json per docs/02)
- [x] T035 - Create EmployeeService
- [x] T036 - Create ProjectService
- [x] T037 - Create ActivityService
- [x] T038 - Create LearningService
- [x] T039 - Create POCService
- [x] T040 - Create SettingsService (+ SkillService)

---

# Phase 5 - Dashboard

- [x] T041 - Create Dashboard page layout
- [x] T042 - Build KPI Cards
- [x] T043 - Build AI Adoption chart
- [x] T044 - Build Project Status chart
- [x] T045 - Build AI Tool Usage chart
- [x] T046 - Build Learning Progress widget
- [x] T047 - Build Top Contributors widget
- [x] T048 - Build Recent Activities widget
- [x] T049 - Connect dashboard to JSON data
- [x] T050 - Make dashboard responsive

---

# Phase 6 - Projects

- [x] T051 - Create Projects page
- [x] T052 - Build Project Cards
- [x] T053 - Build Project Search
- [x] T054 - Build Filters
- [x] T055 - Build Project Details Drawer
- [x] T056 - Connect Projects to JSON
- [x] T057 - Make Projects responsive
- [x] T057a - Build Add/Edit Project Dialog (added)
- [x] T057b - Build Project Delete Confirmation (added)
- [x] T057c - Role-based project access: DM/Super Admin any, EM own projects (added)

---

# Phase 7 - AI Activities

- [x] T058 - Create Activities page
- [x] T059 - Build Activities Table
- [x] T060 - Build Search
- [x] T061 - Build Filters
- [x] T062 - Build Add Activity Dialog
- [x] T063 - Build Edit Activity Dialog
- [x] T064 - Build Delete Confirmation
- [x] T065 - Connect Activities to JSON
- [x] T066 - Make Activities responsive

---

# Phase 8 - People

- [x] T067 - Create People page
- [x] T068 - Build Employee Cards
- [x] T069 - Build Employee Profile
- [x] T070 - Build Statistics Cards
- [x] T071 - Connect Employees JSON
- [x] T072 - Make People page responsive (+ Employee CRUD: add/edit/delete)

---

# Phase 9 - Skill Matrix

- [x] T073 - Create Skill Matrix page
- [x] T074 - Build Skill Table
- [x] T075 - Add Skill Filters
- [x] T076 - Add Color Coding
- [x] T077 - Connect Skill Data
- [x] T078 - Make Skill Matrix responsive

---

# Phase 10 - Learning

- [x] T079 - Create Learning page
- [x] T080 - Build Learning Cards
- [x] T081 - Build Progress Widgets
- [x] T082 - Add Filters
- [x] T083 - Connect Learning JSON
- [x] T084 - Make Learning page responsive (+ Learning CRUD: add/edit/delete)

---

# Phase 11 - POCs

- [x] T085 - Create POCs page
- [x] T086 - Build POC Cards
- [x] T087 - Build POC Details
- [x] T088 - Add Filters
- [x] T089 - Connect POC JSON
- [x] T090 - Make POC page responsive (+ POC CRUD: add/edit/delete)

---

# Phase 12 - Reports

- [x] T091 - Create Reports page
- [x] T092 - Build Report Filters
- [x] T093 - Build Summary Cards
- [x] T094 - Build Export Buttons (CSV functional; Excel/PDF UI only)
- [x] T095 - Make Reports responsive

---

# Phase 13 - Settings

- [x] T096 - Create Settings page
- [x] T097 - Build Settings Sections
- [x] T098 - Build Settings Tables
- [x] T099 - Connect Settings JSON
- [x] T100 - Make Settings responsive (+ Settings CRUD, Director-only editing)

---

# Phase 14 - Role Based Dashboards

- [x] T101 - Create Role Context
- [x] T102 - Create Mock Login
- [x] T103 - Implement Role Switching
- [x] T104 - Show Role-specific Dashboard
- [x] T105 - Configure Sidebar Permissions
- [x] T106 - Restrict Actions by Role
- [x] T106a - Own-data visibility: roles below Tech Lead see only their own records across Activities, Learning, POCs, People, Skill Matrix and Reports (added)
- [x] T106b - Elevated access: Director = Super Admin; DM/EM/STL full access except Settings editing and User Management (added)

---
---

# Task Board Module

## T301 - Task Board Foundation

- Create Task Board module
- Add navigation menu
- Configure routing
- Create page layout
- Create reusable folder structure
- Configure module entry point

Status: Pending

---

## T302 - Task Data Model

- Create Task model
- Create Task Type definitions
- Create Task Category model
- Create Workflow model
- Create Comment model
- Create Attachment model

Status: Pending

---

## T303 - JSON Configuration

Create

- tasks.json
- taskWorkflow.json
- taskCategories.json

Generate realistic sample data.

Status: Pending

---

## T304 - Task Services

Create

- TaskService
- TaskBoardService
- TaskFilterService
- TaskStatisticsService
- TaskWorkflowService
- TaskPermissionService
- TaskSearchService
- TaskExportService

Status: Pending

---

## T305 - Board View

Implement

- Kanban Board
- Dynamic Columns
- Column Headers
- Task Count
- Horizontal Scrolling
- Vertical Scrolling

Status: Pending

---

## T306 - Drag & Drop

Implement using @dnd-kit

Support

- Drag within column
- Drag across columns
- Update Status
- Update Display Order
- Persist changes

Status: Pending

---

## T307 - Task Cards

Create reusable Task Card component.

Display

- Task Number
- Title
- Project Badge
- Standalone Badge
- Category
- Assignee
- Priority
- Due Date
- Estimate
- Labels
- AI Tool

Status: Pending

---

## T308 - Task Details Drawer

Create right-side drawer.

Include

- Overview
- Assignment
- Project
- Scheduling
- AI Information
- Comments
- Attachments
- Save
- Cancel

Status: Pending

---

## T309 - Task CRUD

Support

- Create
- Edit
- Delete
- Duplicate
- Archive
- Restore

Status: Pending

---

## T310 - Quick Task

Create lightweight dialog.

Fields

- Title
- Assignee
- Project
- Category
- Priority
- Due Date

Automatically create task in To Do.

Status: Pending

---

## T311 - Board Filters

Support

- Project
- Task Type
- Category
- Status
- Priority
- Assignee
- Reporter
- Labels
- AI Tool
- Due Date

Status: Pending

---

## T312 - Search

Search

- Task Number
- Title
- Description
- Labels
- Category
- Project
- Assignee
- Reporter

Status: Pending

---

## T313 - Board Grouping

Support grouping by

- Status
- Project
- Assignee
- Category
- Priority

Status: Pending

---

## T314 - List View

Create table view.

Support

- Sorting
- Filtering
- Pagination
- Column Visibility

Status: Pending

---

## T315 - Project Integration

Integrate Task Board into Projects.

Add

Tasks Tab

Display project-specific tasks.

Status: Pending

---

## T316 - People Integration

Integrate into Employee Profile.

Display

- Assigned Tasks
- Completed Tasks
- Workload
- Standalone Tasks
- Project Tasks

Status: Pending

---

## T317 - AI Activity Integration

Support linking

- AI Activity
- AI Tool
- Hours Saved
- Prompt Reference

Status: Pending

---

## T318 - Learning & POC Integration

Support

- Learning Tasks
- POC Links
- Related Records

Status: Pending

---

## T319 - Dashboard Integration

Create widgets

- My Tasks
- Recent Tasks
- Tasks by Status
- Tasks by Priority
- Overdue Tasks
- Due Today
- Standalone Tasks
- Project Tasks
- Workload by Employee

Status: Pending

---

## T320 - Reports

Create reporting support.

Include

- Tasks by Employee
- Tasks by Project
- Tasks by Category
- Tasks by Status
- Tasks by Priority
- Completion Trends
- Workload Distribution

Status: Pending

---

## T321 - Permissions

Integrate with existing permission framework.

Support

- tasks.view
- tasks.create
- tasks.edit
- tasks.delete
- tasks.assign
- tasks.comment
- tasks.export

Respect field-level permissions.

Status: Pending

---

## T322 - Responsive Design

Support

- Desktop
- Tablet
- Mobile

Optimize Board and List views.

Status: Pending

---

## T323 - Performance Optimization

Implement

- Lazy Loading
- Memoization
- Optimized Rendering
- Virtualization where appropriate

Status: Pending

---

## T324 - Testing & Validation

Validate

- Board View
- List View
- Drag & Drop
- CRUD
- Search
- Filters
- Grouping
- Permissions
- Dashboard Integration
- Project Integration
- People Integration

Fix all TypeScript, ESLint, and build errors.

Status: Pending

# Phase 14b - Authentication (added by request)

- [x] T117 - Create users.json (accounts for all employees + Super Admin)
- [x] T118 - Create UserService (authenticate + CRUD, Local Storage)
- [x] T119 - Build Login page (username/password, validation, demo accounts)
- [x] T120 - Guard routes; redirect to /login when signed out
- [x] T121 - Working logout (navbar + sidebar)
- [x] T122 - Super Admin role with full access
- [x] T123 - User Management page (create users, set/reset passwords, delete)

---

# Phase 15 - Polish

- [ ] T107 - Add Toast Notifications
- [ ] T108 - Improve Loading States
- [ ] T109 - Improve Empty States
- [ ] T110 - Improve Accessibility
- [ ] T111 - Improve Responsive Design
- [ ] T112 - Optimize Performance
- [ ] T113 - Refactor Components
- [ ] T114 - Final UI Review
- [ ] T115 - Verify All Modules
- [ ] T116 - Production Readiness Review

---

# Definition of Done

A task is complete only if:

- UI matches wireframe
- Uses reusable components
- Responsive
- TypeScript compliant
- No console errors
- Uses JSON services
- Has loading state
- Has empty state
- Follows CLAUDE.md
- No duplicated code

---

# After Every Task

Claude should provide:

## Completed Task

Example

✔ Completed T041 - Dashboard Layout

## Files Created

- src/pages/Dashboard.tsx
- src/components/dashboard/KPICard.tsx

## Files Modified

- App.tsx
- routes.tsx

## Summary

Brief explanation of what was implemented.

## Suggested Next Task

Example

T042 - Build KPI Cards

Then STOP and wait for approval.


