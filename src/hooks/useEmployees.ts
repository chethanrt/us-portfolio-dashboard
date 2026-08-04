import { useCallback, useEffect, useMemo, useState } from "react";
import {
  activityService,
  employeeService,
  learningService,
  pocService,
  projectService,
} from "@/services";
import type { Activity, Employee, LearningRecord, POC, Project } from "@/types";

export interface EmployeeStats {
  activities: number;
  hoursSaved: number;
  /** Average learning progress 0–100. */
  learningProgress: number;
  pocs: number;
}

export interface EmployeeWithStats extends Employee {
  stats: EmployeeStats;
}

/** Loads employees with aggregated stats and exposes CRUD. */
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  const [pocs, setPocs] = useState<POC[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      employeeService.getAll(),
      activityService.getAll(),
      learningService.getAll(),
      pocService.getAll(),
      projectService.getAll(),
    ])
      .then(([allEmployees, allActivities, allLearning, allPocs, allProjects]) => {
        if (cancelled) return;
        setEmployees(allEmployees);
        setActivities(allActivities);
        setLearningRecords(allLearning);
        setPocs(allPocs);
        setProjects(allProjects);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load employees.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const employeesWithStats = useMemo<EmployeeWithStats[]>(() => {
    return employees.map((employee) => {
      const ownActivities = activities.filter((a) => a.employeeId === employee.id);
      const ownLearning = learningRecords.filter((l) => l.employeeId === employee.id);
      return {
        ...employee,
        stats: {
          activities: ownActivities.length,
          hoursSaved: Math.round(ownActivities.reduce((sum, a) => sum + a.hoursSaved, 0) * 10) / 10,
          learningProgress: ownLearning.length
            ? Math.round(ownLearning.reduce((sum, l) => sum + l.progress, 0) / ownLearning.length)
            : 0,
          pocs: pocs.filter((p) => p.ownerId === employee.id).length,
        },
      };
    });
  }, [employees, activities, learningRecords, pocs]);

  const addEmployee = useCallback(async (input: Omit<Employee, "id">) => {
    const created = await employeeService.create(input);
    setEmployees((current) => [...current, created]);
  }, []);

  const updateEmployee = useCallback(async (id: string, input: Omit<Employee, "id">) => {
    const updated = await employeeService.update(id, input);
    setEmployees((current) => current.map((e) => (e.id === id ? updated : e)));
  }, []);

  /** Marks an employee as an Ex-Employee and reassigns their direct reports. */
  const offboardEmployee = useCallback(async (id: string, reassignments: Record<string, string>) => {
    await employeeService.offboard(id, reassignments);
    setEmployees((current) =>
      current.map((employee) => {
        if (employee.id === id) return { ...employee, status: "Ex-Employee" };
        const newManagerId = reassignments[employee.id];
        return newManagerId ? { ...employee, managerId: newManagerId } : employee;
      })
    );
  }, []);

  return {
    employees: employeesWithStats,
    projects,
    isLoading,
    error,
    addEmployee,
    updateEmployee,
    offboardEmployee,
  };
}
