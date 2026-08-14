import { useEffect, useState } from "react";
import { activityService, employeeService, learningService, pocService, projectService, taskService } from "@/services";
import type { ReportSources } from "@/utils/reportDefinitions";

/** Loads every data source needed by the report generator. */
export function useReportsData() {
  const [sources, setSources] = useState<ReportSources | null>(null);
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
      taskService.getAll(),
    ])
      .then(([employees, projects, activities, learning, pocs, tasks]) => {
        if (!cancelled) setSources({ employees, projects, activities, learning, pocs, tasks });
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load report data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { sources, isLoading, error };
}
