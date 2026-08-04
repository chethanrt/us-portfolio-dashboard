import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeService, learningService } from "@/services";
import type { Employee, LearningRecord } from "@/types";

export interface LearningRow extends LearningRecord {
  employeeName: string;
}

export interface LearningStats {
  completion: number;
  completedCourses: number;
  inProgressCourses: number;
  hoursLearned: number;
}

export interface Learner {
  employee: Employee;
  completed: number;
  hours: number;
  avgProgress: number;
}

/** Loads learning records with employee names, portfolio stats and CRUD. */
export function useLearning() {
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([learningService.getAll(), employeeService.getAll()])
      .then(([allRecords, allEmployees]) => {
        if (cancelled) return;
        setRecords(allRecords);
        setEmployees(allEmployees);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load learning records.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<LearningRow[]>(() => {
    const employeeById = new Map(employees.map((e) => [e.id, e.name]));
    return records.map((record) => ({
      ...record,
      employeeName: employeeById.get(record.employeeId) ?? "Unknown",
    }));
  }, [records, employees]);

  const stats = useMemo<LearningStats>(() => {
    return {
      completion: records.length
        ? Math.round(records.reduce((sum, r) => sum + r.progress, 0) / records.length)
        : 0,
      completedCourses: records.filter((r) => r.status === "Completed").length,
      inProgressCourses: records.filter((r) => r.status === "In Progress").length,
      hoursLearned: Math.round(records.reduce((sum, r) => sum + r.hours, 0)),
    };
  }, [records]);

  const leaderboard = useMemo<Learner[]>(() => {
    const byEmployee = new Map<string, LearningRecord[]>();
    for (const record of records) {
      const list = byEmployee.get(record.employeeId) ?? [];
      list.push(record);
      byEmployee.set(record.employeeId, list);
    }
    const employeeById = new Map(employees.map((e) => [e.id, e]));
    return [...byEmployee.entries()]
      .map(([employeeId, own]) => {
        const employee = employeeById.get(employeeId);
        if (!employee) return null;
        return {
          employee,
          completed: own.filter((r) => r.status === "Completed").length,
          hours: Math.round(own.reduce((sum, r) => sum + r.hours, 0)),
          avgProgress: Math.round(own.reduce((sum, r) => sum + r.progress, 0) / own.length),
        };
      })
      .filter((learner): learner is Learner => learner !== null)
      .sort((a, b) => b.completed - a.completed || b.hours - a.hours)
      .slice(0, 5);
  }, [records, employees]);

  const addRecord = useCallback(async (input: Omit<LearningRecord, "id">) => {
    const created = await learningService.create(input);
    setRecords((current) => [created, ...current]);
  }, []);

  const updateRecord = useCallback(async (id: string, input: Omit<LearningRecord, "id">) => {
    const updated = await learningService.update(id, input);
    setRecords((current) => current.map((r) => (r.id === id ? updated : r)));
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    await learningService.delete(id);
    setRecords((current) => current.filter((r) => r.id !== id));
  }, []);

  return { rows, employees, stats, leaderboard, isLoading, error, addRecord, updateRecord, deleteRecord };
}
