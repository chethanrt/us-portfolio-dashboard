import { format, subDays } from "date-fns";
import type { Activity, Employee, LearningRecord, POC, Project, Task } from "@/types";

export interface ReportSources {
  employees: Employee[];
  projects: Project[];
  activities: Activity[];
  learning: LearningRecord[];
  pocs: POC[];
  tasks: Task[];
}

export interface ReportFilters {
  /** 0 = all time. Ignored by Weekly (7) and Monthly (30) summaries. */
  rangeDays: number;
  /** "all" or a project id. */
  projectId: string;
}

export interface ReportMetric {
  label: string;
  value: string | number;
}

export interface ReportResult {
  metrics: ReportMetric[];
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
}

export const REPORT_TYPES = [
  "Weekly Summary",
  "Monthly Summary",
  "Project Summary",
  "AI Activities",
  "Learning Progress",
  "POCs",
  "Team Performance",
  "Task Workload",
  "Tasks by Project",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

function filterActivities(sources: ReportSources, rangeDays: number, projectId: string): Activity[] {
  const cutoff = rangeDays > 0 ? format(subDays(new Date(), rangeDays), "yyyy-MM-dd") : "";
  return sources.activities.filter((activity) => {
    if (cutoff && activity.date < cutoff) return false;
    if (projectId !== "all" && activity.projectId !== projectId) return false;
    return true;
  });
}

function sumHours(activities: Activity[]): number {
  return Math.round(activities.reduce((sum, a) => sum + a.hoursSaved, 0) * 10) / 10;
}

function topTool(activities: Activity[]): string {
  const counts = new Map<string, number>();
  for (const activity of activities) counts.set(activity.tool, (counts.get(activity.tool) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

/** Per-employee activity breakdown used by the summary reports. */
function activitySummary(sources: ReportSources, rangeDays: number, projectId: string): ReportResult {
  const activities = filterActivities(sources, rangeDays, projectId);
  const byEmployee = new Map<string, Activity[]>();
  for (const activity of activities) {
    const list = byEmployee.get(activity.employeeId) ?? [];
    list.push(activity);
    byEmployee.set(activity.employeeId, list);
  }
  const employeeById = new Map(sources.employees.map((e) => [e.id, e]));

  return {
    metrics: [
      { label: "AI Activities", value: activities.length },
      { label: "Hours Saved", value: sumHours(activities) },
      { label: "Active Contributors", value: byEmployee.size },
      { label: "Top Tool", value: topTool(activities) },
    ],
    columns: [
      { key: "employee", label: "Employee" },
      { key: "role", label: "Role" },
      { key: "activities", label: "Activities" },
      { key: "hoursSaved", label: "Hours Saved" },
      { key: "topTool", label: "Top Tool" },
    ],
    rows: [...byEmployee.entries()]
      .map(([employeeId, own]) => {
        const employee = employeeById.get(employeeId);
        return {
          employee: employee?.name ?? "Unknown",
          role: employee?.role ?? "—",
          activities: own.length,
          hoursSaved: sumHours(own),
          topTool: topTool(own),
        };
      })
      .sort((a, b) => Number(b.hoursSaved) - Number(a.hoursSaved)),
  };
}

function projectSummary(sources: ReportSources, rangeDays: number): ReportResult {
  const activities = filterActivities(sources, rangeDays, "all");
  const rows = sources.projects.map((project) => {
    const own = activities.filter((a) => a.projectId === project.id);
    return {
      project: project.name,
      client: project.client,
      status: project.status,
      stage: project.stage,
      aiAdoption: `${project.aiAdoption}%`,
      activities: own.length,
      hoursSaved: sumHours(own),
      pocs: sources.pocs.filter((p) => p.projectId === project.id).length,
    };
  });
  return {
    metrics: [
      { label: "Projects", value: sources.projects.length },
      { label: "Active", value: sources.projects.filter((p) => p.status === "Active").length },
      {
        label: "Avg AI Adoption",
        value: `${Math.round(sources.projects.reduce((s, p) => s + p.aiAdoption, 0) / (sources.projects.length || 1))}%`,
      },
      { label: "Hours Saved", value: sumHours(activities) },
    ],
    columns: [
      { key: "project", label: "Project" },
      { key: "client", label: "Client" },
      { key: "status", label: "Status" },
      { key: "stage", label: "Stage" },
      { key: "aiAdoption", label: "AI Adoption" },
      { key: "activities", label: "Activities" },
      { key: "hoursSaved", label: "Hours Saved" },
      { key: "pocs", label: "POCs" },
    ],
    rows,
  };
}

function activitiesReport(sources: ReportSources, rangeDays: number, projectId: string): ReportResult {
  const activities = filterActivities(sources, rangeDays, projectId);
  const employeeById = new Map(sources.employees.map((e) => [e.id, e.name]));
  const projectById = new Map(sources.projects.map((p) => [p.id, p.name]));
  const highImpact = activities.filter((a) => a.impact === "High").length;
  return {
    metrics: [
      { label: "Activities", value: activities.length },
      { label: "Hours Saved", value: sumHours(activities) },
      {
        label: "Avg Hours / Activity",
        value: activities.length ? (sumHours(activities) / activities.length).toFixed(1) : 0,
      },
      { label: "High Impact", value: highImpact },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "employee", label: "Employee" },
      { key: "project", label: "Project" },
      { key: "tool", label: "Tool" },
      { key: "category", label: "Category" },
      { key: "hoursSaved", label: "Hours" },
      { key: "impact", label: "Impact" },
    ],
    rows: [...activities]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((a) => ({
        date: a.date,
        employee: employeeById.get(a.employeeId) ?? "Unknown",
        project: projectById.get(a.projectId) ?? "Unknown",
        tool: a.tool,
        category: a.category,
        hoursSaved: a.hoursSaved,
        impact: a.impact,
      })),
  };
}

function learningReport(sources: ReportSources): ReportResult {
  const byEmployee = new Map<string, LearningRecord[]>();
  for (const record of sources.learning) {
    const list = byEmployee.get(record.employeeId) ?? [];
    list.push(record);
    byEmployee.set(record.employeeId, list);
  }
  const employeeById = new Map(sources.employees.map((e) => [e.id, e]));
  const completed = sources.learning.filter((r) => r.status === "Completed").length;
  return {
    metrics: [
      {
        label: "Avg Completion",
        value: `${Math.round(sources.learning.reduce((s, r) => s + r.progress, 0) / (sources.learning.length || 1))}%`,
      },
      { label: "Courses Completed", value: completed },
      { label: "In Progress", value: sources.learning.filter((r) => r.status === "In Progress").length },
      { label: "Hours Learned", value: Math.round(sources.learning.reduce((s, r) => s + r.hours, 0)) },
    ],
    columns: [
      { key: "employee", label: "Employee" },
      { key: "role", label: "Role" },
      { key: "courses", label: "Courses" },
      { key: "completed", label: "Completed" },
      { key: "avgProgress", label: "Avg Progress" },
      { key: "hours", label: "Hours" },
    ],
    rows: [...byEmployee.entries()]
      .map(([employeeId, own]) => {
        const employee = employeeById.get(employeeId);
        return {
          employee: employee?.name ?? "Unknown",
          role: employee?.role ?? "—",
          courses: own.length,
          completed: own.filter((r) => r.status === "Completed").length,
          avgProgress: `${Math.round(own.reduce((s, r) => s + r.progress, 0) / own.length)}%`,
          hours: Math.round(own.reduce((s, r) => s + r.hours, 0)),
        };
      })
      .sort((a, b) => Number(b.completed) - Number(a.completed)),
  };
}

function pocsReport(sources: ReportSources, projectId: string): ReportResult {
  const pocs = sources.pocs.filter((p) => projectId === "all" || p.projectId === projectId);
  const employeeById = new Map(sources.employees.map((e) => [e.id, e.name]));
  const projectById = new Map(sources.projects.map((p) => [p.id, p.name]));
  return {
    metrics: [
      { label: "POCs", value: pocs.length },
      { label: "Completed", value: pocs.filter((p) => p.status === "Completed").length },
      { label: "In Progress", value: pocs.filter((p) => p.status === "In Progress").length },
      { label: "Hours Saved", value: pocs.reduce((s, p) => s + p.hoursSaved, 0) },
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "owner", label: "Owner" },
      { key: "project", label: "Project" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
      { key: "hoursSaved", label: "Hours Saved" },
    ],
    rows: pocs.map((p) => ({
      title: p.title,
      owner: employeeById.get(p.ownerId) ?? "Unknown",
      project: projectById.get(p.projectId) ?? "Unknown",
      category: p.category,
      status: p.status,
      hoursSaved: p.hoursSaved,
    })),
  };
}

function teamPerformanceReport(sources: ReportSources, rangeDays: number): ReportResult {
  const activities = filterActivities(sources, rangeDays, "all");
  const rows = sources.employees.map((employee) => {
    const own = activities.filter((a) => a.employeeId === employee.id);
    const learning = sources.learning.filter((r) => r.employeeId === employee.id);
    return {
      employee: employee.name,
      role: employee.role,
      activities: own.length,
      hoursSaved: sumHours(own),
      learning: learning.length
        ? `${Math.round(learning.reduce((s, r) => s + r.progress, 0) / learning.length)}%`
        : "0%",
      pocs: sources.pocs.filter((p) => p.ownerId === employee.id).length,
    };
  });
  return {
    metrics: [
      { label: "Team Size", value: sources.employees.length },
      { label: "Activities", value: activities.length },
      { label: "Hours Saved", value: sumHours(activities) },
      { label: "Active AI Users", value: new Set(activities.map((a) => a.employeeId)).size },
    ],
    columns: [
      { key: "employee", label: "Employee" },
      { key: "role", label: "Role" },
      { key: "activities", label: "Activities" },
      { key: "hoursSaved", label: "Hours Saved" },
      { key: "learning", label: "Learning %" },
      { key: "pocs", label: "POCs" },
    ],
    rows: rows.sort((a, b) => Number(b.hoursSaved) - Number(a.hoursSaved)),
  };
}

function isTaskDone(task: Task): boolean {
  return task.percentComplete >= 100 || Boolean(task.completedDate);
}

/** Task workload distribution per employee (docs/11 Reports Integration). */
function taskWorkloadReport(sources: ReportSources): ReportResult {
  const tasks = sources.tasks;
  const today = format(new Date(), "yyyy-MM-dd");
  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < today && !isTaskDone(t));
  const byEmployee = new Map<string, Task[]>();
  for (const task of tasks) {
    const list = byEmployee.get(task.assigneeId) ?? [];
    list.push(task);
    byEmployee.set(task.assigneeId, list);
  }
  const employeeById = new Map(sources.employees.map((e) => [e.id, e]));

  return {
    metrics: [
      { label: "Tasks", value: tasks.length },
      { label: "Completed", value: tasks.filter(isTaskDone).length },
      { label: "Overdue", value: overdue.length },
      { label: "Standalone", value: tasks.filter((t) => t.type === "Standalone").length },
    ],
    columns: [
      { key: "employee", label: "Employee" },
      { key: "role", label: "Role" },
      { key: "assigned", label: "Assigned" },
      { key: "completed", label: "Completed" },
      { key: "overdue", label: "Overdue" },
      { key: "estimate", label: "Estimate (h)" },
      { key: "actual", label: "Actual (h)" },
    ],
    rows: [...byEmployee.entries()]
      .map(([employeeId, own]) => {
        const employee = employeeById.get(employeeId);
        return {
          employee: employee?.name ?? "Unknown",
          role: employee?.role ?? "—",
          assigned: own.length,
          completed: own.filter(isTaskDone).length,
          overdue: own.filter((t) => t.dueDate && t.dueDate < today && !isTaskDone(t)).length,
          estimate: own.reduce((s, t) => s + t.estimateHours, 0),
          actual: Math.round(own.reduce((s, t) => s + t.actualHours, 0) * 10) / 10,
        };
      })
      .sort((a, b) => Number(b.assigned) - Number(a.assigned)),
  };
}

/** Tasks grouped per project, including the standalone bucket. */
function tasksByProjectReport(sources: ReportSources, projectId: string): ReportResult {
  const tasks = sources.tasks.filter(
    (t) => projectId === "all" || t.projectId === projectId || (projectId === "all" && t.projectId === null)
  );
  const buckets: { key: string; label: string; tasks: Task[] }[] = [
    ...sources.projects
      .filter((p) => projectId === "all" || p.id === projectId)
      .map((p) => ({ key: p.id, label: p.name, tasks: tasks.filter((t) => t.projectId === p.id) })),
    ...(projectId === "all"
      ? [{ key: "standalone", label: "Standalone Tasks", tasks: tasks.filter((t) => t.projectId === null) }]
      : []),
  ];

  return {
    metrics: [
      { label: "Tasks", value: tasks.length },
      { label: "Completed", value: tasks.filter(isTaskDone).length },
      { label: "Remaining", value: tasks.filter((t) => !isTaskDone(t)).length },
      {
        label: "Hours Logged",
        value: Math.round(tasks.reduce((s, t) => s + t.actualHours, 0) * 10) / 10,
      },
    ],
    columns: [
      { key: "project", label: "Project" },
      { key: "tasks", label: "Tasks" },
      { key: "completed", label: "Completed" },
      { key: "remaining", label: "Remaining" },
      { key: "estimate", label: "Estimate (h)" },
      { key: "actual", label: "Actual (h)" },
    ],
    rows: buckets
      .filter((bucket) => bucket.tasks.length > 0)
      .map((bucket) => ({
        project: bucket.label,
        tasks: bucket.tasks.length,
        completed: bucket.tasks.filter(isTaskDone).length,
        remaining: bucket.tasks.filter((t) => !isTaskDone(t)).length,
        estimate: bucket.tasks.reduce((s, t) => s + t.estimateHours, 0),
        actual: Math.round(bucket.tasks.reduce((s, t) => s + t.actualHours, 0) * 10) / 10,
      })),
  };
}

export function computeReport(type: ReportType, sources: ReportSources, filters: ReportFilters): ReportResult {
  switch (type) {
    case "Weekly Summary":
      return activitySummary(sources, 7, filters.projectId);
    case "Monthly Summary":
      return activitySummary(sources, 30, filters.projectId);
    case "Project Summary":
      return projectSummary(sources, filters.rangeDays);
    case "AI Activities":
      return activitiesReport(sources, filters.rangeDays, filters.projectId);
    case "Learning Progress":
      return learningReport(sources);
    case "POCs":
      return pocsReport(sources, filters.projectId);
    case "Team Performance":
      return teamPerformanceReport(sources, filters.rangeDays);
    case "Task Workload":
      return taskWorkloadReport(sources);
    case "Tasks by Project":
      return tasksByProjectReport(sources, filters.projectId);
  }
}

/**
 * Restricts all report sources to a single employee (docs/05: roles below
 * Tech Lead report only on their own data).
 */
export function scopeSourcesToEmployee(sources: ReportSources, employeeId: string): ReportSources {
  return {
    employees: sources.employees.filter((e) => e.id === employeeId),
    projects: sources.projects.filter((p) => p.members.includes(employeeId)),
    activities: sources.activities.filter((a) => a.employeeId === employeeId),
    learning: sources.learning.filter((l) => l.employeeId === employeeId),
    pocs: sources.pocs.filter((p) => p.ownerId === employeeId),
    tasks: sources.tasks.filter((t) => t.assigneeId === employeeId || t.reporterId === employeeId),
  };
}

/** Builds a CSV string (quoted) from a computed report. */
export function reportToCSV(result: ReportResult): string {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const header = result.columns.map((c) => escape(c.label)).join(",");
  const lines = result.rows.map((row) => result.columns.map((c) => escape(row[c.key] ?? "")).join(","));
  return [header, ...lines].join("\r\n");
}
