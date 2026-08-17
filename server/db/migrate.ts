/**
 * One-shot migration: reads every src/data/*.json seed file and inserts it
 * into the SQLite database. Fails loudly (throws, non-zero exit) on any
 * referential-integrity problem or row-count mismatch — it never silently
 * drops or corrupts a row.
 *
 * Usage:
 *   npm run db:migrate          -- migrate into the existing DB file
 *   npm run db:reset            -- delete the DB file first, then migrate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, DB_PATH } from "./client.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../../src/data");

function readJson(file: string): any {
  // Strip a leading UTF-8 BOM — some Windows editors save JSON with one,
  // which JSON.parse otherwise rejects outright.
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8").replace(/^﻿/, "");
  return JSON.parse(raw);
}

function assertCount(label: string, expected: number, actual: number): void {
  if (expected !== actual) {
    throw new Error(`Migration integrity check failed: ${label} — expected ${expected} rows, got ${actual}`);
  }
}

/**
 * Re-syncs only the seed-controlled config tables (settings, roles,
 * permissions, resources, taskCategories, taskWorkflow) from their JSON
 * files, via upsert — never touches employees/projects/activities/learning/
 * pocs/calendarEvents/tasks, so nothing added through the app UI
 * is ever at risk. Only adds/updates rows found in the JSON; never deletes
 * a row that was removed from the seed (e.g. a custom role created via the
 * UI), so this is safe to run at any time.
 */
function syncConfigOnly(): void {
  const db = getDb();

  const roles = readJson("roles.json") as any[];
  const permissions = readJson("permissions.json") as any[];
  const resources = readJson("resources.json") as any[];
  const taskCategories = readJson("taskCategories.json") as any[];
  const taskWorkflow = readJson("taskWorkflow.json") as any[];
  const settings = readJson("settings.json") as Record<string, unknown>;

  const run = db.transaction(() => {
    const upsertRole = db.prepare(`
      INSERT INTO roles (id, name, description, is_system) VALUES (@id, @name, @description, @isSystem)
      ON CONFLICT(id) DO UPDATE SET name = @name, description = @description, is_system = @isSystem
    `);
    for (const r of roles) {
      upsertRole.run({ id: r.id, name: r.name, description: r.description ?? "", isSystem: r.isSystem ? 1 : 0 });
    }

    const upsertPermission = db.prepare(`
      INSERT INTO permissions (role_id, modules_json) VALUES (@roleId, @modulesJson)
      ON CONFLICT(role_id) DO UPDATE SET modules_json = @modulesJson
    `);
    for (const perm of permissions) {
      upsertPermission.run({ roleId: perm.roleId, modulesJson: JSON.stringify(perm.modules ?? []) });
    }

    const upsertResource = db.prepare(`
      INSERT INTO resources (id, label, path, description, actions_json, fields_json, scopable)
      VALUES (@id, @label, @path, @description, @actionsJson, @fieldsJson, @scopable)
      ON CONFLICT(id) DO UPDATE SET label = @label, path = @path, description = @description,
        actions_json = @actionsJson, fields_json = @fieldsJson, scopable = @scopable
    `);
    for (const r of resources) {
      upsertResource.run({
        id: r.id,
        label: r.label,
        path: r.path,
        description: r.description ?? "",
        actionsJson: JSON.stringify(r.actions ?? []),
        fieldsJson: JSON.stringify(r.fields ?? []),
        scopable: r.scopable ? 1 : 0,
      });
    }

    const upsertTaskCategory = db.prepare(`
      INSERT INTO task_categories (id, name, description) VALUES (@id, @name, @description)
      ON CONFLICT(id) DO UPDATE SET name = @name, description = @description
    `);
    for (const tc of taskCategories) {
      upsertTaskCategory.run({ id: tc.id, name: tc.name, description: tc.description ?? "" });
    }

    const upsertTaskWorkflow = db.prepare(`
      INSERT INTO task_workflow_statuses (id, name, color, "order", description, is_final_state, percent_complete)
      VALUES (@id, @name, @color, @order, @description, @isFinalState, @percentComplete)
      ON CONFLICT(id) DO UPDATE SET name = @name, color = @color, "order" = @order,
        description = @description, is_final_state = @isFinalState, percent_complete = @percentComplete
    `);
    for (const tw of taskWorkflow) {
      upsertTaskWorkflow.run({
        id: tw.id,
        name: tw.name,
        color: tw.color,
        order: tw.order,
        description: tw.description ?? "",
        isFinalState: tw.isFinalState ? 1 : 0,
        percentComplete: tw.percentComplete ?? 0,
      });
    }

    const upsertSetting = db.prepare(`
      INSERT INTO settings (key, value_json) VALUES (@key, @valueJson)
      ON CONFLICT(key) DO UPDATE SET value_json = @valueJson
    `);
    for (const [key, value] of Object.entries(settings)) {
      upsertSetting.run({ key, valueJson: JSON.stringify(value) });
    }
  });

  run();

  console.log("Config sync complete (roles, permissions, resources, taskCategories, taskWorkflow, settings) — employees/projects/activities/etc. untouched.");
}

