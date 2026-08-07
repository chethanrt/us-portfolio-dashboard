# Feature Ownership

This file is used to coordinate parallel development.

Before starting any implementation:

- Review this file.
- Do not work on a feature already marked as "In Progress" by another developer.
- If your work requires changes to a shared file owned by another active feature, coordinate before making changes.
- Keep feature branches focused on a single feature.
- Update this file when starting or completing work.

---

| ID | Feature | Owner | Branch | Status |
|----|---------|-------|--------|--------|
| F001 | Dashboard | Developer A | feature/dashboard | Completed |
| F002 | Projects | Developer A | feature/projects | Completed |
| F003 | AI Activities | Developer A | feature/ai-activities | Completed |
| F004 | People | Developer A | feature/people | Completed |
| F005 | Skill Matrix | Developer A | feature/skill-matrix | Completed |
| F006 | Learning | Developer A | feature/learning | Completed |
| F007 | POCs | Developer A | feature/pocs | Completed |
| F008 | Reports | Developer A | feature/reports | Completed |
| F009 | Settings | Developer A | feature/settings | Completed |
| F010 | Role & Permission Framework | Developer A | feature/rbac | Completed |
| F011 | Task Board | Developer A | feature/task-board | In Progress |
| F012 | Authentication | Unassigned | - | Planned |
| F013 | Notifications | Unassigned | - | Planned |
| F014 | Audit Logs | Unassigned | - | Planned |

---

# Shared Files

The following files are considered shared and should be modified with extra care.

- src/App.tsx
- src/routes/*
- src/layout/*
- src/components/Sidebar/*
- src/components/Header/*
- package.json
- vite.config.ts
- tsconfig.json

---

# Parallel Development Rules

- One feature per branch.
- One Pull Request per feature.
- Avoid modifying shared files unless required.
- Prefer creating new components instead of changing existing shared components.
- Rebase your branch with the latest `main` before opening a Pull Request.
- Resolve merge conflicts locally before submitting a PR.
- Update this file when a feature starts, completes, or changes ownership.