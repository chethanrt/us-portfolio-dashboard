import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeService, projectService } from "@/services";
import type { Employee, Project } from "@/types";

/** Loads projects with an employee lookup map and exposes CRUD. */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([projectService.getAll(), employeeService.getAll()])
      .then(([allProjects, allEmployees]) => {
        if (cancelled) return;
        setProjects(allProjects);
        setEmployees(allEmployees);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load projects.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const addProject = useCallback(async (input: Omit<Project, "id">) => {
    const created = await projectService.create(input);
    setProjects((current) => [...current, created]);
  }, []);

  const updateProject = useCallback(async (id: string, input: Omit<Project, "id">) => {
    const updated = await projectService.update(id, input);
    setProjects((current) => current.map((p) => (p.id === id ? updated : p)));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await projectService.delete(id);
    setProjects((current) => current.filter((p) => p.id !== id));
  }, []);

  return {
    projects,
    employees,
    employeesById,
    isLoading,
    error,
    addProject,
    updateProject,
    deleteProject,
  };
}
