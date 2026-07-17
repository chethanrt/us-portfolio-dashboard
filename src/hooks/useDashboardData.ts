import { useEffect, useMemo, useState } from "react";
import { format, isSameMonth, parseISO, startOfWeek } from "date-fns";
import {
  activityService,
  employeeService,
  learningService,
  pocService,
  projectService,
} from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/security";
import type { DashboardScope } from "@/security";
import type { Activity, Employee, LearningRecord, POC, Project } from "@/types";

export interface TrendPoint {
  week: string;
  count: number;
}

export interface StatusSlice {
  status: string;
  count: number;
}

export interface ToolUsage {
  tool: string;
  count: number;
}

export interface CourseProgress {
  course: string;
  enrolled: number;
  avgProgress: number;
}

export interface Contributor {
  employee: Employee;
  activities: number;
  hoursSaved: number;
}

export interface EnrichedActivity extends Activity {
  employeeName: string;
  projectName: string;
}

export interface DashboardData {
  /** Data scope derived from the active role (docs/05). */
  scope: DashboardScope;
  kpis: {
    totalEmployees: number;
    activeProjects: number;
    totalProjects: number;
    aiAdoption: number;
    hoursSaved: number;
    totalActivities: number;
    activitiesThisMonth: number;
    pocCount: number;
    learningCompletion: number;
  };
  trend: TrendPoint[];
  projectStatus: StatusSlice[];
  toolUsage: ToolUsage[];
  learning: {
    completion: number;
    completedCourses: number;
    inProgressCourses: number;
    topCourses: CourseProgress[];
  };
  topContributors: Contributor[];
  recentActivities: EnrichedActivity[];
}

interface Sources {
  employees: Employee[];
  projects: Project[];
  activities: Activity[];
  learningRecords: LearningRecord[];
  pocs: POC[];
}

/** Employees visible to the current user based on their role scope. */
function scopeEmployees(sources: Sources, scope: DashboardScope, user: Employee | null): Employee[] {
  if (scope === "portfolio" || !user) return sources.employees;
  if (scope === "personal") return sources.employees.filter((e) => e.id === user.id);

  // team scope: EM = same team; Tech Leads = self + members of their projects
  if (user.role === "Engineering Manager") {
    return sources.employees.filter((e) => e.team === user.team);
  }
  const memberIds = new Set<string>([user.id]);
  for (const project of sources.projects) {
    if (project.techLead === user.name) project.members.forEach((id) => memberIds.add(id));
  }
  return sources.employees.filter((e) => memberIds.has(e.id));
}

/** Projects relevant to the scoped user. */
function scopeProjects(sources: Sources, scope: DashboardScope, user: Employee | null, scopedIds: Set<string>): Project[] {
  if (scope === "portfolio" || !user) return sources.projects;
  return sources.projects.filter(
    (project) =>
      project.manager === user.name ||
      project.techLead === user.name ||
      project.members.some((id) => scopedIds.has(id))
  );
}

