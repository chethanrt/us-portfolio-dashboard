/**
 * Core domain types for the AI Portfolio Dashboard.
 * Shapes mirror the JSON structures defined in docs/02_DATABASE.md
 * so the data layer can later migrate to a real API without frontend changes.
 */

// ---------------------------------------------------------------------------
// Enumerated values
// ---------------------------------------------------------------------------

/**
 * Employee job title (domain data, not authorization). Sourced from Roles &
 * Permissions (roles.json) role names — not a fixed list, so a custom role
 * added there is assignable as a job title too. "Super Admin" is the one
 * exception: it's a pure RBAC role with no job-title equivalent.
 */
export type EmployeeRole = string;

export type ProjectStage =
  | "Planning"
  | "Discovery"
  | "Requirement Gathering"
  | "Estimation"
  | "Development"
  | "Testing"
  | "Documentation"
  | "Deployment"
  | "Support";

export type ProjectStatus = "Active" | "On Hold" | "Completed";

export type EmployeeStatus = "Active" | "Inactive" | "Ex-Employee";

export type TechNonTech = "Tech" | "Non-Tech";

export type AITool =
  | "Claude"
  | "ChatGPT"
  | "GitHub Copilot"
  | "Gemini"
  | "Cursor"
  | "Perplexity"
  | "Other";

export type ActivityCategory =
  | "Development"
  | "Documentation"
  | "Estimation"
  | "Code Review"
  | "Testing"
  | "CMS Research"
  | "Marketing"
  | "POC"
  | "Innovation"
  | "Learning"
  | "Other";

export type ImpactLevel = "Low" | "Medium" | "High";

export type LearningPlatform = "Udemy AI Lab" | "Internal Training" | "Other";

export type LearningStatus = "Not Started" | "In Progress" | "Completed";

export type POCStatus = "Idea" | "In Progress" | "Completed" | "On Hold";

export type POCCategory =
  | "Automation"
  | "Documentation"
  | "CMS"
  | "Marketing"
  | "Testing"
  | "Development"
  | "Estimation";

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

/** employees.json */
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  /** Exact job title/designation from HR records (e.g. "Senior Software Engineer I") — display-only, distinct from `role`, which drives permissions and is one of the fixed Roles & Permissions entries. */
  designation: string;
  experience: number;
  team: string;
  /** Selected from the Settings-managed `skills` list; anyone can pick as many as apply on their own profile. */
  skills: string[];
  /** Project names (free text, matches Project.name) this employee is assigned to; kept in sync with each Project's `members` list. */
  projects: string[];
  profileImage: string;
  status: EmployeeStatus;
  /** Employee id this person reports to; null at the top of the hierarchy. */
  managerId: string | null;
  /** Skip-level manager (this person's manager's manager); null if not set. */
  leaderId: string | null;
  /** Business unit / department code, e.g. "TS-ADM". */
  businessUnit: string;
  techNonTech: TechNonTech;
}

/** projects.json */
export interface Project {
  id: string;
  name: string;
  client: string;
  program: string;
  manager: string;
  techLead: string;
  /** Optional, like manager/techLead — employees with role "Project Manager". */
  projectManager: string;
  technology: string[];
  stage: ProjectStage;
  status: ProjectStatus;
  aiAdoption: number;
  /** Which AI capability categories (Settings-managed list) this project uses. */
  aiAdoptionCategories: string[];
  members: string[];
  startDate: string;
  endDate: string;
}

/** activities.json */
export interface Activity {
  id: string;
  employeeId: string;
  projectId: string;
  date: string;
  tool: AITool;
  category: ActivityCategory;
  projectStage: ProjectStage;
  promptSummary: string;
  outcome: string;
  hoursSaved: number;
  impact: ImpactLevel;
  attachment: string;
}

/** learning.json */
export interface LearningRecord {
  id: string;
  employeeId: string;
  course: string;
  platform: LearningPlatform;
  status: LearningStatus;
  progress: number;
  hours: number;
  certificate: string;
  completionDate: string;
  /** Who runs/owns this training program, e.g. "Chethan R T". */
  programCoordinator: string;
  /** Raw minutes completed, as reported by the source (e.g. Udemy export); `hours` is derived from this for the existing KPIs. */
  minutesCompleted: number;
}

