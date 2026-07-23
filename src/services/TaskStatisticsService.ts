import { format, startOfWeek, subDays } from "date-fns";
import type { Employee, Task, TaskPriority, TaskWorkflowStatus } from "@/types";

export interface TaskOverviewStats {
  total: number;
  byStatus: { status: string; count: number; color: string }[];
  byPriority: { priority: TaskPriority; count: number }[];
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  standalone: { total: number; completed: number; inProgress: number };
  project: { total: number; completed: number; remaining: number };
}

export interface MyTaskStats {
  total: number;
  inProgress: number;
  dueToday: number;
  overdue: number;
}

export interface EmployeeWorkload {
  employee: Employee;
  assigned: number;
  completed: number;
  overdue: number;
  estimateHours: number;
  actualHours: number;
}

export interface EmployeeTaskSummary extends MyTaskStats {
  completed: number;
  standalone: number;
  projectTasks: number;
  estimateHours: number;
  actualHours: number;
}

const PRIORITIES: TaskPriority[] = ["Critical", "High", "Medium", "Low"];

function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function isDone(task: Task): boolean {
  return task.percentComplete >= 100 || Boolean(task.completedDate);
}

function isOverdue(task: Task, day = today()): boolean {
  return Boolean(task.dueDate) && task.dueDate < day && !isDone(task);
}

/** Active = not archived; statistics ignore archived tasks except reports. */
function active(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.archived);
}

/**
 * Aggregations for dashboard widgets, People integration and reports
 * (docs/11 Dashboard Integration + Reports Integration).
 */
class TaskStatisticsService {
  overview(tasks: Task[], workflow: TaskWorkflowStatus[]): TaskOverviewStats {
    const open = active(tasks);
    const day = today();
    const weekAhead = format(subDays(new Date(), -7), "yyyy-MM-dd");
    const standalone = open.filter((t) => t.type === "Standalone");
    const project = open.filter((t) => t.type === "Project");

    return {
      total: open.length,
      byStatus: workflow.map((status) => ({
        status: status.name,
        color: status.color,
        count: open.filter((t) => t.status === status.name).length,
      })),
      byPriority: PRIORITIES.map((priority) => ({
        priority,
        count: open.filter((t) => t.priority === priority).length,
      })),
      overdue: open.filter((t) => isOverdue(t, day)).length,
      dueToday: open.filter((t) => t.dueDate === day && !isDone(t)).length,
      dueThisWeek: open.filter((t) => t.dueDate && t.dueDate >= day && t.dueDate <= weekAhead && !isDone(t)).length,
      standalone: {
        total: standalone.length,
        completed: standalone.filter(isDone).length,
        inProgress: standalone.filter((t) => !isDone(t) && t.percentComplete > 0).length,
      },
      project: {
        total: project.length,
        completed: project.filter(isDone).length,
        remaining: project.filter((t) => !isDone(t)).length,
      },
    };
  }

  myTasks(tasks: Task[], employeeId: string | undefined): MyTaskStats {
    const mine = active(tasks).filter((t) => t.assigneeId === employeeId);
    const day = today();
    return {
      total: mine.length,
      inProgress: mine.filter((t) => !isDone(t) && t.percentComplete > 0).length,
      dueToday: mine.filter((t) => t.dueDate === day && !isDone(t)).length,
      overdue: mine.filter((t) => isOverdue(t, day)).length,
    };
  }

  recent(tasks: Task[], count: number): Task[] {
    return active(tasks)
      .slice()
      .sort((a, b) => b.updatedDate.localeCompare(a.updatedDate))
      .slice(0, count);
  }

  overdueTasks(tasks: Task[]): Task[] {
    const day = today();
    return active(tasks)
      .filter((t) => isOverdue(t, day))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  workloadByEmployee(tasks: Task[], employees: Employee[]): EmployeeWorkload[] {
    const open = active(tasks);
    return employees
      .map((employee) => {
        const own = open.filter((t) => t.assigneeId === employee.id);
        return {
          employee,
          assigned: own.length,
          completed: own.filter(isDone).length,
          overdue: own.filter((t) => isOverdue(t)).length,
          estimateHours: own.reduce((sum, t) => sum + t.estimateHours, 0),
          actualHours: Math.round(own.reduce((sum, t) => sum + t.actualHours, 0) * 10) / 10,
        };
      })
      .filter((row) => row.assigned > 0)
      .sort((a, b) => b.assigned - a.assigned);
  }

  /** Workload summary for one employee (People module integration). */
  employeeSummary(tasks: Task[], employeeId: string): EmployeeTaskSummary {
    const mine = active(tasks).filter((t) => t.assigneeId === employeeId);
    const base = this.myTasks(tasks, employeeId);
    return {
      ...base,
      completed: mine.filter(isDone).length,
      standalone: mine.filter((t) => t.type === "Standalone").length,
      projectTasks: mine.filter((t) => t.type === "Project").length,
      estimateHours: mine.reduce((sum, t) => sum + t.estimateHours, 0),
      actualHours: Math.round(mine.reduce((sum, t) => sum + t.actualHours, 0) * 10) / 10,
    };
  }

  /** Completed tasks per week (Reports: completion trends). */
  completionTrend(tasks: Task[]): { week: string; completed: number }[] {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (!task.completedDate) continue;
      const key = format(startOfWeek(new Date(task.completedDate), { weekStartsOn: 1 }), "yyyy-MM-dd");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, completed]) => ({ week: format(new Date(week), "MMM d"), completed }));
  }
}

export const taskStatisticsService = new TaskStatisticsService();