/** Loads all sources and aggregates dashboard metrics for the active role. */
export function useDashboardData() {
  const { currentUser } = useAuth();
  const { dashboardScope } = usePermission();
  const [sources, setSources] = useState<Sources | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      employeeService.getAll(),
      projectService.getAll(),
      activityService.getAll(),
      learningService.getAll(),
      pocService.getAll(),
    ])
      .then(([employees, projects, activities, learningRecords, pocs]) => {
        if (!cancelled) setSources({ employees, projects, activities, learningRecords, pocs });
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo<DashboardData | null>(() => {
    if (!sources) return null;
    const scope = dashboardScope;
    const now = new Date();

    const scopedEmployees = scopeEmployees(sources, scope, currentUser);
    const scopedIds = new Set(scopedEmployees.map((e) => e.id));
    const projects = scopeProjects(sources, scope, currentUser, scopedIds);
    const activities = sources.activities.filter((a) => scopedIds.has(a.employeeId));
    const learningRecords = sources.learningRecords.filter((l) => scopedIds.has(l.employeeId));
    const pocs = sources.pocs.filter((p) => scopedIds.has(p.ownerId));

    // --- KPIs ---
    const aiAdoption = Math.round(
      projects.reduce((sum, p) => sum + p.aiAdoption, 0) / (projects.length || 1)
    );
    const hoursSaved = activities.reduce((sum, a) => sum + a.hoursSaved, 0);
    const activitiesThisMonth = activities.filter((a) => isSameMonth(parseISO(a.date), now)).length;
    const learningCompletion = Math.round(
      learningRecords.reduce((sum, l) => sum + l.progress, 0) / (learningRecords.length || 1)
    );

    // --- Weekly activity trend ---
    const weekCounts = new Map<string, number>();
    for (const activity of activities) {
      const key = format(startOfWeek(parseISO(activity.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
      weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
    }
    const trend = [...weekCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ week: format(parseISO(key), "MMM d"), count }));

    // --- Project status distribution ---
    const projectStatus = ["Active", "Completed", "On Hold", "Planning"]
      .map((status) => ({ status, count: projects.filter((p) => p.status === status).length }))
      .filter((slice) => slice.count > 0);

    // --- AI tool usage ---
    const toolCounts = new Map<string, number>();
    for (const activity of activities) {
      toolCounts.set(activity.tool, (toolCounts.get(activity.tool) ?? 0) + 1);
    }
    const toolUsage = [...toolCounts.entries()]
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count);

    // --- Learning progress ---
    const courseMap = new Map<string, { total: number; enrolled: number }>();
    for (const record of learningRecords) {
      const entry = courseMap.get(record.course) ?? { total: 0, enrolled: 0 };
      entry.total += record.progress;
      entry.enrolled += 1;
      courseMap.set(record.course, entry);
    }
    const topCourses = [...courseMap.entries()]
      .map(([course, { total, enrolled }]) => ({
        course,
        enrolled,
        avgProgress: Math.round(total / enrolled),
      }))
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 4);

    // --- Top contributors ---
    const contributions = new Map<string, { activities: number; hoursSaved: number }>();
    for (const activity of activities) {
      const entry = contributions.get(activity.employeeId) ?? { activities: 0, hoursSaved: 0 };
      entry.activities += 1;
      entry.hoursSaved += activity.hoursSaved;
      contributions.set(activity.employeeId, entry);
    }
    const employeeById = new Map(sources.employees.map((e) => [e.id, e]));
    const topContributors = [...contributions.entries()]
      .map(([employeeId, stats]) => ({ employee: employeeById.get(employeeId)!, ...stats }))
      .filter((c) => c.employee)
      .sort((a, b) => b.hoursSaved - a.hoursSaved)
      .slice(0, 5);

    // --- Recent activities ---
    const projectById = new Map(sources.projects.map((p) => [p.id, p]));
    const recentActivities = [...activities]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
      .map((a) => ({
        ...a,
        employeeName: employeeById.get(a.employeeId)?.name ?? "Unknown",
        projectName: projectById.get(a.projectId)?.name ?? "Unknown",
      }));

    return {
      scope,
      kpis: {
        totalEmployees: scopedEmployees.filter((e) => e.status === "Active").length,
        activeProjects: projects.filter((p) => p.status === "Active").length,
        totalProjects: projects.length,
        aiAdoption,
        hoursSaved: Math.round(hoursSaved),
        totalActivities: activities.length,
        activitiesThisMonth,
        pocCount: pocs.length,
        learningCompletion,
      },
      trend,
      projectStatus,
      toolUsage,
      learning: {
        completion: learningCompletion,
        completedCourses: learningRecords.filter((l) => l.status === "Completed").length,
        inProgressCourses: learningRecords.filter((l) => l.status === "In Progress").length,
        topCourses,
      },
      topContributors,
      recentActivities,
    };
  }, [sources, dashboardScope, currentUser]);

  return { data, isLoading, error };
}