/** pocs.json */
export interface POC {
  id: string;
  title: string;
  ownerId: string;
  /** Employee ids working on this POC alongside the owner (team-eligible roles only). */
  team: string[];
  projectId: string;
  category: POCCategory;
  description: string;
  status: POCStatus;
  businessValue: string;
  hoursSaved: number;
  repo: string;
  demo: string;
  /** yyyy-MM-dd */
  startDate: string;
  /** yyyy-MM-dd */
  endDate: string;
  /** HH:mm */
  startTime: string;
  hoursPerDay: number;
  /** Shared id across the calendar-block events created for this POC's owner + team. */
  blockGroupId: string | null;
}

/** settings.json — application master data */
export interface AppSettings {
  technicalSkills: string[];
  aiSkills: string[];
  /** Options for Employee.skills — distinct from technicalSkills/aiSkills, which back Project.technology. */
  skills: string[];
  projectStages: ProjectStage[];
  aiTools: AITool[];
  learningPlatforms: LearningPlatform[];
  activityTypes: ActivityCategory[];
  pocCategories: POCCategory[];
  /** Options for Project.aiAdoptionCategories — which AI capability types a project uses. */
  aiAdoptionCategories: string[];
  impactLevels: ImpactLevel[];
  eventTypes: CalendarEventType[];
  statusValues: {
    project: ProjectStatus[];
    employee: EmployeeStatus[];
    learning: LearningStatus[];
    poc: POCStatus[];
  };
}

/** calendarEvents.json */
export type CalendarEventType =
  | "Meeting"
  | "Focus Time"
  | "Training"
  | "KT Session"
  | "Leave"
  | "Workshop"
  | "Code Review"
  | "Sprint Planning"
  | "Retrospective"
  | "Calendar Block for Task"
  | "POC";

export interface CalendarAttendee {
  name: string;
  email: string;
}

/**
 * calendarEvents.json — shape mirrors a Microsoft Graph calendar event so a
 * future Outlook/Graph integration can replace CalendarService's storage
 * without any component changes. Phase 1 data is local only (no live Outlook
 * sync); `outlookEventId` stays null until that integration exists.
 */
export interface CalendarEvent {
  id: string;
  /** Whose calendar this event is on. */
  employeeId: string;
  title: string;
  description: string;
  eventType: CalendarEventType;
  /** ISO datetime. */
  start: string;
  /** ISO datetime. */
  end: string;
  timeZone: string;
  /** Name of the event organizer. */
  organizer: string;
  attendees: CalendarAttendee[];
  location: string;
  outlookEventId: string | null;
  /** Employee id of whoever created the event. */
  createdBy: string;
  /** Task Board task mirrored from this event, when eventType is "Calendar Block for Task". */
  linkedTaskId?: string | null;
  /** POC this event was blocked for, when eventType is "POC". */
  linkedPocId?: string | null;
  /** Project this event was auto-blocked for, when created by a Project team assignment. */
  linkedProjectId?: string | null;
  /** Shared id across sibling events created together for multiple people (team calendar). */
  blockGroupId?: string | null;
}

// ---------------------------------------------------------------------------
// Authentication & authorization
// ---------------------------------------------------------------------------

/**
 * users.json — login accounts.
 * NOTE: this is client-side demo authentication (no backend). Passwords are
 * stored in plain text in JSON/Local Storage and must not be treated as
 * production security.
 */
export interface User {
  id: string;
  username: string;
  password: string;
  /** References a role in roles.json — permissions flow from the role. */
  roleId: string;
  /** Linked employee; empty for accounts like Super Admin. */
  employeeId: string;
  status: "Active" | "Inactive";
}

// Role & Permission framework types (Role, Permission, Resource, …).
export * from "./permissions";

// Audit log types (AuditLogEntry).
export * from "./auditLog";

// Task Board types (Task, TaskComment, TaskWorkflowStatus, …).
export * from "./tasks";
