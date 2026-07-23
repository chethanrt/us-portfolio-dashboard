# PROJECT_RULES.md

# AI Portfolio Dashboard

These are mandatory rules that Claude must follow throughout the project.

---

# General Goal

Build a clean, lightweight internal dashboard.

This is NOT an enterprise ERP.

This is NOT Jira.

This is NOT Azure DevOps.

This application is only for approximately 25–30 users to track AI adoption, learning, skills, POCs, and AI activities.

Always keep the application simple, clean, and maintainable.

---

# Architecture Rules

Always follow React best practices.

Use

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

Do NOT introduce unnecessary frameworks.

Do NOT introduce Redux.

Do NOT introduce complex architectures.

Keep the codebase simple.

---

# Data Rules

Use JSON files as the database.

Never introduce a backend.

Never add Express.

Never add Node APIs.

Never add MongoDB.

Never add PostgreSQL.

If persistence is needed, use Local Storage.

The application should be designed so JSON can later be replaced by APIs.

---

# Component Rules

Always reuse components.

Before creating a new component,

check if an existing component can be reused.

Examples

KPICard

StatCard

PageHeader

SearchBar

FilterBar

DataTable

StatusBadge

ProgressBar

Modal

Drawer

Dialog

EmptyState

LoadingSkeleton

Avoid duplicated UI.

---

# File Rules

Never rewrite an existing file unless requested.

Only modify files related to the current task.

Do not rename folders without approval.

Do not move files unnecessarily.

---

# UI Rules

Maintain a professional dashboard appearance.

Use consistent spacing.

Use consistent colors.

Keep pages uncluttered.

Avoid unnecessary animations.

No flashy effects.

Prioritize readability.

---

# Page Rules

Every page should contain

Page Title

Breadcrumb (optional)

Search

Filters

Primary Action Button

Main Content

Loading State

Empty State

Responsive Layout

---

# Dashboard Rules

Dashboard should always remain simple.

Maximum

8 KPI cards.

Maximum

4 charts.

Maximum

2 summary tables.

Do not overload the dashboard.

---

# Forms

Use

React Hook Form

with

Zod Validation.

Do not create custom validation logic unless necessary.

---

# Tables

Use TanStack Table.

Support

Sorting

Searching

Filtering

Pagination

Responsive layout.

---

# Charts

Use Recharts.

Keep charts readable.

Avoid 3D charts.

Avoid unnecessary pie charts.

Preferred

Bar

Line

Donut

Area

Progress

---

# JSON Rules

Keep JSON normalized.

Do not duplicate data.

Use IDs for relationships.

Example

employeeId

projectId

activityId

---

# Naming Convention

Components

PascalCase

Example

Dashboard.tsx

KPICard.tsx

ProjectCard.tsx

Hooks

useEmployees.ts

useProjects.ts

Types

Employee.ts

Project.ts

Functions

camelCase

Variables

camelCase

Constants

UPPER_CASE

---

# CSS Rules

Use Tailwind CSS only.

Do not use inline styles.

Avoid custom CSS unless absolutely necessary.

Use reusable utility classes.

---

# Icons

Use Lucide React.

Use icons consistently.

Do not mix icon libraries.

---

# Responsive Rules

Desktop First.

Tablet

Collapsed Sidebar.

Mobile

Cards should stack vertically.

Avoid horizontal scrolling.

---

# Performance

Lazy load pages.

Memoize expensive components.

Avoid unnecessary re-renders.

Keep bundle size small.

---

# Code Style

Write readable code.

Prefer clarity over cleverness.

Avoid deeply nested logic.

Maximum component size

250 lines.

Split reusable logic into hooks.

---

# State Management

Use

React Context

and

Custom Hooks.

Avoid Redux.

Avoid MobX.

Keep state localized whenever possible.

---

# Error Handling

Display friendly messages.

Never expose raw errors.

Use toast notifications.

---

# Empty States

Every page must have an Empty State.

Example

"No Projects Found"

"No AI Activities Available"

Include an action button whenever possible.

---

# Loading States

Every page should display Skeleton Loaders.

Never leave blank pages.

---

# Future Proofing

Build components so they can later consume REST APIs.

Avoid tightly coupling UI to JSON.

Always use service functions.

---

# Development Workflow

Always work feature by feature.

Complete

UI

↓

Functionality

↓

Testing

↓

Refactoring

Then move to the next feature.

Do not build everything at once.

---

# Before Writing Code

Claude should always

Understand the current module.

Reuse existing components.

Follow folder structure.

Follow naming conventions.

Avoid duplicated code.

Keep implementation simple.

---

# When Adding New Features

Check existing components first.

Check existing types.

Check existing services.

Check routing.

Check permissions.

Only then create new files.

---

# Final Goal

The finished application should look like a professional internal Microsoft/Atlassian dashboard.

It should be

Simple

Fast

Responsive

Easy to maintain

Easy to extend

Consistent throughout the application.

Always prioritize maintainability over complexity.