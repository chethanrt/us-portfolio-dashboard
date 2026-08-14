import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LoadingSkeleton, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { permissionOverrideService, permissionService, roleService, userService } from "@/services";
import type { ModulePermission, PermissionAction, Resource, Role, User } from "@/types";
import { roleGrants, UserPermissionOverrideDialog } from "./UserPermissionOverrideDialog";

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
  assign: "Assign",
  comment: "Comment",
};

interface EmployeeAccessPanelProps {
  employeeId: string;
  employeeName: string;
}

/**
 * Shows a linked employee's login account, their role's default
 * permissions, and any user-specific grants/removals on top of it — with
 * an entry point to edit those overrides. Gated by the caller on
 * `canEdit("users")`; this is an administrative view, not a self-service one.
 */
export function EmployeeAccessPanel({ employeeId, employeeName }: EmployeeAccessPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [roleModules, setRoleModules] = useState<ModulePermission[]>([]);
  const [overrideModules, setOverrideModules] = useState<ModulePermission[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([userService.getAll(), permissionService.getResources()])
      .then(async ([users, allResources]) => {
        if (cancelled) return;
        setResources(allResources);
        const foundAccount = users.find((u) => u.employeeId === employeeId) ?? null;
        setAccount(foundAccount);
        if (!foundAccount) return;

        const [loadedRole, permission, override] = await Promise.all([
          roleService.getById(foundAccount.roleId),
          permissionService.getByRoleId(foundAccount.roleId),
          permissionOverrideService.getByUserId(foundAccount.id),
        ]);
        if (cancelled) return;
        setRole(loadedRole ?? null);
        setRoleModules(permission?.modules ?? []);
        setOverrideModules(override?.modules ?? []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Unable to load access details.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const roleSummary = useMemo(
    () =>
      roleModules
        .filter((m) => Object.values(m.actions).some(Boolean))
        .map((m) => ({
          module: m.module,
          label: resources.find((r) => r.id === m.module)?.label ?? m.module,
          actions: Object.entries(m.actions)
            .filter(([, granted]) => granted)
            .map(([action]) => ACTION_LABELS[action as PermissionAction] ?? action),
        })),
    [roleModules, resources]
  );

  const diff = useMemo(() => {
    const granted: { key: string; label: string; action: PermissionAction }[] = [];
    const removed: { key: string; label: string; action: PermissionAction }[] = [];
    const byResource = new Map(resources.map((r) => [r.id, r]));

    for (const entry of overrideModules) {
      const resource = byResource.get(entry.module);
      if (!resource) continue;
      for (const action of resource.actions) {
        const overrideValue = entry.actions[action];
        if (overrideValue === undefined) continue;
        const roleDefault = roleGrants(roleModules, entry.module, action);
        if (overrideValue === roleDefault) continue;
        const item = { key: `${entry.module}-${action}`, label: resource.label, action };
        (overrideValue ? granted : removed).push(item);
      }
    }
    return { granted, removed };
  }, [overrideModules, roleModules, resources]);

  const handleSaveOverrides = async (modules: ModulePermission[]) => {
    if (!account) return;
    try {
      await permissionOverrideService.saveForUser(account.id, modules);
      setOverrideModules(modules);
      toast.success("Permissions updated.");
    } catch {
      toast.error("Unable to save permissions. Please try again.");
      throw new Error("save failed");
    }
  };

  if (isLoading) return <LoadingSkeleton variant="list" count={3} />;

  if (!account) {
    return (
      <p className="text-sm text-muted-foreground">
        No login account linked — add one in User Management to manage permissions.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">{account.username}</p>
          <p className="text-xs text-muted-foreground">{role?.name ?? "Unknown role"}</p>
        </div>
        <StatusBadge status={account.status} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Role-Based Permissions</p>
        {roleSummary.length === 0 ? (
          <p className="text-sm text-muted-foreground">No access granted by role.</p>
        ) : (
          <div className="space-y-1">
            {roleSummary.map((entry) => (
              <p key={entry.module} className="text-sm">
                <span className="font-medium">{entry.label}:</span> {entry.actions.join(", ")}
              </p>
            ))}
          </div>
        )}
      </div>

      {diff.granted.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Additional Permissions Granted</p>
          <div className="flex flex-wrap gap-1.5">
            {diff.granted.map((d) => (
              <Badge key={d.key}>
                {d.label}: {ACTION_LABELS[d.action]}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {diff.removed.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Permissions Removed</p>
          <div className="flex flex-wrap gap-1.5">
            {diff.removed.map((d) => (
              <Badge key={d.key} variant="destructive">
                {d.label}: {ACTION_LABELS[d.action]}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {diff.granted.length === 0 && diff.removed.length === 0 && (
        <p className="text-sm text-muted-foreground">No user-specific overrides — using role defaults.</p>
      )}

      <Button size="sm" onClick={() => setDialogOpen(true)}>
        Edit Permissions
      </Button>

      <UserPermissionOverrideDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employeeName={employeeName}
        roleName={role?.name ?? "this role"}
        resources={resources}
        roleModules={roleModules}
        initialOverrides={overrideModules}
        onSave={handleSaveOverrides}
      />
    </div>
  );
}
