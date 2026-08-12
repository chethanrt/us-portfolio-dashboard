# 08_VALIDATION_RULES.md

# AI Portfolio Dashboard

## Validation & Business Rules

Version 1.0

---

# Purpose

This document defines all validation rules, business rules, and data integrity constraints used throughout the application.

All forms must use

- React Hook Form
- Zod Validation

Validation messages should be clear, user-friendly, and consistent.

---

# General Rules

Every form should:

✔ Validate before saving

✔ Highlight invalid fields

✔ Display inline validation messages

✔ Prevent duplicate submissions

✔ Disable Save button while saving

✔ Show success or error toast

---

# Required Field Indicator

All mandatory fields should display

*

Example

Project Name *

Employee *

Role *

---

# Text Field Rules

Trim leading/trailing spaces.

Do not allow only spaces.

Maximum length should be enforced.

Prevent HTML/script injection.

---

# Email Validation

Rules

✔ Valid email format

✔ Lowercase

✔ No duplicate email

Example

john.doe@company.com

Invalid

john

john@

abc.com

Validation Message

"Please enter a valid email address."

---

# URL Validation

Repository URL

Demo URL

Documentation URL

Rules

Must begin with

https://

or

http://

Validation Message

"Please enter a valid URL."

---

# Number Validation

Allow numbers only.

No alphabetic characters.

No special characters except decimal point.

---

# Percentage Validation

Used For

AI Adoption %

Learning Progress %

Rules

Minimum

0

Maximum

100

Validation Message

"Value must be between 0 and 100."

---

# Date Validation

Rules

Start Date cannot be empty.

End Date must be after Start Date.

Completion Date cannot be in the future.

Activity Date cannot be greater than today.

Validation Message

"End Date must be after Start Date."

---

# Dropdown Validation

All required dropdowns must have a selected value.

Default

Select...

Cannot save if unchanged.

---

# Multi Select Validation

At least one option required when mandatory.

Example

Technology

Team Members

---

# File Upload Validation

Supported Types

PDF

PNG

JPG

JPEG

DOCX

Maximum Size

10 MB

Validation Message

"Invalid file type or file exceeds maximum size."

---

# Duplicate Validation

Do not allow duplicate

Employee Email

Project Name

Course Name (for same employee)

POC Title (within same project)

Settings values

---

# Employee Validation

Required

Name

Email

Role

Experience

Primary Skill

Rules

Experience

Minimum

0

Maximum

40

Name

Minimum 3 characters

Maximum 80 characters

Email must be unique.

Employee ID should be auto-generated.

---

# Project Validation

Required

Project Name

Client

Technology

Stage

Status

Engineering Manager

Start Date

Rules

AI Adoption %

0 - 100

Project Name

Unique

End Date

After Start Date

At least one Team Member

Validation Message

"Please assign at least one team member."

---

# AI Activity Validation

Required

Employee

Project

Date

AI Tool

Activity Type

Prompt Summary

Outcome

Hours Saved

Rules

Hours Saved

Minimum

0

Maximum

100

Prompt Summary

Maximum

1000 characters

Outcome

Maximum

2000 characters

Activity Date

Cannot be future date.

---

# Learning Validation

Required

Employee

Course

Platform

Status

Completion %

Rules

Completion %

0 - 100

Completion Date

Only required when Status = Completed

Certificate

Optional

Hours

Positive number

---

# POC Validation

Required

Title

Owner

Project

Description

Business Value

Category

Status

Start Date

End Date

Start Time

Hours per Day

Rules

Title

Unique within project

Owner

Restricted to Director, Delivery Manager, Engineering Manager, Senior Tech
Lead, Tech Lead

Team

Optional. Restricted to Senior Developer, Developer, Intern

End Date

Must be on or after Start Date; range capped at 120 days

Hours per Day

Between 0.5 and 12

Schedule conflict

Hard block — save is refused if the Owner or any Team member already has an
overlapping Team Calendar event for the given date range/time/hours

Repository URL

Optional

Demo URL

Optional

Hours Saved

Positive number

---

# Settings Validation

Skills

Unique

Roles

Unique

AI Tools

Unique

Project Stages

Unique

Categories

Unique

---

# Search Validation

Search should

Ignore Case

Ignore Leading Spaces

Search partial words

Support multiple keywords

---

# Delete Validation

Before deleting

Show confirmation dialog.

Message

"Are you sure you want to delete this record?"

Buttons

Cancel

Delete

---

# Save Validation

Disable Save button while processing.

Prevent multiple clicks.

Show spinner.

---

# Success Messages

Project created successfully.

Project updated successfully.

Employee created successfully.

Activity logged successfully.

Learning updated successfully.

POC created successfully.

Settings updated successfully.

---

# Error Messages

Required Field

"This field is required."

Email

"Please enter a valid email."

Date

"Invalid date."

Percentage

"Value must be between 0 and 100."

Duplicate

"This record already exists."

File Upload

"Unsupported file."

Network

"Unable to save. Please try again."

---

# Role-Based Validation

Director

Read Only

Delivery Manager

Can edit Projects

Engineering Manager

Can edit Team

Tech Lead

Can edit Team Activities

Developer

Own Data Only

Intern

Own Learning & Activities Only

---

# Business Rules

Projects

Must always have an Engineering Manager.

Must have at least one Tech Lead.

Should have at least one Team Member.

Activities

Must belong to one Project.

Must belong to one Employee.

Must reference one AI Tool.

Learning

Belongs to one Employee.

POC

Must belong to one Project.

Must have one Owner.

---

# Future Validation

When backend is introduced

Server-side validation

Duplicate checking

Authentication

Authorization

Audit logs

API validation

should be added.

Frontend validation should remain unchanged.