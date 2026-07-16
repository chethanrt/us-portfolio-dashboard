# AI Portfolio Dashboard

Version: 1.0

---

# 1. Overview

## Purpose

The AI Portfolio Dashboard is an internal web application designed to monitor and improve AI adoption across the US Portfolio team.

The application is intended for approximately 25-30 team members working across Magento, PHP, CMS, Marketing, and Engineering initiatives.

The goal is to provide leadership with visibility into:

- AI adoption across projects
- Team learning progress
- Skill matrix
- AI activities
- Innovation and POCs
- AI usage across project stages

This application is **NOT** intended to replace Jira, Azure DevOps, or HR systems. It is a lightweight management dashboard focused on AI adoption and capability tracking.

---

# 2. Users

The application supports the following roles.

- Director
- Delivery Manager
- Engineering Manager
- Senior Tech Lead
- Tech Lead
- Senior Developer
- Developer
- Intern

Each role has different permissions.

---

# 3. Modules

The application contains the following modules.

1. Dashboard
2. Projects
3. AI Activities
4. People
5. Skill Matrix
6. Learning Tracker
7. POCs & Innovation
8. Reports
9. Settings

---

# 4. Dashboard

The Dashboard provides an executive summary.

KPIs

- Total Employees
- Active Projects
- AI Activities This Month
- AI Adoption %
- Hours Saved
- POCs
- Innovation Ideas
- Learning Completion %
- Active AI Users

Charts

- AI Usage by Project Stage
- AI Tool Usage
- Learning Progress
- Project Status
- Monthly AI Activities
- Top Contributors

Recent Items

- Recent AI Activities
- Recent POCs
- Recent Learning Completion

---

# 5. Projects Module

Each project should contain:

- Project Name
- Client
- Program
- Engineering Manager
- Tech Lead
- Technology
- Current Stage
- Status
- AI Adoption Percentage
- Team Members
- Start Date
- End Date

Every project should also display AI activities associated with it.

---

# 6. AI Activities

This module tracks how AI is being used.

Each activity contains:

- Employee
- Project
- Date
- AI Tool
- Activity Type
- Project Stage
- Prompt Summary
- Outcome
- Hours Saved
- Impact
- Attachment (Optional)

Activity Types

- Development
- Documentation
- Estimation
- Code Review
- Testing
- CMS Research
- Marketing
- POC
- Innovation
- Learning
- Other

Supported AI Tools

- Claude
- ChatGPT
- GitHub Copilot
- Gemini
- Cursor
- Perplexity
- Other

---

# 7. People

Each employee profile contains

Basic Information

- Name
- Employee ID
- Role
- Experience
- Email
- Team

Professional Information

- Primary Technology
- Secondary Technology
- Current Project

Statistics

- AI Activities
- Hours Saved
- Learning %
- POCs
- Innovation Ideas

---

# 8. Skill Matrix

Track technical and AI skills.

Technical Skills

- Magento
- PHP
- MySQL
- JavaScript
- React
- GraphQL
- Docker
- Git

AI Skills

- Claude
- ChatGPT
- GitHub Copilot
- Cursor
- Prompt Engineering

Skill Levels

- Beginner
- Intermediate
- Advanced
- Expert

---

# 9. Learning Tracker

Track AI learning.

Fields

- Course Name
- Platform
- Status
- Completion %
- Completion Date
- Certificate
- Hours

Platforms

- Udemy AI Lab
- Internal Training
- Other

Status

- Not Started
- In Progress
- Completed

---

# 10. POCs & Innovation

Track AI initiatives.

Fields

- Title
- Owner
- Project
- Category
- Description
- Business Value
- Status
- Hours Saved
- Repository Link
- Demo Link
- Documents

Status

- Idea
- In Progress
- Completed
- On Hold

---

# 11. Reports

Generate reports for:

- Weekly AI Usage
- Monthly AI Adoption
- Learning Progress
- Skill Matrix
- POCs
- Team Performance

Reports should support filtering by:

- Date
- Project
- Team
- Employee

---

# 12. Settings

Manage application master data.

Settings include:

- Roles
- Skills
- AI Tools
- Project Stages
- Activity Types
- Learning Platforms

---

# 13. Project Stages

Projects can be in one of the following stages.

- Discovery
- Requirement Gathering
- Estimation
- Development
- Testing
- Documentation
- Deployment
- Support

AI activities should always be mapped to one of these stages.

---

# 14. Goals

The application should help answer questions like:

How many people actively use AI?

Which projects have the highest AI adoption?

How many hours have been saved using AI?

Which AI tools are most used?

Who are the top contributors?

Which skills need improvement?

How many POCs are active?

What is the learning progress across the team?

---

# 15. Future Enhancements

Possible future additions

- Azure DevOps Integration
- Jira Integration
- GitHub Integration
- Teams Notifications
- AI Recommendation Engine
- Power BI Export