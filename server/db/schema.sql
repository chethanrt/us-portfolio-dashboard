-- AI Portfolio Dashboard — SQLite schema.
--
-- One table per src/data/*.json file. Scalar fields are real columns;
-- array/nested-object fields with no relational query pattern today
-- (technology, members, team, attendees, labels, comments, attachments,
-- permission modules, settings lists) are kept as a single JSON TEXT
-- column, parsed/stringified only at the API boundary — this preserves the
-- exact shapes src/types/index.ts already defines without redesigning the
-- data model. Enum-like fields (status, stage, role, ...) are validated in
-- the app layer, same as today, not via CHECK constraints, since several
-- of those lists (roles, technicalSkills, projectStages, aiTools, ...) are
-- user-editable at runtime via Settings.

PRAGMA foreign_keys = ON;

-- Reference / config entities -------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_system INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS permissions (
  role_id TEXT PRIMARY KEY REFERENCES roles(id),
  modules_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  actions_json TEXT NOT NULL DEFAULT '[]',
  fields_json TEXT NOT NULL DEFAULT '[]',
  scopable INTEGER NOT NULL DEFAULT 0
);

-- One row per top-level AppSettings key (roles, technicalSkills, ...,
-- statusValues) — mirrors SettingsService.updateList(key, values) exactly.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS task_workflow_statuses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_final_state INTEGER NOT NULL DEFAULT 0,
  percent_complete INTEGER NOT NULL DEFAULT 0
);

-- Core entities ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  experience INTEGER NOT NULL DEFAULT 0,
  team TEXT NOT NULL DEFAULT '',
  skills_json TEXT NOT NULL DEFAULT '[]',
  projects_json TEXT NOT NULL DEFAULT '[]',
  profile_image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  manager_id TEXT REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id),
  employee_id TEXT REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT NOT NULL DEFAULT '',
  program TEXT NOT NULL DEFAULT '',
  manager TEXT NOT NULL DEFAULT '',
  tech_lead TEXT NOT NULL DEFAULT '',
  project_manager TEXT NOT NULL DEFAULT '',
  technology_json TEXT NOT NULL DEFAULT '[]',
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  ai_adoption INTEGER NOT NULL DEFAULT 0,
  members_json TEXT NOT NULL DEFAULT '[]',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  date TEXT NOT NULL,
  tool TEXT NOT NULL,
  category TEXT NOT NULL,
  project_stage TEXT NOT NULL,
  prompt_summary TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  hours_saved REAL NOT NULL DEFAULT 0,
  impact TEXT NOT NULL,
  attachment TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_activities_employee ON activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);

CREATE TABLE IF NOT EXISTS learning (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  course TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  hours REAL NOT NULL DEFAULT 0,
  certificate TEXT NOT NULL DEFAULT '',
  completion_date TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_learning_employee ON learning(employee_id);

CREATE TABLE IF NOT EXISTS pocs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES employees(id),
  team_json TEXT NOT NULL DEFAULT '[]',
  project_id TEXT NOT NULL REFERENCES projects(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  business_value TEXT NOT NULL DEFAULT '',
  hours_saved REAL NOT NULL DEFAULT 0,
  repo TEXT NOT NULL DEFAULT '',
  demo TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  start_time TEXT NOT NULL DEFAULT '',
  hours_per_day REAL NOT NULL DEFAULT 0,
  block_group_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_pocs_owner ON pocs(owner_id);
CREATE INDEX IF NOT EXISTS idx_pocs_project ON pocs(project_id);
CREATE INDEX IF NOT EXISTS idx_pocs_block_group ON pocs(block_group_id);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  time_zone TEXT NOT NULL DEFAULT '',
  organizer TEXT NOT NULL DEFAULT '',
  attendees_json TEXT NOT NULL DEFAULT '[]',
  location TEXT NOT NULL DEFAULT '',
  outlook_event_id TEXT,
  created_by TEXT NOT NULL,
  linked_task_id TEXT,
  linked_poc_id TEXT,
  linked_project_id TEXT,
  block_group_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_calendar_employee ON calendar_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_calendar_block_group ON calendar_events(block_group_id);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  task_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  project_id TEXT REFERENCES projects(id),
  -- Not FK'd to employees: reporterId/assigneeId/createdBy can be "" for
  -- Super Admin accounts, which have no linked Employee (see AuthContext /
  -- PROJECT_DOCUMENTATION.md §6.1) — the original app never validated this either.
  assignee_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  last_modified_by TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  estimate_hours REAL NOT NULL DEFAULT 0,
  actual_hours REAL NOT NULL DEFAULT 0,
  percent_complete INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  completed_date TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  labels_json TEXT NOT NULL DEFAULT '[]',
  ai_tool TEXT NOT NULL DEFAULT '',
  linked_activity_id TEXT NOT NULL DEFAULT '',
  linked_poc_id TEXT NOT NULL DEFAULT '',
  linked_calendar_event_id TEXT,
  comments_json TEXT NOT NULL DEFAULT '[]',
  attachments_json TEXT NOT NULL DEFAULT '[]',
  archived INTEGER NOT NULL DEFAULT 0,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_reporter ON tasks(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
