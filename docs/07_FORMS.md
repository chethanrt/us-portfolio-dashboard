# 07_FORMS.md

# AI Portfolio Dashboard

## Form Specifications

Version 1.0

---

# Purpose

This document defines every Add/Edit form in the application.

All forms should:

✔ Use React Hook Form

✔ Use Zod Validation

✔ Use shadcn/ui components

✔ Display validation messages

✔ Be responsive

✔ Support Add & Edit modes

✔ Use reusable form components

---

# Form Layout

Every form should follow the same layout.

-----------------------------------------------------

Header

-----------------------------------------------------

Form Fields

-----------------------------------------------------

Action Buttons

Cancel

Save

-----------------------------------------------------

Maximum Width

900px

Use

2-column layout on Desktop

1-column on Mobile

---

# Common Buttons

Primary

Save

Secondary

Cancel

Danger

Delete

Outline

Reset

---

# Common Components

TextBox

TextArea

Select

Multi Select

Checkbox

Radio Button

Switch

Date Picker

Number Input

File Upload

Tags Input

---

# PROJECT FORM

Purpose

Create or Edit Project

Fields

Project Name *

Text

Maximum 100 characters

------------------------------------------------

Client *

Text

------------------------------------------------

Project Type *

Dropdown

Magento

Adobe Commerce

CMS

Marketing

Internal

Other

------------------------------------------------

Technology *

Multi Select

Magento

PHP

React

JavaScript

GraphQL

Docker

Redis

MySQL

CMS

------------------------------------------------

Project Stage *

Dropdown

Discovery

Requirement Gathering

Estimation

Development

Testing

Documentation

Deployment

Support

------------------------------------------------

Status *

Dropdown

Planning

Active

On Hold

Completed

Cancelled

------------------------------------------------

Engineering Manager *

Dropdown

Employee List

------------------------------------------------

Tech Lead *

Dropdown

Employee List

------------------------------------------------

Start Date *

Date

------------------------------------------------

End Date

Date

------------------------------------------------

AI Adoption %

Slider

0-100

------------------------------------------------

Description

Text Area

500 Characters

------------------------------------------------

Team Members

Multi Select

Employee List

------------------------------------------------

Buttons

Cancel

Save

---

# EMPLOYEE FORM

Purpose

Create/Edit Employee

Fields

Employee ID

Auto Generated

------------------------------------------------

Name *

------------------------------------------------

Email *

------------------------------------------------

Role *

Director

Delivery Manager

Engineering Manager

Senior Tech Lead

Tech Lead

Senior Developer

Developer

Intern

------------------------------------------------

Experience *

Number

------------------------------------------------

Primary Skill *

------------------------------------------------

Secondary Skill

------------------------------------------------

Projects

Multi-select checkbox list (an employee may belong to zero or more
projects; kept in sync automatically with each project's team membership)

------------------------------------------------

Manager

Dropdown

------------------------------------------------

Status

Active

Inactive

On Leave

------------------------------------------------

Profile Photo

Upload

------------------------------------------------

Buttons

Cancel

Save

---

# AI ACTIVITY FORM

Purpose

Log AI Usage

Fields

Employee *

Dropdown

------------------------------------------------

Project *

Dropdown

------------------------------------------------

Date *

Date

------------------------------------------------

AI Tool *

Claude

ChatGPT

Cursor

Copilot

Gemini

Perplexity

------------------------------------------------

Activity Type *

Development

Testing

Documentation

Research

Marketing

CMS

Estimation

Innovation

POC

------------------------------------------------

Project Stage *

------------------------------------------------

Prompt Summary *

Text Area

------------------------------------------------

Outcome *

Text Area

------------------------------------------------

Hours Saved *

Number

------------------------------------------------

Impact *

Low

Medium

High

------------------------------------------------

Attachment

Upload

------------------------------------------------

Buttons

Cancel

Save

---

# LEARNING FORM

Purpose

Track AI Learning

Fields

Employee *

------------------------------------------------

Platform *

Udemy AI Lab

Internal

Other

------------------------------------------------

Course *

------------------------------------------------

Status *

Not Started

In Progress

Completed

------------------------------------------------

Completion %

Slider

------------------------------------------------

Hours

------------------------------------------------

Completion Date

------------------------------------------------

Certificate

Upload

------------------------------------------------

Buttons

Cancel

Save

---

# POC FORM

Purpose

Create Innovation

Fields

Title *

------------------------------------------------

Project *

------------------------------------------------

Owner *

Restricted to Director, Delivery Manager, Engineering Manager, Senior Tech Lead, Tech Lead.

------------------------------------------------

Team

Multi-select. Restricted to Senior Developer, Developer, Intern.

------------------------------------------------

Category *

Automation

Documentation

CMS

Marketing

Testing

Development

Other

------------------------------------------------

Description *

------------------------------------------------

Business Value *

------------------------------------------------

Hours Saved

------------------------------------------------

Repository URL

------------------------------------------------

Demo URL

------------------------------------------------

Status *

Idea

In Progress

Completed

On Hold

------------------------------------------------

Start Date *

------------------------------------------------

End Date *

Must be on or after Start Date. Range capped at 120 days.

------------------------------------------------

Start Time *

------------------------------------------------

Hours per Day *

0.5–12. Blocks the owner's and team's Team Calendar for this many hours,
starting at Start Time, on every day from Start Date to End Date. Save is
blocked if anyone involved already has a conflicting calendar event.

------------------------------------------------

Attachments

------------------------------------------------

Buttons

Cancel

Save

---

# SETTINGS FORM

Forms

Manage Skills

Manage Roles

Manage AI Tools

Manage Technologies

Manage Categories

Manage Project Stages

Every form contains

Name

Description

Status

Buttons

Cancel

Save

---

# SEARCH & FILTER FORM

Every module should have

Search Box

Filter

Reset Filter

Export (Future)

---

# DELETE CONFIRMATION

Dialog

Title

Delete Confirmation

Message

Are you sure you want to delete this record?

Buttons

Cancel

Delete

---

# SUCCESS MESSAGE

Project saved successfully.

Employee updated successfully.

Activity logged successfully.

POC created successfully.

Learning record updated successfully.

---

# ERROR MESSAGE

Unable to save.

Please verify the required fields.

Try again later.

---

# RESPONSIVE RULES

Desktop

2-column

Laptop

2-column

Tablet

Single Column

Mobile

Single Column

Buttons Full Width

---

# FORM DESIGN PRINCIPLES

Simple

Professional

Consistent

Minimal

Fast

Accessible

Reusable