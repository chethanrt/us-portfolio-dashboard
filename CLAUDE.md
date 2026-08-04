# CLAUDE.md

# AI Portfolio Dashboard

Welcome to the AI Portfolio Dashboard project.

This document defines how you should work on this project.

---

# Project Goal

Build a lightweight internal dashboard for tracking AI adoption across a US Portfolio engineering organization.

The application is intended for approximately 30 users.

This application is NOT

- Jira
- Azure DevOps
- ERP
- HRMS
- CRM

Keep the application lightweight and easy to maintain.

---

# Tech Stack

Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

Charts

- Recharts

Forms

- React Hook Form

Validation

- Zod

Tables

- TanStack Table

Icons

- Lucide React

Routing

- React Router

Database

- JSON Files

No backend.

No Express.

No Node API.

No database.

Future migration should be easy.

---

# Project Documents

Always read these documents before making changes.

docs/

01_REQUIREMENTS.md

02_DATABASE.md

03_UI_WIREFRAMES.md

04_BUILD_INSTRUCTIONS.md

05_ROLE_BASED_DASHBOARDS.md

06_SAMPLE_DATA.md

These files are the source of truth.

If implementation differs from documentation, ask before changing.

---

# Working Style

Implement one feature at a time.

Never build everything in one step.

Complete

UI

↓

Functionality

↓

Testing

↓

Refactoring

↓

Next Feature

---

# Folder Structure

Follow this structure.

src/

components/

pages/

layouts/

hooks/

services/

context/

types/

utils/

data/

assets/

Never reorganize folders unless requested.

---

# Data Rules

Use JSON files located in

src/data/

Employees

Projects

Activities

Learning

POCs

Settings

Always access JSON through service classes.

Do not import JSON directly into components.

---

# Component Rules

Build reusable components.

Examples

KPICard

ChartCard

PageHeader

SearchBar

FilterBar

StatusBadge

ProgressBar

DataTable

Modal

Drawer

EmptyState

LoadingSkeleton

Toast

Before creating a component,

check whether one already exists.

---

# UI Rules

Professional dashboard.

Inspired by

Microsoft

GitHub

Atlassian

Linear

Minimal.

Clean.

Readable.

Avoid unnecessary animations.

Avoid visual clutter.

---

# Color Palette

Primary

Blue

Secondary

Indigo

Accent

Purple

Success

Green

Warning

Orange

Error

Red

Background

Light Gray

Cards

White

---

# Layout Rules

Sidebar

Top Navigation

Content Area

Consistent spacing.

Responsive.

Desktop First.

---

# Coding Rules

Use Functional Components.

Use TypeScript.

Avoid any.

Prefer interfaces.

Keep components under 250 lines.

Extract reusable logic.

Meaningful naming.

---

# State Management

React Context.

Custom Hooks.

No Redux.

No MobX.

No Zustand unless requested.

---

# Services

Every JSON file should have a matching service.

EmployeeService

ProjectService

ActivityService

LearningService

POCService

SettingsService

Components should call services.

---

# Forms

Use React Hook Form.

Use Zod.

Show validation.

Meaningful messages.

---

# Tables

Use TanStack Table.

Support

Sorting

Searching

Filtering

Pagination

---

# Charts

Use Recharts.

Preferred Charts

Line

Bar

Area

Donut

Progress

Avoid excessive charts.

---

# Role Based Access

Roles

Director

Delivery Manager

Engineering Manager

Senior Tech Lead

Tech Lead

Senior Developer

Developer

Intern

Dashboard should change according to role.

Sidebar should respect permissions.

---

# Empty State

Every page should have one.

Example

"No AI Activities Found"

Include action button.

---

# Loading State

Use Skeleton components.

Never display blank pages.

---

# Error Handling

Display friendly messages.

Use toast notifications.

No browser alerts.

---

# Performance

Use lazy loading.

Memoize expensive components.

Avoid unnecessary renders.

---

# Git Rules

Never modify unrelated files.

Never delete files without approval.

Keep commits focused.

---

# Before Creating Code

Always

Read existing code.

Reuse components.

Follow documentation.

Keep implementation simple.

Ask if requirements are unclear.

---

# Build Order

1 Project Setup

2 Layout

3 Sidebar

4 Navbar

5 Dashboard

6 Projects

7 AI Activities

8 People

9 Learning

10 POCs

11 Reports

12 Settings

13 Responsive Improvements

14 Testing

---

# Definition of Done

A feature is complete when

✓ UI matches wireframe

✓ Responsive

✓ Uses reusable components

✓ Uses services

✓ Uses JSON

✓ Has loading state

✓ Has empty state

✓ Has validation

✓ Has clean code

---

# Final Objective

Build a dashboard that leadership can use daily.

It should be

Simple

Fast

Professional

Maintainable

Scalable

Do not over-engineer.

# CLAUDE.md

# AI Portfolio Dashboard

Welcome to the AI Portfolio Dashboard project.

This document defines how you should work on this project.

---

# Project Goal

Build a lightweight internal dashboard for tracking AI adoption across a US Portfolio engineering organization.

The application is intended for approximately 30 users.

This application is NOT

- Jira
- Azure DevOps
- ERP
- HRMS
- CRM

Keep the application lightweight and easy to maintain.

---

# Tech Stack

Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

Charts

- Recharts

Forms

- React Hook Form

Validation

- Zod

Tables

- TanStack Table

Icons

- Lucide React

Routing

- React Router

Database

- JSON Files

No backend.

No Express.

No Node API.

No database.

Future migration should be easy.

---

# Project Documents

Always read these documents before making changes.

docs/

01_REQUIREMENTS.md

02_DATABASE.md

03_UI_WIREFRAMES.md

