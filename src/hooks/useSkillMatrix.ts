import { useEffect, useMemo, useState } from "react";
import { employeeService, skillService } from "@/services";
import type { Employee, SkillRecord } from "@/types";

export interface SkillMatrixRow {
  employee: Employee;
  skills: SkillRecord;
}

/** Joins employees with their skill records for the matrix table. */
export function useSkillMatrix() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skillRecords, setSkillRecords] = useState<SkillRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([employeeService.getAll(), skillService.getAll()])
      .then(([allEmployees, allSkills]) => {
        if (cancelled) return;
        setEmployees(allEmployees);
        setSkillRecords(allSkills);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load the skill matrix.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<SkillMatrixRow[]>(() => {
    const skillsByEmployee = new Map(skillRecords.map((record) => [record.employeeId, record]));
    return employees
      .map((employee) => {
        const skills = skillsByEmployee.get(employee.id);
        return skills ? { employee, skills } : null;
      })
      .filter((row): row is SkillMatrixRow => row !== null);
  }, [employees, skillRecords]);

  return { rows, isLoading, error };
}
