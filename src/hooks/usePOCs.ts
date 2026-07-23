import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeService, pocService, projectService } from "@/services";
import type { Employee, POC, Project } from "@/types";

export interface POCRow extends POC {
  ownerName: string;
  projectName: string;
}

/** Loads POCs with owner/project names and exposes CRUD. */
export function usePOCs() {
  const [pocs, setPocs] = useState<POC[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([pocService.getAll(), employeeService.getAll(), projectService.getAll()])
      .then(([allPocs, allEmployees, allProjects]) => {
        if (cancelled) return;
        setPocs(allPocs);
        setEmployees(allEmployees);
        setProjects(allProjects);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load POCs.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<POCRow[]>(() => {
    const employeeById = new Map(employees.map((e) => [e.id, e.name]));
    const projectById = new Map(projects.map((p) => [p.id, p.name]));
    return pocs.map((poc) => ({
      ...poc,
      ownerName: employeeById.get(poc.ownerId) ?? "Unknown",
      projectName: projectById.get(poc.projectId) ?? "Unknown",
    }));
  }, [pocs, employees, projects]);

  const addPOC = useCallback(async (input: Omit<POC, "id">) => {
    const created = await pocService.create(input);
    setPocs((current) => [created, ...current]);
  }, []);

  const updatePOC = useCallback(async (id: string, input: Omit<POC, "id">) => {
    const updated = await pocService.update(id, input);
    setPocs((current) => current.map((p) => (p.id === id ? updated : p)));
  }, []);

  const deletePOC = useCallback(async (id: string) => {
    await pocService.delete(id);
    setPocs((current) => current.filter((p) => p.id !== id));
  }, []);

  return { rows, pocs, employees, projects, isLoading, error, addPOC, updatePOC, deletePOC };
}
