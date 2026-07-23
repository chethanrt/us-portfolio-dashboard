import { useCallback, useEffect, useMemo, useState } from "react";
import { permissionService, roleService, userService } from "@/services";
import type { ModulePermission, Permission, Resource, Role, User } from "@/types";

export interface RoleRow extends Role {
  /** Accounts assigned to this role. */
  userCount: number;
  /** Modules the role has at least one action on. */
  moduleCount: number;
}

/** Loads roles with their permission sets and exposes CRUD for both. */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      roleService.getAll(),
      permissionService.getAll(),
      permissionService.getResources(),
      userService.getAll(),
    ])
      .then(([allRoles, allPermissions, allResources, allUsers]) => {
        if (cancelled) return;
        setRoles(allRoles);
        setPermissions(allPermissions);
        setResources(allResources);
        setUsers(allUsers);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load roles.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<RoleRow[]>(() => {
    const permissionByRole = new Map(permissions.map((p) => [p.roleId, p]));
    return roles.map((role) => ({
      ...role,
      userCount: users.filter((user) => user.roleId === role.id).length,
      moduleCount: (permissionByRole.get(role.id)?.modules ?? []).filter((m) =>
        Object.values(m.actions).some(Boolean)
      ).length,
    }));
  }, [roles, permissions, users]);

  const getModulesForRole = useCallback(
    (roleId: string): ModulePermission[] =>
      permissions.find((permission) => permission.roleId === roleId)?.modules ?? [],
    [permissions]
  );

  const upsertPermission = useCallback((saved: Permission) => {
    setPermissions((current) => {
      const others = current.filter((p) => p.roleId !== saved.roleId);
      return [...others, saved];
    });
  }, []);

  const addRole = useCallback(
    async (input: Pick<Role, "name" | "description">, modules: ModulePermission[]) => {
      const created = await roleService.create(input);
      const saved = await permissionService.saveForRole(created.id, modules);
      setRoles((current) => [...current, created]);
      upsertPermission(saved);
    },
    [upsertPermission]
  );

  const updateRole = useCallback(
    async (id: string, input: Pick<Role, "name" | "description">, modules: ModulePermission[]) => {
      const updated = await roleService.update(id, input);
      const saved = await permissionService.saveForRole(id, modules);
      setRoles((current) => current.map((role) => (role.id === id ? updated : role)));
      upsertPermission(saved);
    },
    [upsertPermission]
  );

  const deleteRole = useCallback(
    async (id: string) => {
      if (users.some((user) => user.roleId === id)) throw new Error("ROLE_IN_USE");
      await roleService.delete(id); // throws SYSTEM_ROLE for built-in roles
      await permissionService.deleteForRole(id);
      setRoles((current) => current.filter((role) => role.id !== id));
      setPermissions((current) => current.filter((permission) => permission.roleId !== id));
    },
    [users]
  );

  return { rows, roles, resources, isLoading, error, getModulesForRole, addRole, updateRole, deleteRole };
}
