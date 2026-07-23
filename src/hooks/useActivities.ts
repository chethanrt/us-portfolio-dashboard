import { useCallback, useEffect, useMemo, useState } from "react";
import { activityService, employeeService, projectService, settingsService } from "@/services";
import type { Activity, AppSettings, Employee, Project } from "@/types";

export interface ActivityRow extends Activity {
  employeeName: string;
  projectName: string;
}

/** Loads activities with lookups and exposes CRUD that keeps state in sync. */
export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      activityService.getAll(),
      employeeService.getAll(),
      projectService.getAll(),
      settingsService.getSettings(),
    ])
      .then(([allActivities, allEmployees, allProjects, appSettings]) => {
        if (cancelled) return;
        setActivities(allActivities);
        setEmployees(allEmployees);
        setProjects(allProjects);
        setSettings(appSettings);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load AI activities.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<ActivityRow[]>(() => {
    const employeeById = new Map(employees.map((e) => [e.id, e.name]));
    const projectById = new Map(projects.map((p) => [p.id, p.name]));
    return activities
      .map((activity) => ({
        ...activity,
        employeeName: employeeById.get(activity.employeeId) ?? "Unknown",
        projectName: projectById.get(activity.projectId) ?? "Unknown",
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [activities, employees, projects]);

  const addActivity = useCallback(async (input: Omit<Activity, "id">) => {
    const created = await activityService.create(input);
    setActivities((current) => [created, ...current]);
  }, []);

  const updateActivity = useCallback(async (id: string, input: Omit<Activity, "id">) => {
    const updated = await activityService.update(id, input);
    setActivities((current) => current.map((a) => (a.id === id ? updated : a)));
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    await activityService.delete(id);
    setActivities((current) => current.filter((a) => a.id !== id));
  }, []);

  return {
    rows,
    employees,
    projects,
    settings,
    isLoading,
    error,
    addActivity,
    updateActivity,
    deleteActivity,
  };
}
