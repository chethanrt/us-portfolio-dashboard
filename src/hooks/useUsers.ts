import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeService, roleService, userService } from "@/services";
import type { UserInput } from "@/services/UserService";
import type { Employee, EmployeeRole, Role, User } from "@/types";

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

  /**
   * People and User Management must never drift apart on role or active
   * status (docs: a promotion/demotion, or a deactivation, happens once, in
   * User Management, and People reflects it). Two things are deliberately
   * never overwritten: "Super Admin" has no EmployeeRole equivalent — it's a
   * pure RBAC role, never a job title — and an employee already marked
   * "Ex-Employee" (a deliberate People-side offboarding) is never downgraded
   * back to a plain "Inactive" just because their login was toggled.
   */
  const syncEmployeeFromUser = useCallback(
    async (user: User) => {
      if (!user.employeeId) return;
      const employee = employees.find((e) => e.id === user.employeeId);
      if (!employee) return;

      const patch: Partial<Pick<Employee, "role" | "status">> = {};

      const roleName = user.roleId === "super-admin" ? undefined : roles.find((r) => r.id === user.roleId)?.name;
      if (roleName && employee.role !== roleName) patch.role = roleName as EmployeeRole;

      if (employee.status !== "Ex-Employee") {
        const nextStatus = user.status === "Active" ? "Active" : "Inactive";
        if (employee.status !== nextStatus) patch.status = nextStatus;
      }

      if (Object.keys(patch).length === 0) return;
      const updated = await employeeService.update(employee.id, { ...employee, ...patch });
      setEmployees((current) => current.map((e) => (e.id === updated.id ? updated : e)));
    },
    [roles, employees]
  );

  const addUser = useCallback(
    async (input: UserInput) => {
      const created = await userService.create(input);
      setUsers((current) => [...current, created]);
      await syncEmployeeFromUser(created);
    },
    [syncEmployeeFromUser]
  );

  const updateUser = useCallback(
    async (id: string, input: UserInput) => {
      const updated = await userService.update(id, input);
      setUsers((current) => current.map((u) => (u.id === id ? updated : u)));
      await syncEmployeeFromUser(updated);
    },
    [syncEmployeeFromUser]
  );

  const deleteUser = useCallback(async (id: string) => {
    await userService.delete(id);
    setUsers((current) => current.filter((u) => u.id !== id));
  }, []);

  return { rows, users, employees, roles, isLoading, error, addUser, updateUser, deleteUser };
}
