/**
 * Core domain types for the AI Portfolio Dashboard.
 * Shapes mirror the JSON structures defined in docs/02_DATABASE.md
 * so the data layer can later migrate to a real API without frontend changes.
 */

// ---------------------------------------------------------------------------
// Enumerated values
// ---------------------------------------------------------------------------

/** Employee job title (domain data, not authorization). */
export type EmployeeRole =
  | "Director"
  | "Delivery Manager"
  | "Engineering Manager"
  | "Senior Tech Lead"
  | "Tech Lead"
  | "Senior Developer"
  | "Developer"
  | "Intern";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export type ProjectStage =
  | "Discovery"
  | "Requirement Gathering"
  | "Estimation"
  | "Development"
  | "Testing"
  | "Documentation"
  | "Deployment"
  | "Support";

export type ProjectStatus = "Active" | "On Hold" | "Completed" | "Planning";

export type EmployeeStatus = "Active" | "Inactive" | "Ex-Employee";

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
  experience: number;
  team: string;
  primarySkill: string;
  secondarySkill: string;
  currentProject: string;
  profileImage: string;
  status: EmployeeStatus;
  /** Employee id this person reports to; null at the top of the hierarchy. */
  managerId: string | null;
}

/** projects.json */
export interface Project {
  id: string;
  name: string;
  client: string;
  program: string;
  manager: string;
  techLead: string;
  technology: string;
  stage: ProjectStage;
  status: ProjectStatus;
  aiAdoption: number;
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

/** skills.json — one record per employee, flat skill-name keys per docs/02 */
export interface SkillRecord {
  employeeId: string;
  Magento: SkillLevel;
  PHP: SkillLevel;
  React: SkillLevel;
  JavaScript: SkillLevel;
  GraphQL: SkillLevel;
  MySQL: SkillLevel;
  Docker: SkillLevel;
  Git: SkillLevel;
  Claude: SkillLevel;
  ChatGPT: SkillLevel;
  GitHubCopilot: SkillLevel;
  Cursor: SkillLevel;
  PromptEngineering: SkillLevel;
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
}

/** pocs.json */
export interface POC {
  id: string;
  title: string;
  ownerId: string;
  projectId: string;
  category: POCCategory;
  description: string;
  status: POCStatus;
  businessValue: string;
  hoursSaved: number;
  repo: string;
  demo: string;
}

/** settings.json — application master data */
export interface AppSettings {
  roles: EmployeeRole[];
  technicalSkills: string[];
  aiSkills: string[];
  skillLevels: SkillLevel[];
  projectStages: ProjectStage[];
  aiTools: AITool[];
  learningPlatforms: LearningPlatform[];
  activityTypes: ActivityCategory[];
  pocCategories: POCCategory[];
  impactLevels: ImpactLevel[];
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
  | "Calendar Block for Task";

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
