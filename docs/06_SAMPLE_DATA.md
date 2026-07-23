# 06_SAMPLE_DATA.md

# Sample Data Requirements

Version: 1.0

---

# Purpose

Create realistic sample data for demonstrating the AI Portfolio Dashboard.

The sample data should represent a US Portfolio engineering organization working primarily on Magento, PHP, CMS, and Marketing applications.

The generated data should be internally consistent (employees referenced by projects, projects referenced by activities, etc.) and suitable for charts, dashboards, filtering, and reports.

---

# Team Structure

Total Employees: 30

Roles

| Role | Count |
|------|------:|
| Director | 1 |
| Delivery Manager | 2 |
| Engineering Manager | 3 |
| Senior Tech Lead | 3 |
| Tech Lead | 4 |
| Senior Developer | 6 |
| Developer | 8 |
| Intern | 3 |

---

# Technologies

Primary Technologies

- Magento
- Adobe Commerce
- PHP
- React
- JavaScript
- GraphQL
- MySQL
- Redis
- Docker
- CMS
- Marketing Automation

---

# AI Tools

Generate activities using these tools

- Claude
- ChatGPT
- GitHub Copilot
- Cursor
- Gemini
- Perplexity

---

# Projects

Generate 10 projects.

Example project names

- Phoenix Commerce
- Atlas CMS
- Mercury Retail
- Nova Marketing
- Orion Marketplace
- Horizon Commerce
- Velocity Storefront
- Apollo B2B
- Titan CMS
- Eclipse Loyalty

Each project should include

- Client
- Technology
- Engineering Manager
- Tech Lead
- Team Members
- Current Stage
- Status
- AI Adoption %
- Start Date
- End Date

Project stages should include a mix of:

- Discovery
- Requirement Gathering
- Estimation
- Development
- Testing
- Documentation
- Deployment
- Support

---

# Employees

Generate 30 employees.

Each employee should include

- Employee ID
- Name
- Email
- Role
- Experience (1–18 years)
- Team
- Primary Skill
- Secondary Skill
- Current Project
- Status

Generate realistic names.

Distribute employees across all projects.

---

# Skills

Each employee should have ratings for

Technical Skills

- Magento
- PHP
- React
- JavaScript
- GraphQL
- MySQL
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

Ensure ratings align with seniority (e.g., interns mostly Beginner/Intermediate, Tech Leads Advanced/Expert).

---

# AI Activities

Generate approximately 250 AI activity records.

Each activity should contain

- Date
- Employee
- Project
- AI Tool
- Activity Type
- Project Stage
- Prompt Summary
- Outcome
- Hours Saved
- Impact

Activity Types

- Development
- Documentation
- Code Review
- Testing
- Estimation
- CMS Research
- Marketing
- Learning
- POC
- Innovation

Hours Saved

Random between 0.5 and 8 hours.

Impact

- Low
- Medium
- High

Dates

Spread over the last 90 days.

---

# Learning Records

Generate learning data for every employee.

Platforms

- Udemy AI Lab
- Internal Training

Status

- Not Started
- In Progress
- Completed

Each employee should have between 2 and 5 courses.

Courses can include

- Prompt Engineering
- Claude for Developers
- GitHub Copilot Essentials
- AI for Magento
- AI Assisted Documentation
- Secure Coding with AI
- AI Powered Testing

Completion percentages should vary realistically.

---

# POCs

Generate 15 POCs.

Fields

- Title
- Owner
- Project
- Category
- Description
- Status
- Business Value
- Hours Saved
- Demo Link
- Repository Link

Categories

- Automation
- Documentation
- CMS
- Marketing
- Testing
- Development
- Estimation

Statuses

- Idea
- In Progress
- Completed
- On Hold

---

# Dashboard Expectations

The generated data should produce meaningful dashboards.

Examples

- AI Adoption between 35% and 90%
- Learning Completion between 40% and 95%
- Mix of project stages
- Different AI tool usage
- Variety of skill levels
- Visible trends over time
- Top contributors based on activities and hours saved

---

# Data Integrity Rules

- Every project must reference valid employees.
- Every AI activity must reference an existing employee and project.
- Every POC owner must exist in the employee list.
- Learning records must map to valid employees.
- Use consistent IDs across all JSON files.

---

# Deliverables

Generate the following JSON files in `src/data/`

- employees.json
- projects.json
- activities.json
- learning.json
- pocs.json
- settings.json

Ensure the data is realistic, interconnected, and immediately usable by the application without manual editing.