import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeService, userService } from "@/services";
import type { Employee, User } from "@/types";

export interface UserRow extends User {
  employeeName: string;
}

/** Loads login accounts with linked employee names and exposes CRUD. */
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([userService.getAll(), employeeService.getAll()])
      .then(([allUsers, allEmployees]) => {
        if (cancelled) return;
        setUsers(allUsers);
        setEmployees(allEmployees);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load user accounts.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<UserRow[]>(() => {
    const employeeById = new Map(employees.map((e) => [e.id, e.name]));
    return users.map((user) => ({
      ...user,
      employeeName: user.employeeId ? employeeById.get(user.employeeId) ?? "Unknown" : "—",
    }));
  }, [users, employees]);

  const addUser = useCallback(async (input: Omit<User, "id">) => {
    const created = await userService.create(input);
    setUsers((current) => [...current, created]);
  }, []);

  const updateUser = useCallback(async (id: string, input: Omit<User, "id">) => {
    const updated = await userService.update(id, input);
    setUsers((current) => current.map((u) => (u.id === id ? updated : u)));
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await userService.delete(id);
    setUsers((current) => current.filter((u) => u.id !== id));
  }, []);

  return { rows, users, employees, isLoading, error, addUser, updateUser, deleteUser };
}
