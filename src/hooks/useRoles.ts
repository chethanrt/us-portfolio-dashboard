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
      // Checked here too (not just RoleService's own pre-flight) so a system role's
      // permissions are never wiped before discovering the role itself can't go.
      if (roles.find((role) => role.id === id)?.isSystem) throw new Error("SYSTEM_ROLE");
      // Fresh count, not the users snapshot from page load — a role reassigned
      // to/from since then must not produce a false negative here.
      if ((await userService.countByRole(id)) > 0) throw new Error("ROLE_IN_USE");
      // permissions.role_id -> roles.id has no ON DELETE CASCADE (schema.sql), so the
      // permissions row must go first — deleting the role first trips a foreign key
      // violation on every role that's ever had its permissions saved (i.e. all of them).
      await permissionService.deleteForRole(id);
      await roleService.delete(id);
      setRoles((current) => current.filter((role) => role.id !== id));
      setPermissions((current) => current.filter((permission) => permission.roleId !== id));
    },
    [roles]
  );

  return { rows, roles, resources, isLoading, error, getModulesForRole, addRole, updateRole, deleteRole };
}
