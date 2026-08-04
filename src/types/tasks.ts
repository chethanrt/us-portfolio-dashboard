/**
 * Task Board types — see docs/11_TASK_BOARD_SPECIFICATION.md.
 * Workflow statuses and categories are configuration (taskWorkflow.json,
 * taskCategories.json), so `status` and `category` are plain strings.
 */

/** Whether a task belongs to a project or stands alone. */
export type TaskType = "Project" | "Standalone";

export type TaskPriority = "Critical" | "High" | "Medium" | "Low";

/** A comment inside a task's discussion thread. */
export interface TaskComment {
  id: string;
  authorId: string;
  date: string;
  message: string;
}

/** Attachment metadata only — file storage is out of scope (docs/11). */
export interface TaskAttachment {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
}

/** tasks.json — one unit of work with one assignee. */
export interface Task {
  id: string;
  /** Display identifier, e.g. TASK-0001. */
  taskNumber: string;
  title: string;
  description: string;
  type: TaskType;
  /** Category name from taskCategories.json. */
  category: string;
  /** Required for Project tasks; null for Standalone tasks. */
  projectId: string | null;
  assigneeId: string;
  reporterId: string;
  createdBy: string;
  lastModifiedBy: string;
  priority: TaskPriority;
  /** Workflow status name from taskWorkflow.json. */
  status: string;
  estimateHours: number;
  actualHours: number;
  percentComplete: number;
  startDate: string;
  dueDate: string;
  completedDate: string;
  /** Ordering within a board column. */
  displayOrder: number;
  labels: string[];
  aiTool: string;
  linkedActivityId: string;
  linkedPocId: string;
  /** Source calendar event, when this task was created from a "Calendar Block for Task" block. */
  linkedCalendarEventId?: string | null;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  archived: boolean;
  createdDate: string;
  updatedDate: string;
}

/** taskWorkflow.json — one board column / workflow state. */
export interface TaskWorkflowStatus {
  id: string;
  name: string;
  /** Badge/column accent color (hex). */
  color: string;
  order: number;
  description: string;
  isFinalState: boolean;
  /** Auto completion % applied when a task enters this status. */
  percentComplete: number;
}

/** taskCategories.json — configurable task category. */
export interface TaskCategory {
  id: string;
  name: string;
  description: string;
}
