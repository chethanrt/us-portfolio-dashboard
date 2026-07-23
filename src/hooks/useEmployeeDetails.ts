import { useEffect, useState } from "react";
import { activityService, learningService, pocService, skillService } from "@/services";
import type { Activity, Employee, LearningRecord, POC, SkillRecord } from "@/types";

export interface EmployeeDetails {
  skills: SkillRecord | null;
  learning: LearningRecord[];
  activities: Activity[];
  pocs: POC[];
}

/** Loads skills, learning, activities and POCs for the profile drawer. */
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
      skillService.getByEmployee(employee.id),
      learningService.getByEmployee(employee.id),
      activityService.getByEmployee(employee.id),
      pocService.getByOwner(employee.id),
    ])
      .then(([skills, learning, activities, pocs]) => {
        if (cancelled) return;
        setDetails({
          skills: skills ?? null,
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
