# 🤖 AI Portfolio Dashboard

A lightweight internal dashboard for tracking AI adoption, learning, skills, and innovation across the US Portfolio engineering team.

---

## 📌 Project Overview

The AI Portfolio Dashboard helps leadership and engineering teams monitor how Artificial Intelligence is being adopted across projects.

The application provides visibility into:

- AI Adoption across projects
- AI Activities performed by team members
- Team Skill Matrix
- Learning Progress (Udemy AI Lab)
- POCs & Innovation
- Role-based Dashboards
- Reports & Insights

This application is intended for approximately **30 users** and is **not** a replacement for Jira, Azure DevOps, or HR systems.

---

## 🎯 Objectives

- Encourage AI adoption across the engineering organization.
- Track AI usage during different project stages.
- Measure productivity improvements and hours saved.
- Monitor team learning and certifications.
- Showcase innovation, POCs, and reusable AI solutions.
- Provide leadership with meaningful dashboards and reports.

---

## 👥 Supported Roles

- Director
- Delivery Manager
- Engineering Manager
- Senior Tech Lead
- Tech Lead
- Senior Developer
- Developer
- Intern

Each role sees a personalized dashboard with relevant KPIs and permissions.

---

## 📂 Project Modules

- Dashboard
- Projects
- AI Activities
- People
- Skill Matrix
- Learning Tracker
- POCs & Innovation
- Reports
- Settings

---

## 🛠️ Technology Stack

### Frontend

- React 19
- TypeScript
- Vite

### UI

- Tailwind CSS
- shadcn/ui
- Lucide React Icons

### Routing

- React Router DOM

### Charts

- Recharts

### Tables

- TanStack Table

### Forms

- React Hook Form
- Zod Validation

### Notifications

- Sonner

### Data

- JSON Files
- Local Storage (Optional)

---

## 📁 Folder Structure

```text
AI-Portfolio-Dashboard/
│
├── CLAUDE.md
├── START_HERE.md
├── README.md
│
├── docs/
│   ├── 01_REQUIREMENTS.md
│   ├── 02_DATABASE.md
│   ├── 03_UI_WIREFRAMES.md
│   ├── 04_BUILD_INSTRUCTIONS.md
│   ├── 05_ROLE_BASED_DASHBOARDS.md
│   └── 06_SAMPLE_DATA.md
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📊 Core Features

### Dashboard

- Executive KPIs
- AI Adoption
- Hours Saved
- Project Status
- Learning Progress
- AI Tool Usage
- Recent Activities

### Projects

- Portfolio Projects
- AI Adoption %
- Current Stage
- Team Members
- Technology Stack

### AI Activities

Track AI usage for:

- Development
- Documentation
- Code Review
- Estimation
- Testing
- Marketing
- CMS Research
- Innovation
- POCs

### People

- Employee Profiles
- Skills
- Current Projects
- AI Statistics

### Skill Matrix

Track:

- Magento
- PHP
- React
- JavaScript
- GraphQL
- Docker
- Git
- Claude
- ChatGPT
- GitHub Copilot
- Prompt Engineering

### Learning

Track:

- Udemy AI Lab
- Internal Training
- Course Progress
- Certifications

### POCs

Track:

- AI Innovations
- Automation Ideas
- Business Value
- Hours Saved
- Demo Links

### Reports

Generate reports for:

- AI Adoption
- Learning
- Skills
- Projects
- POCs

---

## 🔐 Role-Based Access

The application supports role-based dashboards and permissions.

Roles determine:

- Dashboard widgets
- Accessible pages
- Available actions
- Report visibility
- Team management

---

## 💾 Data Source

This project uses **JSON files** as the data source.

Located in:

```text
src/data/
```

Files include:

- employees.json
- projects.json
- activities.json
- learning.json
- pocs.json
- settings.json

The data layer is abstracted through service classes so it can be migrated to an API in the future.

---

## 🚀 Development Workflow

1. Read `CLAUDE.md`
2. Read all documents in `docs/`
3. Set up the project
4. Generate sample data
5. Build the application shell
6. Develop one module at a time
7. Test and refine
8. Repeat

---

## 📖 Documentation

Project documentation is located in the `docs/` folder.

- 01_REQUIREMENTS.md
- 02_DATABASE.md
- 03_UI_WIREFRAMES.md
- 04_BUILD_INSTRUCTIONS.md
- 05_ROLE_BASED_DASHBOARDS.md
- 06_SAMPLE_DATA.md

---

## 📌 Future Enhancements

- Azure DevOps Integration
- Jira Integration
- GitHub Integration
- AI Prompt Library
- AI Recommendations
- Microsoft Teams Notifications
- Power BI Export
- Authentication & SSO
- Database Migration (SQLite/PostgreSQL)

---

## ✅ Project Status

**Version:** 1.0

**Status:** Planning & Initial Development

This project is intended to be built incrementally using Claude Code, following the documentation and coding standards defined in `CLAUDE.md`.