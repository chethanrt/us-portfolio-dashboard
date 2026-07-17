import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { permissionService, roleService } from "@/services";
import type { ModuleId, PermissionAction, Role } from "@/types";
import { PermissionContext } from "./PermissionContext";
import type { DashboardScope, PermissionContextValue } from "./PermissionContext";
import { PermissionService } from "./PermissionService";

/**
 * Loads the signed-in user's role and permission set, builds a
 * PermissionService evaluator and exposes it via usePermission().
 * Everything is DENIED while loading or signed out.
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const { account, currentUser } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [evaluator, setEvaluator] = useState<PermissionService>(() => PermissionService.denyAll());
  const [isLoading, setIsLoading] = useState(false);

  const roleId = account?.roleId ?? null;

  useEffect(() => {
    let cancelled = false;

    if (!roleId) {
      setRole(null);
      setEvaluator(PermissionService.denyAll());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([roleService.getById(roleId), permissionService.getByRoleId(roleId)])
      .then(([loadedRole, permission]) => {
        if (cancelled) return;
        setRole(loadedRole ?? null);
        setEvaluator(new PermissionService(permission?.modules ?? []));
      })
      .catch(() => {
        if (cancelled) return;
        setRole(null);
        setEvaluator(PermissionService.denyAll());
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roleId]);

  const currentEmployeeId = currentUser?.id;

  const value = useMemo<PermissionContextValue>(() => {
    const canMutateRow = (module: ModuleId, action: PermissionAction, ownerEmployeeId: string) => {
      if (!evaluator.hasPermission(module, action)) return false;
      if (evaluator.getEditScope(module) !== "own") return true;
      return Boolean(currentEmployeeId) && ownerEmployeeId === currentEmployeeId;
    };

    const dashboardScope: DashboardScope =
      evaluator.getViewScope("dashboard") === "own"
        ? "personal"
        : evaluator.getViewScope("dashboard") === "team"
          ? "team"
          : "portfolio";

    return {
      isLoading,
      role,
      hasPermission: (module, action) => evaluator.hasPermission(module, action),
      canView: (module) => evaluator.canView(module),
      canCreate: (module) => evaluator.canCreate(module),
      canEdit: (module) => evaluator.canEdit(module),
      canDelete: (module) => evaluator.canDelete(module),
      canExport: (module) => evaluator.canExport(module),
      canViewField: (module, field) => evaluator.canViewField(module, field),
      canEditField: (module, field) => evaluator.canEditField(module, field),
      getViewScope: (module) => evaluator.getViewScope(module),
      getEditScope: (module) => evaluator.getEditScope(module),
      isOwnDataScope: (module) => evaluator.getViewScope(module) === "own",
      canEditRow: (module, ownerEmployeeId) => canMutateRow(module, "edit", ownerEmployeeId),
      canDeleteRow: (module, ownerEmployeeId) => canMutateRow(module, "delete", ownerEmployeeId),
      dashboardScope,
    };
  }, [evaluator, isLoading, role, currentEmployeeId]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}