04_BUILD_INSTRUCTIONS.md

05_ROLE_BASED_DASHBOARDS.md

06_SAMPLE_DATA.md

These files are the source of truth.

If implementation differs from documentation, ask before changing.

---

# Working Style

Implement one feature at a time.

Never build everything in one step.

Complete

UI

↓

Functionality

↓

Testing

↓

Refactoring

↓

Next Feature

---

# Folder Structure

Follow this structure.

src/

components/

pages/

layouts/

hooks/

services/

context/

types/

utils/

data/

assets/

Never reorganize folders unless requested.

---

# Data Rules

Use JSON files located in

src/data/

Employees

Projects

Activities

Learning

POCs

Settings

Always access JSON through service classes.

Do not import JSON directly into components.

---

# Component Rules

Build reusable components.

Examples

KPICard

ChartCard

PageHeader

SearchBar

FilterBar

StatusBadge

ProgressBar

DataTable

Modal

Drawer

EmptyState

LoadingSkeleton

Toast

Before creating a component,

check whether one already exists.

---

# UI Rules

Professional dashboard.

Inspired by

Microsoft

GitHub

Atlassian

Linear

Minimal.

Clean.

Readable.

Avoid unnecessary animations.

Avoid visual clutter.

---

# Color Palette

Primary

Blue

Secondary

Indigo

Accent

Purple

Success

Green

Warning

Orange

Error

Red

Background

Light Gray

Cards

White

---

# Layout Rules

Sidebar

Top Navigation

Content Area

Consistent spacing.

Responsive.

Desktop First.

---

# Coding Rules

Use Functional Components.

Use TypeScript.

Avoid any.

Prefer interfaces.

Keep components under 250 lines.

Extract reusable logic.

Meaningful naming.

---

# State Management

React Context.

Custom Hooks.

No Redux.

No MobX.

No Zustand unless requested.

---

# Services

Every JSON file should have a matching service.

EmployeeService

ProjectService

ActivityService

LearningService

POCService

SettingsService

Components should call services.

---

# Forms

Use React Hook Form.

Use Zod.

Show validation.

Meaningful messages.

---

# Tables

Use TanStack Table.

Support

Sorting

Searching

Filtering

Pagination

---

# Charts

Use Recharts.

Preferred Charts

Line

Bar

Area

Donut

Progress

Avoid excessive charts.

---

# Role Based Access

Roles

Director

Delivery Manager

Engineering Manager

Senior Tech Lead

Tech Lead

Senior Developer

Developer

Intern

Dashboard should change according to role.

Sidebar should respect permissions.

---

# Empty State

Every page should have one.

Example

"No AI Activities Found"

Include action button.

---

# Loading State

Use Skeleton components.

Never display blank pages.

---

# Error Handling

Display friendly messages.

Use toast notifications.

No browser alerts.

---

# Performance

Use lazy loading.

Memoize expensive components.

Avoid unnecessary renders.

---

# Git Rules

Never modify unrelated files.

Never delete files without approval.

Keep commits focused.

---

# Before Creating Code

Always

Read existing code.

Reuse components.

Follow documentation.

Keep implementation simple.

Ask if requirements are unclear.

---

# Build Order

1 Project Setup

2 Layout

3 Sidebar

4 Navbar

5 Dashboard

6 Projects

7 AI Activities

8 People

9 Learning

10 POCs

11 Reports

12 Settings

13 Responsive Improvements

14 Testing

---

# Definition of Done

A feature is complete when

✓ UI matches wireframe

✓ Responsive

✓ Uses reusable components

✓ Uses services

✓ Uses JSON

✓ Has loading state

✓ Has empty state

✓ Has validation

✓ Has clean code

---

# Git Collaboration Rules

This project is developed by multiple developers working in parallel.

Before making any code changes, follow these rules.

## Branch Safety

- Never assume the local branch is up to date.
- Review the latest code before modifying files.
- Minimize changes to unrelated files.
- Do not reformat files that are unrelated to the current task.
- Preserve existing imports, formatting, and code style.

## Scope

Only modify files required for the assigned task.

Do NOT

- Rename unrelated files
- Move files
- Reorganize folders
- Reformat the project
- Update package versions
- Update lock files unless explicitly requested

## Merge Safety

Design changes to minimize merge conflicts.

Prefer

- Small reusable components
- New files instead of modifying existing ones where possible
- Feature-specific folders
- Composition instead of editing shared files

## Shared Files

The following files are considered high-conflict files.

- App.tsx
- Routes.tsx
- Sidebar.tsx
- Navigation.tsx
- package.json
- package-lock.json
- vite.config.ts
- tsconfig.json

Modify these files only when absolutely necessary.

## Existing Code

Before editing a file

- Read the entire file
- Understand its purpose
- Preserve existing behavior
- Avoid unnecessary refactoring

## Output

At the end of implementation provide

- Files Created
- Files Modified
- Reason each file was modified
- Any shared files that were changed


## Parallel Development Guidelines

Before implementing any feature:

1. Read `FEATURES.md` to identify the feature being worked on.
2. Restrict changes to files required for the assigned feature.
3. Minimize changes to shared files such as routing, navigation, layouts, and configuration.
4. Do not modify files owned by another active feature unless absolutely necessary.
5. If a shared file must be modified, preserve existing code and make only the minimal required changes.
6. Before completing the task, verify that your changes will not impact other features or cause merge conflicts.
7. In your final summary, list:
   - Files created
   - Files modified
   - Shared files modified (if any)
   - Reason for modifying each shared file

# Final Objective

Build a dashboard that leadership can use daily.

It should be

Simple

Fast

Professional

Maintainable

Scalable

Do not over-engineer.

Keep everything lightweight.