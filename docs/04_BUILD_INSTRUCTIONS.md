# 04_BUILD_INSTRUCTIONS.md

# AI Portfolio Dashboard

## Version

1.0

---

# Objective

Build a modern, responsive React application that helps leadership monitor AI adoption, learning, innovation, and team capabilities across the US Portfolio.

The application is intended for approximately 25–30 users and should remain lightweight, easy to maintain, and expandable in the future.

---

# Technology Stack

Frontend

- React 19
- TypeScript
- Vite

UI

- Tailwind CSS
- shadcn/ui
- Lucide React Icons

Routing

- React Router DOM

Charts

- Recharts

Forms

- React Hook Form
- Zod Validation

Tables

- TanStack React Table

Notifications

- Sonner

Utilities

- date-fns

---

# Data Source

Do NOT use a backend.

Use JSON files inside

src/data/

Example

employees.json

projects.json

activities.json

learning.json

pocs.json

settings.json

The application should read data from JSON.

All CRUD operations should update React state.

(Optionally persist to Local Storage.)

The data layer should be abstracted so it can later be replaced with REST APIs.

---

# Folder Structure

src/

components/

pages/

layouts/

hooks/

services/

context/

data/

types/

utils/

assets/

---

# Layout

Every page should use the same layout.

------------------------------------------------

Top Navbar

------------------------------------------------

Sidebar

Page Header

Content Area

------------------------------------------------

Footer (Optional)

------------------------------------------------

---

# Sidebar

Dashboard

Projects

AI Activities

People

Learning

POCs

Reports

Settings

The active page should be highlighted.

Sidebar should collapse on tablet/mobile.

---

# Navbar

Contains

Application Logo

Page Title

Global Search

Notification Icon

Current User

Role Badge

---

# Theme

Professional enterprise dashboard.

Colors

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

Danger

Red

Background

Light Gray

Cards

White

Rounded Corners

Large

Soft Shadows

Spacing

Comfortable

---

# Typography

Font

Inter

Titles

Bold

Section Headers

Semi Bold

Body

Regular

Use consistent spacing.

---

# Coding Standards

Use Functional Components.

Use TypeScript everywhere.

No class components.

Keep components small.

Maximum component size

250 lines

Split reusable UI into components.

Avoid duplicated code.

---

# Component Structure

Example

Dashboard/

Dashboard.tsx

KPICard.tsx

ActivityChart.tsx

ProjectChart.tsx

LearningCard.tsx

TopContributors.tsx

RecentActivities.tsx

Each page should have its own folder if needed.

---

# State Management

Use React Context.

Use custom hooks.

Avoid Redux.

Keep state simple.

Example

EmployeeContext

ProjectContext

ActivityContext

LearningContext

POCContext

---

# JSON Service Layer

Create services.

Example

EmployeeService.ts

ProjectService.ts

ActivityService.ts

These services should load JSON data.

Future API replacement should only affect services.

---

# Forms

Use

React Hook Form

Use

Zod

Validation

Required fields

Meaningful error messages

Reusable form components.

---

# Tables

Use TanStack Table.

Support

Sorting

Searching

Filtering

Pagination

Responsive Layout

---

# Charts

Use Recharts.

Dashboard should include

Line Chart

Bar Chart

Donut Chart

Progress Charts

Avoid unnecessary charts.

Keep them readable.

---

# Icons

Use Lucide Icons.

Use icons consistently.

Example

Users

Folder

Brain

Graduation Cap

Lightbulb

Chart

Settings

---

# Navigation

Use React Router.

Routes

/

dashboard

/projects

/activities

/people

/learning

/pocs

/reports

/settings

Unknown routes should redirect to Dashboard.

---

# Search

Every major page should support search.

Search should be instant.

No page refresh.

---

# Filters

Use dropdown filters.

Status

Project

Employee

Role

Technology

Date

AI Tool

Multiple filters should work together.

---

# Reusable Components

Build reusable components.

Examples

PageHeader

KPICard

StatCard

SearchBar

FilterBar

StatusBadge

ProgressBar

AvatarGroup

DataTable

ConfirmationDialog

EmptyState

LoadingSkeleton

ChartCard

SectionCard

Modal

Drawer

Toast

Do not duplicate UI.

---

# Loading States

Every page should have

Skeleton Loader

No blank screens.

---

# Empty States

Every module should have

Friendly message

Illustration

Action button

Example

"No AI Activities Found"

---

# Error Handling

Show user-friendly messages.

Avoid browser alerts.

Use Toast notifications.

---

# Responsive Design

Desktop

Full Sidebar

Laptop

Normal Layout

Tablet

Collapsed Sidebar

Mobile

Cards Stack Vertically

No horizontal scrolling.

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

Hide menu items when access is not available.

Disable actions instead of removing important information.

---

# Performance

Use lazy loading.

Memoize expensive components.

Avoid unnecessary renders.

Keep JSON parsing efficient.

---

# Code Quality

Use ESLint.

Use Prettier.

Meaningful variable names.

Meaningful component names.

Avoid inline styles.

Use Tailwind classes.

---

# Development Phases

Phase 1

Project Setup

Navigation

Layout

Theme

Sidebar

Navbar

------------------------------------------------

Phase 2

Dashboard

KPIs

Charts

Widgets

------------------------------------------------

Phase 3

Projects

CRUD

------------------------------------------------

Phase 4

AI Activities

CRUD

------------------------------------------------

Phase 5

People

Skill Matrix

------------------------------------------------

Phase 6

Learning

POCs

------------------------------------------------

Phase 7

Reports

Settings

------------------------------------------------

Phase 8

Testing

Refactoring

Responsive Design

---

# AI Assistant Instructions

When generating code

Always

Create reusable components.

Use TypeScript.

Keep components modular.

Follow the folder structure.

Avoid unnecessary complexity.

Use mock JSON data.

Generate production-quality React code.

Maintain consistent UI across all pages.

If a component already exists, reuse it instead of creating a duplicate.

Never rewrite existing files unless requested.
