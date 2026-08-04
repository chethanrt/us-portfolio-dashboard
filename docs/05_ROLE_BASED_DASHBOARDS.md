# 05_ROLE_BASED_DASHBOARDS.md

# Role Based Dashboard & Permissions

Version 1.0

---

# Overview

The application supports multiple user roles.

After login, users should see a dashboard tailored to their responsibilities.

The dashboard should display only relevant information while hiding unnecessary modules.

Common Navigation

- Dashboard
- Projects
- AI Activities
- People
- Skill Matrix
- Learning
- POCs
- Reports
- Settings

Visible pages depend on the logged-in role.

---

# Roles

1. Director

2. Delivery Manager

3. Engineering Manager

4. Senior Tech Lead

5. Tech Lead

6. Senior Developer

7. Developer

8. Intern

---

# Director Dashboard

Purpose

Portfolio Overview

Visible KPIs

Total Employees

Active Projects

Portfolio AI Adoption %

AI Activities This Month

Hours Saved

Innovation Count

POCs Completed

Learning Completion %

Top Contributors

Charts

AI Adoption Trend

AI Usage by Projects

Project Health

Learning Progress

Skill Distribution

AI Tool Usage

Recent Activities

Latest POCs

Recent Certifications

Quick Actions

Export Reports

View Projects

View Team

View Skill Matrix

Permissions

Read Only

Can View Everything

Cannot Edit Team Data

Can Export Reports

---

# Delivery Manager Dashboard

Purpose

Delivery Portfolio

KPIs

Projects

Project Status

AI Adoption

Team Utilization

Open POCs

Learning Progress

Hours Saved

Charts

Project Status

Project AI Adoption

Project Stage Distribution

Technology Distribution

Recent Activities

Projects at Risk

Permissions

Manage Projects

Approve POCs

View Reports

View Team

Cannot Modify Settings

---

# Engineering Manager Dashboard

Purpose

Manage Engineering Teams

KPIs

Team Members

Skill Coverage

Learning %

AI Activities

POCs

Innovation

Hours Saved

Charts

Skill Heatmap

Learning Progress

AI Tool Usage

Technology Distribution

Recent Activities

Pending Learning

Skill Gaps

Quick Actions

Assign Learning

Review Activities

Update Skills

Permissions

Manage Team

Update Skills

View Projects

Approve Team Activities

Cannot Manage Portfolio Settings

---

# Senior Tech Lead Dashboard

Purpose

Technical Leadership

KPIs

Assigned Projects

Team Activities

Prompt Usage

POCs

Documentation Generated

Hours Saved

Charts

Development Activities

Documentation Activities

Prompt Categories

AI Tool Usage

Recent Team Activities

Pending Reviews

Quick Actions

Approve Activities

Create POC

Review Team Learning

Permissions

Manage Team Activities

Update POCs

View Skills

Cannot Manage Users

---

# Tech Lead Dashboard

Purpose

Daily Team Management

KPIs

Assigned Developers

Today's Activities

Learning Progress

Project Status

Hours Saved

Open POCs

Charts

Weekly Activities

Learning Status

AI Usage

Quick Actions

Add Activity

Add POC

Update Project

Permissions

Manage Own Team

Cannot Edit Other Teams

---

# Senior Developer Dashboard

Purpose

Individual Performance

KPIs

Activities

Hours Saved

Learning %

POCs

Prompt Usage

Charts

Weekly Activities

Learning Progress

AI Tool Usage

Recent Activities

Quick Actions

Add Activity

Update Learning

Submit POC

Permissions

Manage Own Data

View Team

Cannot Manage Users

---

# Developer Dashboard

Purpose

Daily AI Usage

KPIs

Activities

Learning

Prompt Count

Hours Saved

POCs

Recent Activities

Learning Courses

Quick Actions

Log AI Activity

Update Learning

View Skills

Permissions

Edit Own Profile

Edit Own Activities

Edit Own Learning

---

# Intern Dashboard

Purpose

Learning & Growth

KPIs

Courses

Completion %

Mentor

Activities

Hours Learned

Current Learning Path

Assignments

Recommended Courses

Upcoming Sessions

Quick Actions

Update Learning

Log Activities

Permissions

Own Data Only

Cannot Create Projects

Cannot Edit Others

---

# Common Features

Every role should have

Search

Notifications

Profile

Theme Switch (Future)

Responsive Layout

---

# Role Permissions Matrix

| Module | Director | Delivery Manager | Engineering Manager | Senior Tech Lead | Tech Lead | Senior Developer | Developer | Intern |
|---------|----------|------------------|---------------------|------------------|-----------|------------------|-----------|---------|
| Dashboard | View | View | View | View | View | View | View | View |
| Projects | View | Edit | Edit | Edit Team | Edit Team | View | View | View |
| AI Activities | View | View | Manage Team | Manage Team | Manage Team | Own | Own | Own |
| People | View | View | Team | Team | Team | View | Own | Own |
| Skill Matrix | View | Edit | Edit Team | View | View | Own | Own | Own |
| Learning | View | View | Team | Team | Team | Own | Own | Own |
| POCs | View | Edit | Edit | Edit | Create | Create | Create | View |
| Reports | All | Portfolio | Team | Team | Team | Own | Own | Own |
| Settings | Admin | Limited | Limited | No | No | No | No | No |

---

# Dashboard Personalization

The application should automatically detect the logged-in user's role and load the appropriate dashboard.

The sidebar should display only the pages the user is authorized to access.

Widgets should also change based on role.

Example

Director

Portfolio KPIs

Developer

Personal KPIs

Engineering Manager

Team KPIs

Tech Lead

Project KPIs

The user experience should feel personalized while maintaining a consistent design language.