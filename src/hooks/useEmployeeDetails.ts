import { useEffect, useState } from "react";
import { activityService, learningService, pocService } from "@/services";
import type { Activity, Employee, LearningRecord, POC } from "@/types";

export interface EmployeeDetails {
  learning: LearningRecord[];
  activities: Activity[];
  pocs: POC[];
}

/** Loads learning, activities and POCs for the profile drawer. */
export function useEmployeeDetails(employee: Employee | null) {
  const [details, setDetails] = useState<EmployeeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!employee) {
      setDetails(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      learningService.getByEmployee(employee.id),
      activityService.getByEmployee(employee.id),
      pocService.getByOwner(employee.id),
    ])
      .then(([learning, activities, pocs]) => {
        if (cancelled) return;
        setDetails({
          learning,
          activities: [...activities].sort((a, b) => b.date.localeCompare(a.date)),
          pocs,
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [employee]);

  return { details, isLoading };
}
