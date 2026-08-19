# Database Design (JSON Based)

Version 1.0

---

# Overview

This application uses JSON files as the data source.

Each module maintains its own JSON file.

Advantages

- Easy to edit
- No backend required
- Perfect for internal dashboard
- Easy migration to API later

---

# Data Files

data/

employees.json

projects.json

activities.json

skills.json

learning.json

pocs.json

settings.json

---

# Employee

File

employees.json

Structure

{
"id":"",
"name":"",
"email":"",
"role":"",
"experience":0,
"team":"",
"primarySkill":"",
"secondarySkill":"",
"projects":[],
"profileImage":"",
"status":"Active",
"managerId":null
}

status is one of Active, Inactive, Ex-Employee. Employees are never deleted
from this file — removing one sets status to Ex-Employee instead, so
activities.json/pocs.json/learning.json relations stay valid.

managerId is the id of the employee this person reports to, or null at the
top of the hierarchy (e.g. Director). Nobody's managerId may point at an
Ex-Employee — offboarding an employee reassigns their direct reports first.

projects is an array of project names (free text, matches projects.json's
name field — not a foreign key) an employee is currently assigned to. It is
kept in sync automatically with each project's members list: adding someone
to a Project's team assigns the project to them here too, and removing them
from the team removes it. It can also be edited directly from the People
form for assignments that don't go through a formal project team.

Example

{
"id":"EMP001",
"name":"John Doe",
"email":"john@company.com",
"role":"Tech Lead",
"experience":9,
"team":"Magento",
"primarySkill":"Magento",
"secondarySkill":"React",
"projects":["Project Phoenix"],
"profileImage":"john.png",
"status":"Active",
"managerId":"EMP004"
}

---

# Projects

projects.json

Structure

{
"id":"",
"name":"",
"client":"",
"manager":"",
"techLead":"",
"technology":"",
"stage":"",
"status":"",
"aiAdoption":0,
"members":[]
}

Example

{
"id":"P001",
"name":"Phoenix",
"client":"ABC Retail",
"manager":"Priya",
"techLead":"John",
"technology":"Magento",
"stage":"Development",
"status":"Active",
"aiAdoption":72,
"members":[
"EMP001",
"EMP004",
"EMP009"
]
}

---

# AI Activities

activities.json

Structure

{
"id":"",
"employeeId":"",
"projectId":"",
"date":"",
"tool":"",
"category":"",
"projectStage":"",
"promptSummary":"",
"outcome":"",
"hoursSaved":0,
"impact":"",
"attachment":""
}

Example

{
"id":"ACT001",
"employeeId":"EMP001",
"projectId":"P001",
"date":"2026-07-15",
"tool":"Claude",
"category":"Documentation",
"projectStage":"Development",
"promptSummary":"Generate API documentation",
"outcome":"Completed",
"hoursSaved":3.5,
"impact":"High",
"attachment":""
}

---

# Skills

skills.json

Structure

{
"employeeId":"",
"Magento":"Advanced",
"PHP":"Expert",
"MySQL":"Advanced",
"React":"Intermediate",
"GraphQL":"Intermediate",
"Docker":"Beginner",
"Git":"Expert",
"Claude":"Advanced",
"ChatGPT":"Expert",
"PromptEngineering":"Advanced"
}

Skill Levels

Beginner

Intermediate

Advanced

Expert

---

# Learning

learning.json

Structure

{
"id":"",
"employeeId":"",
"course":"",
"platform":"",
"status":"",
"progress":0,
"hours":0,
"certificate":""
}

Example

{
"id":"L001",
"employeeId":"EMP001",
"course":"Prompt Engineering",
"platform":"Udemy AI Lab",
"status":"Completed",
"progress":100,
"hours":8,
"certificate":"certificate.pdf"
}

---

# POCs

pocs.json

Structure

{
"id":"",
"title":"",
"ownerId":"",
"team":[],
"projectId":"",
"category":"",
"description":"",
"status":"",
"businessValue":"",
"hoursSaved":0,
"repo":"",
"demo":"",
"startDate":"",
"endDate":"",
"startTime":"",
"hoursPerDay":0,
"blockGroupId":null
}

Example

{
"id":"POC001",
"title":"AI Documentation Generator",
"ownerId":"EMP001",
"team":["EMP005","EMP009"],
"projectId":"P001",
"category":"Documentation",
"description":"Generate project documentation using Claude",
"status":"Completed",
"businessValue":"Reduced documentation effort",
"hoursSaved":42,
"repo":"https://github...",
"demo":"https://...",
"startDate":"2026-01-05",
"endDate":"2026-01-16",
"startTime":"09:00",
"hoursPerDay":2,
"blockGroupId":"a1b2c3d4-..."
}

---

# Settings

settings.json

Contains

Roles

Skills

Project Stages

AI Tools

Learning Platforms

Activity Types

Impact Levels

Status Values

---

# Relationships

Employee

↓

Projects

↓

AI Activities

↓

POCs

↓

Learning

Every Activity belongs to

One Employee

One Project

One Stage

One AI Tool

---

# ID Naming Convention

Employees

EMP001

Projects

P001

Activities

ACT001

POCs

POC001

Learning

LRN001

---

# Future Migration

The JSON structure should be designed so it can later migrate directly to:

- SQLite

- PostgreSQL

- MongoDB

without changing the frontend.