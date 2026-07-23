# 03_UI_WIREFRAMES.md

# AI Portfolio Dashboard

Version 1.0

---

# Design Philosophy

The application should have a clean, modern dashboard UI inspired by:

- Microsoft Fluent UI
- Atlassian
- GitHub
- Linear
- shadcn/ui

The interface should be minimal, responsive, and easy to use.

Primary Color
Blue

Secondary Color
Indigo

Accent
Purple

Cards should have rounded corners with subtle shadows.

Use light mode by default with future support for dark mode.

---

# Application Layout

+------------------------------------------------------+
| Top Navigation                                        |
+---------+--------------------------------------------+
| Sidebar |                                            |
|         |                                            |
|         |            Page Content                    |
|         |                                            |
|         |                                            |
+---------+--------------------------------------------+

Sidebar Width

260px

Top Navbar Height

70px

---

# Sidebar Menu

Dashboard

Projects

AI Activities

People

Learning

POCs

Reports

Settings

At the bottom

User Profile

Theme Toggle (Future)

Logout

---

# Top Navigation

Contains

Application Logo

Search Box

Notifications Icon

Current User

Role Badge

Current Date

---

# Dashboard

Purpose

Executive Overview

Layout

------------------------------------------------------------
Top KPI Cards
------------------------------------------------------------

[ Employees ]

[ Projects ]

[ AI Adoption ]

[ Hours Saved ]

------------------------------------------------------------

Second Row

------------------------------------------------------------

AI Activities Trend (Line Chart)

Project Status (Donut Chart)

------------------------------------------------------------

Third Row

------------------------------------------------------------

AI Tool Usage (Bar Chart)

Learning Progress (Progress Cards)

------------------------------------------------------------

Fourth Row

------------------------------------------------------------

Recent Activities

Top Contributors

------------------------------------------------------------

Quick Actions

+ Add Activity

+ Add Project

+ Add POC

+ Add Employee

---

# Projects Page

Top Section

Project Search

Status Filter

Stage Filter

Technology Filter

Add Project Button

------------------------------------------------------------

Project Cards

------------------------------------------------------------

Project Name

Client

Current Stage

AI Adoption %

Progress Bar

Technology

Manager

Tech Lead

Members Count

Status Badge

View Details Button

------------------------------------------------------------

Project Details Drawer

Contains

Project Information

Assigned Team

AI Activities

Current Stage

POCs

Learning Summary

---

# AI Activities Page

Top

Search

Date Filter

Employee Filter

Project Filter

AI Tool Filter

Category Filter

Add Activity Button

------------------------------------------------------------

Activity Table

Columns

Date

Employee

Project

Tool

Category

Project Stage

Hours Saved

Impact

Actions

------------------------------------------------------------

Add Activity Form

Employee

Project

Tool

Category

Project Stage

Prompt Summary

Outcome

Hours Saved

Impact

Attachment

Save Button

Cancel Button

---

# People Page

Top

Search Employee

Role Filter

Technology Filter

Add Employee Button

------------------------------------------------------------

Employee Cards

Profile Picture

Name

Role

Experience

Project

Primary Skill

Learning %

AI Activities

POCs

View Profile

------------------------------------------------------------

Employee Profile

Tabs

Overview

Skills

Learning

AI Activities

POCs

Statistics

---

# Skill Matrix Page

Top

Search

Technology Filter

Skill Filter

Export Button

------------------------------------------------------------

Table Layout

Employee

Magento

PHP

React

GraphQL

Git

Claude

ChatGPT

Prompt Engineering

Each Skill

Color Badge

Beginner

Yellow

Intermediate

Blue

Advanced

Green

Expert

Purple

---

# Learning Page

Top

Platform Filter

Status Filter

Employee Filter

------------------------------------------------------------

Learning Cards

Course

Platform

Progress Bar

Status

Hours

Certificate

Completed Date

------------------------------------------------------------

Statistics

Completion %

Courses Completed

Hours Learned

Leaderboard

---

# POCs Page

Top

Status Filter

Owner Filter

Category Filter

Add POC Button

------------------------------------------------------------

POC Cards

Title

Owner

Project

Status

Business Value

Hours Saved

Category

Demo Link

Repository

View Details

------------------------------------------------------------

POC Details

Overview

Documents

Screenshots

Links

Comments

---

# Reports Page

Top

Report Type

Date Range

Project Filter

Generate Report Button

------------------------------------------------------------

Available Reports

Weekly Summary

Monthly Summary

Project Summary

Learning Progress

AI Activities

Skill Matrix

POCs

------------------------------------------------------------

Export Buttons

Excel

PDF

CSV

---

# Settings Page

Simple List Layout

Sections

Roles

Skills

AI Tools

Learning Platforms

Project Stages

Categories

Each Section

Table

Add

Edit

Delete

---

# Global Search

Available on every page.

Should search

Projects

Employees

Activities

POCs

Learning

---

# Notifications

Notification Bell

Dropdown

Latest Activities

Learning Completed

New POC

Project Updated

---

# Common Components

Use reusable components.

KPI Card

Chart Card

Progress Card

Info Card

Statistics Card

Status Badge

Avatar Group

Search Box

Filter Dropdown

Data Table

Confirmation Dialog

Drawer

Modal

Toast Notification

---

# Empty States

Every page should display friendly messages.

Example

"No AI Activities Found"

"No Projects Available"

"No Learning Records"

Include an illustration with a CTA button.

---

# Loading State

Use Skeleton Loaders.

Never show blank pages.

---

# Responsive Design

Desktop

Primary Layout

Laptop

Two-column layout

Tablet

Collapsible Sidebar

Mobile

Stacked Cards

Bottom Navigation (Future)

---

# UI Principles

Minimal clicks

Easy navigation

Fast filtering

Readable charts

Consistent colors

Reusable components

No clutter

Simple forms

Professional appearance

Suitable for leadership presentations