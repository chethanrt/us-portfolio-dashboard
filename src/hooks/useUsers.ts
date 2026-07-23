import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeService, roleService, userService } from "@/services";
import type { Employee, Role, User } from "@/types";

export interface UserRow extends User {
  employeeName: string;
  roleName: string;
}

/** Loads login accounts with employee and role names and exposes CRUD. */
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([userService.getAll(), employeeService.getAll(), roleService.getAll()])
      .then(([allUsers, allEmployees, allRoles]) => {
        if (cancelled) return;
        setUsers(allUsers);
        setEmployees(allEmployees);
        setRoles(allRoles);
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
    const roleById = new Map(roles.map((r) => [r.id, r.name]));
    return users.map((user) => ({
      ...user,
      employeeName: user.employeeId ? employeeById.get(user.employeeId) ?? "Unknown" : "—",
      roleName: roleById.get(user.roleId) ?? user.roleId,
    }));
  }, [users, employees, roles]);

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

  return { rows, users, employees, roles, isLoading, error, addUser, updateUser, deleteUser };
}