function main(): void {
  if (process.argv.includes("--config-only")) {
    syncConfigOnly();
    return;
  }

  const reset = process.argv.includes("--reset");
  if (reset && fs.existsSync(DB_PATH)) {
    fs.rmSync(DB_PATH);
    console.log("Removed existing database (--reset).");
  }

  const db = getDb();

  const employees = readJson("employees.json") as any[];
  const projects = readJson("projects.json") as any[];
  const activities = readJson("activities.json") as any[];
  const learning = readJson("learning.json") as any[];
  const pocs = readJson("pocs.json") as any[];
  const calendarEvents = readJson("calendarEvents.json") as any[];
  const tasks = readJson("tasks.json") as any[];
  const taskCategories = readJson("taskCategories.json") as any[];
  const taskWorkflow = readJson("taskWorkflow.json") as any[];
  const users = readJson("users.json") as any[];
  const roles = readJson("roles.json") as any[];
  const permissions = readJson("permissions.json") as any[];
  const resources = readJson("resources.json") as any[];
  const settings = readJson("settings.json") as Record<string, unknown>;

  // ---- Referential-integrity pre-checks (fail before writing anything) ----
  const employeeIds = new Set(employees.map((e) => e.id));
  const projectIds = new Set(projects.map((p) => p.id));
  const roleIds = new Set(roles.map((r) => r.id));

  for (const e of employees) {
    if (e.managerId && !employeeIds.has(e.managerId)) {
      throw new Error(`employees.json: ${e.id} has managerId "${e.managerId}" which does not exist`);
    }
  }
  for (const p of projects) {
    for (const memberId of p.members ?? []) {
      if (!employeeIds.has(memberId)) {
        throw new Error(`projects.json: ${p.id} members references missing employeeId ${memberId}`);
      }
    }
  }
  for (const a of activities) {
    if (!employeeIds.has(a.employeeId)) throw new Error(`activities.json: ${a.id} references missing employeeId ${a.employeeId}`);
    if (!projectIds.has(a.projectId)) throw new Error(`activities.json: ${a.id} references missing projectId ${a.projectId}`);
  }
  for (const l of learning) {
    if (!employeeIds.has(l.employeeId)) throw new Error(`learning.json: ${l.id} references missing employeeId ${l.employeeId}`);
  }
  for (const p of pocs) {
    if (!employeeIds.has(p.ownerId)) throw new Error(`pocs.json: ${p.id} references missing ownerId ${p.ownerId}`);
    if (!projectIds.has(p.projectId)) throw new Error(`pocs.json: ${p.id} references missing projectId ${p.projectId}`);
    for (const memberId of p.team ?? []) {
      if (!employeeIds.has(memberId)) throw new Error(`pocs.json: ${p.id} team references missing employeeId ${memberId}`);
    }
  }
  for (const c of calendarEvents) {
    if (!employeeIds.has(c.employeeId)) throw new Error(`calendarEvents.json: ${c.id} references missing employeeId ${c.employeeId}`);
  }
  for (const t of tasks) {
    // assigneeId/reporterId are intentionally not checked against employeeIds — they can be ""
    // for Super Admin-originated tasks (no linked Employee), same as tasks.assignee_id/reporter_id
    // has no FK constraint in schema.sql.
    if (t.projectId && !projectIds.has(t.projectId)) throw new Error(`tasks.json: ${t.id} references missing projectId ${t.projectId}`);
  }
  for (const u of users) {
    if (u.employeeId && !employeeIds.has(u.employeeId)) throw new Error(`users.json: ${u.id} references missing employeeId ${u.employeeId}`);
    if (!roleIds.has(u.roleId)) throw new Error(`users.json: ${u.id} references missing roleId ${u.roleId}`);
  }
  for (const perm of permissions) {
    if (!roleIds.has(perm.roleId)) throw new Error(`permissions.json entry references missing roleId ${perm.roleId}`);
  }

  // ---- Insert everything in one transaction ----
  const run = db.transaction(() => {
    const insertEmployee = db.prepare(`
      INSERT INTO employees (id, name, email, role, experience, team, skills_json, projects_json, profile_image, status, manager_id, leader_id, business_unit, tech_non_tech)
      VALUES (@id, @name, @email, @role, @experience, @team, @skillsJson, @projectsJson, @profileImage, @status, @managerId, @leaderId, @businessUnit, @techNonTech)
    `);
    for (const e of employees) {
      insertEmployee.run({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        experience: e.experience,
        team: e.team,
        skillsJson: JSON.stringify(e.skills ?? []),
        projectsJson: JSON.stringify(e.projects ?? []),
        profileImage: e.profileImage ?? "",
        status: e.status,
        managerId: e.managerId ?? null,
        leaderId: e.leaderId ?? null,
        businessUnit: e.businessUnit ?? "",
        techNonTech: e.techNonTech ?? "Tech",
      });
    }

    const insertProject = db.prepare(`
      INSERT INTO projects (id, name, client, program, manager, tech_lead, project_manager, technology_json, stage, status, ai_adoption, ai_adoption_categories_json, members_json, start_date, end_date)
      VALUES (@id, @name, @client, @program, @manager, @techLead, @projectManager, @technologyJson, @stage, @status, @aiAdoption, @aiAdoptionCategoriesJson, @membersJson, @startDate, @endDate)
    `);
    for (const p of projects) {
      insertProject.run({
        id: p.id,
        name: p.name,
        client: p.client ?? "",
        program: p.program ?? "",
        manager: p.manager ?? "",
        techLead: p.techLead ?? "",
        projectManager: p.projectManager ?? "",
        technologyJson: JSON.stringify(p.technology ?? []),
        stage: p.stage,
        status: p.status,
        aiAdoption: p.aiAdoption ?? 0,
        aiAdoptionCategoriesJson: JSON.stringify(p.aiAdoptionCategories ?? []),
        membersJson: JSON.stringify(p.members ?? []),
        startDate: p.startDate ?? "",
        endDate: p.endDate ?? "",
      });
    }

    const insertActivity = db.prepare(`
      INSERT INTO activities (id, employee_id, project_id, date, tool, category, project_stage, prompt_summary, outcome, hours_saved, impact, attachment)
      VALUES (@id, @employeeId, @projectId, @date, @tool, @category, @projectStage, @promptSummary, @outcome, @hoursSaved, @impact, @attachment)
    `);
    for (const a of activities) {
      insertActivity.run({
        id: a.id,
        employeeId: a.employeeId,
        projectId: a.projectId,
        date: a.date,
        tool: a.tool,
        category: a.category,
        projectStage: a.projectStage,
        promptSummary: a.promptSummary ?? "",
        outcome: a.outcome ?? "",
        hoursSaved: a.hoursSaved ?? 0,
        impact: a.impact,
        attachment: a.attachment ?? "",
      });
    }

    const insertLearning = db.prepare(`
      INSERT INTO learning (id, employee_id, course, platform, status, progress, hours, certificate, completion_date, program_coordinator, minutes_completed)
      VALUES (@id, @employeeId, @course, @platform, @status, @progress, @hours, @certificate, @completionDate, @programCoordinator, @minutesCompleted)
    `);
    for (const l of learning) {
      insertLearning.run({
        id: l.id,
        employeeId: l.employeeId,
        course: l.course,
        platform: l.platform,
        status: l.status,
        progress: l.progress ?? 0,
        hours: l.hours ?? 0,
        certificate: l.certificate ?? "",
        completionDate: l.completionDate ?? "",
        programCoordinator: l.programCoordinator ?? "",
        minutesCompleted: l.minutesCompleted ?? 0,
      });
    }

    const insertPoc = db.prepare(`
      INSERT INTO pocs (id, title, owner_id, team_json, project_id, category, description, status, business_value, hours_saved, repo, demo, start_date, end_date, start_time, hours_per_day, block_group_id)
      VALUES (@id, @title, @ownerId, @teamJson, @projectId, @category, @description, @status, @businessValue, @hoursSaved, @repo, @demo, @startDate, @endDate, @startTime, @hoursPerDay, @blockGroupId)
    `);
    for (const p of pocs) {
      insertPoc.run({
        id: p.id,
        title: p.title,
        ownerId: p.ownerId,
        teamJson: JSON.stringify(p.team ?? []),
        projectId: p.projectId,
        category: p.category,
        description: p.description ?? "",
        status: p.status,
        businessValue: p.businessValue ?? "",
        hoursSaved: p.hoursSaved ?? 0,
        repo: p.repo ?? "",
        demo: p.demo ?? "",
        startDate: p.startDate ?? "",
        endDate: p.endDate ?? "",
        startTime: p.startTime ?? "",
        hoursPerDay: p.hoursPerDay ?? 0,
        blockGroupId: p.blockGroupId ?? null,
      });
    }

    const insertCalendarEvent = db.prepare(`
      INSERT INTO calendar_events (id, employee_id, title, description, event_type, start, end, time_zone, organizer, attendees_json, location, outlook_event_id, created_by, linked_task_id, linked_poc_id, linked_project_id, block_group_id)
      VALUES (@id, @employeeId, @title, @description, @eventType, @start, @end, @timeZone, @organizer, @attendeesJson, @location, @outlookEventId, @createdBy, @linkedTaskId, @linkedPocId, @linkedProjectId, @blockGroupId)
    `);
    for (const c of calendarEvents) {
      insertCalendarEvent.run({
        id: c.id,
        employeeId: c.employeeId,
        title: c.title ?? "",
        description: c.description ?? "",
        eventType: c.eventType,
        start: c.start,
        end: c.end,
        timeZone: c.timeZone ?? "",
        organizer: c.organizer ?? "",
        attendeesJson: JSON.stringify(c.attendees ?? []),
        location: c.location ?? "",
        outlookEventId: c.outlookEventId ?? null,
        createdBy: c.createdBy,
        linkedTaskId: c.linkedTaskId ?? null,
        linkedPocId: c.linkedPocId ?? null,
        linkedProjectId: c.linkedProjectId ?? null,
        blockGroupId: c.blockGroupId ?? null,
      });
    }

    const insertTaskCategory = db.prepare(`
      INSERT INTO task_categories (id, name, description) VALUES (@id, @name, @description)
    `);
    for (const tc of taskCategories) {
      insertTaskCategory.run({ id: tc.id, name: tc.name, description: tc.description ?? "" });
    }

    const insertTaskWorkflow = db.prepare(`
      INSERT INTO task_workflow_statuses (id, name, color, "order", description, is_final_state, percent_complete)
      VALUES (@id, @name, @color, @order, @description, @isFinalState, @percentComplete)
    `);
    for (const tw of taskWorkflow) {
      insertTaskWorkflow.run({
        id: tw.id,
        name: tw.name,
        color: tw.color,
        order: tw.order,
        description: tw.description ?? "",
        isFinalState: tw.isFinalState ? 1 : 0,
        percentComplete: tw.percentComplete ?? 0,
      });
    }

    const insertTask = db.prepare(`
      INSERT INTO tasks (id, task_number, title, description, type, category, project_id, assignee_id, reporter_id, created_by, last_modified_by, priority, status, estimate_hours, actual_hours, percent_complete, start_date, due_date, completed_date, display_order, labels_json, ai_tool, linked_activity_id, linked_poc_id, linked_calendar_event_id, comments_json, attachments_json, archived, created_date, updated_date)
      VALUES (@id, @taskNumber, @title, @description, @type, @category, @projectId, @assigneeId, @reporterId, @createdBy, @lastModifiedBy, @priority, @status, @estimateHours, @actualHours, @percentComplete, @startDate, @dueDate, @completedDate, @displayOrder, @labelsJson, @aiTool, @linkedActivityId, @linkedPocId, @linkedCalendarEventId, @commentsJson, @attachmentsJson, @archived, @createdDate, @updatedDate)
    `);
    for (const t of tasks) {
      insertTask.run({
        id: t.id,
        taskNumber: t.taskNumber,
        title: t.title,
        description: t.description ?? "",
        type: t.type,
        category: t.category ?? "",
        projectId: t.projectId ?? null,
        assigneeId: t.assigneeId,
        reporterId: t.reporterId,
        createdBy: t.createdBy,
        lastModifiedBy: t.lastModifiedBy,
        priority: t.priority,
        status: t.status,
        estimateHours: t.estimateHours ?? 0,
        actualHours: t.actualHours ?? 0,
        percentComplete: t.percentComplete ?? 0,
        startDate: t.startDate ?? "",
        dueDate: t.dueDate ?? "",
        completedDate: t.completedDate ?? "",
        displayOrder: t.displayOrder ?? 0,
        labelsJson: JSON.stringify(t.labels ?? []),
        aiTool: t.aiTool ?? "",
        linkedActivityId: t.linkedActivityId ?? "",
        linkedPocId: t.linkedPocId ?? "",
        linkedCalendarEventId: t.linkedCalendarEventId ?? null,
        commentsJson: JSON.stringify(t.comments ?? []),
        attachmentsJson: JSON.stringify(t.attachments ?? []),
        archived: t.archived ? 1 : 0,
        createdDate: t.createdDate,
        updatedDate: t.updatedDate,
      });
    }

    const insertRole = db.prepare(`
      INSERT INTO roles (id, name, description, is_system) VALUES (@id, @name, @description, @isSystem)
    `);
    for (const r of roles) {
      insertRole.run({ id: r.id, name: r.name, description: r.description ?? "", isSystem: r.isSystem ? 1 : 0 });
    }

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, role_id, employee_id, status)
      VALUES (@id, @username, @password, @roleId, @employeeId, @status)
    `);
    for (const u of users) {
      insertUser.run({
        id: u.id,
        username: u.username,
        password: u.password,
        roleId: u.roleId,
        employeeId: u.employeeId || null,
        status: u.status,
      });
    }

    const insertPermission = db.prepare(`
      INSERT INTO permissions (role_id, modules_json) VALUES (@roleId, @modulesJson)
    `);
    for (const perm of permissions) {
      insertPermission.run({ roleId: perm.roleId, modulesJson: JSON.stringify(perm.modules ?? []) });
    }

    const insertResource = db.prepare(`
      INSERT INTO resources (id, label, path, description, actions_json, fields_json, scopable)
      VALUES (@id, @label, @path, @description, @actionsJson, @fieldsJson, @scopable)
    `);
    for (const r of resources) {
      insertResource.run({
        id: r.id,
        label: r.label,
        path: r.path,
        description: r.description ?? "",
        actionsJson: JSON.stringify(r.actions ?? []),
        fieldsJson: JSON.stringify(r.fields ?? []),
        scopable: r.scopable ? 1 : 0,
      });
    }

    const insertSetting = db.prepare(`
      INSERT INTO settings (key, value_json) VALUES (@key, @valueJson)
    `);
    for (const [key, value] of Object.entries(settings)) {
      insertSetting.run({ key, valueJson: JSON.stringify(value) });
    }
  });

  run();

  // ---- Post-insert row-count validation ----
  const count = (table: string): number => (db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;

  assertCount("employees", employees.length, count("employees"));
  assertCount("projects", projects.length, count("projects"));
  assertCount("activities", activities.length, count("activities"));
  assertCount("learning", learning.length, count("learning"));
  assertCount("pocs", pocs.length, count("pocs"));
  assertCount("calendar_events", calendarEvents.length, count("calendar_events"));
  assertCount("task_categories", taskCategories.length, count("task_categories"));
  assertCount("task_workflow_statuses", taskWorkflow.length, count("task_workflow_statuses"));
  assertCount("tasks", tasks.length, count("tasks"));
  assertCount("roles", roles.length, count("roles"));
  assertCount("users", users.length, count("users"));
  assertCount("permissions", permissions.length, count("permissions"));
  assertCount("resources", resources.length, count("resources"));
  assertCount("settings", Object.keys(settings).length, count("settings"));

  console.log("Migration complete. Row counts:");
  console.table({
    employees: count("employees"),
    projects: count("projects"),
    activities: count("activities"),
    learning: count("learning"),
    pocs: count("pocs"),
    calendar_events: count("calendar_events"),
    task_categories: count("task_categories"),
    task_workflow_statuses: count("task_workflow_statuses"),
    tasks: count("tasks"),
    roles: count("roles"),
    users: count("users"),
    permissions: count("permissions"),
    resources: count("resources"),
    settings: count("settings"),
  });
}

main();
