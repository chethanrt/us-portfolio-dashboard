import { useEffect, useState } from "react";
import { activityService, learningService, pocService, projectService } from "@/services";
import type { Activity, Employee, LearningRecord } from "@/types";
import {
  getEmployeePocAssignments,
  getEmployeeProjectAssignments,
} from "@/utils/employeeAssignments";
import type { EmployeePocAssignment, EmployeeProjectAssignment } from "@/utils/employeeAssignments";

export interface EmployeeDetails {
  learning: LearningRecord[];
  activities: Activity[];
  /** Every project this employee is involved in, with their role(s) — computed live, not a stored field. */
  projects: EmployeeProjectAssignment[];
  /** Every POC this employee owns or is on the team for — computed live, includes team POCs, not just owned ones. */
  pocs: EmployeePocAssignment[];
}

/** Loads learning, activities, and computed project/POC assignments for the profile drawer. */
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
      projectService.getAll(),
      pocService.getAll(),
    ])
      .then(([learning, activities, allProjects, allPocs]) => {
        if (cancelled) return;
        setDetails({
          learning,
          activities: [...activities].sort((a, b) => b.date.localeCompare(a.date)),
          projects: getEmployeeProjectAssignments(employee, allProjects),
          pocs: getEmployeePocAssignments(employee, allPocs),
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
