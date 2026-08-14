import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ModulePermission, PermissionAction, Resource } from "@/types";

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
  assign: "Assign",
  comment: "Comment",
};

export function roleGrants(roleModules: ModulePermission[], moduleId: Resource["id"], action: PermissionAction): boolean {
  return Boolean(roleModules.find((m) => m.module === moduleId)?.actions[action]);
}

interface UserPermissionOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  roleName: string;
  resources: Resource[];
  roleModules: ModulePermission[];
  /** This user's current overrides (empty for a user with no customizations yet). */
  initialOverrides: ModulePermission[];
  onSave: (modules: ModulePermission[]) => Promise<void>;
}

/**
 * Per-user permission editor. Every checkbox reflects the EFFECTIVE
 * permission (role default merged with this user's override). Toggling a
 * checkbox back to match the role default removes the override entirely
 * (back to "inherit"); toggling it away from the role default records an
 * explicit grant or removal for this user only.
 */
export function UserPermissionOverrideDialog({
  open,
  onOpenChange,
  employeeName,
  roleName,
  resources,
  roleModules,
  initialOverrides,
  onSave,
}: UserPermissionOverrideDialogProps) {
  const [overrides, setOverrides] = useState<ModulePermission[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) setOverrides(structuredClone(initialOverrides));
  }, [open, initialOverrides]);

  const overrideByModule = useMemo(() => new Map(overrides.map((m) => [m.module, m])), [overrides]);

  const toggleAction = (resource: Resource, action: PermissionAction, checked: boolean) => {
    const roleDefault = roleGrants(roleModules, resource.id, action);
    setOverrides((current) => {
      const map = new Map(current.map((m) => [m.module, { ...m, actions: { ...m.actions } }]));
      const entry = map.get(resource.id) ?? { module: resource.id, actions: {} };
      if (checked === roleDefault) {
        delete entry.actions[action];
      } else {
        entry.actions[action] = checked;
      }
      if (Object.keys(entry.actions).length === 0) {
        map.delete(resource.id);
      } else {
        map.set(resource.id, entry);
      }
      return resources.map((r) => map.get(r.id)).filter((m): m is ModulePermission => Boolean(m));
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(overrides);
      onOpenChange(false);
    } catch {
      // save failed — caller shows the error toast; keep the dialog open
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !isSaving && onOpenChange(next)}
      title={`Edit Permissions — ${employeeName}`}
      description={`Role default: ${roleName}. Actions changed here apply only to ${employeeName}, not to other ${roleName} users.`}
      className="sm:max-w-2xl"
    >
      <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
        {resources.map((resource) => {
          const overrideEntry = overrideByModule.get(resource.id);
          return (
            <div key={resource.id} className="rounded-lg border p-3">
              <p className="text-sm font-semibold">{resource.label}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                {resource.actions.map((action) => {
                  const roleDefault = roleGrants(roleModules, resource.id, action);
                  const overrideValue = overrideEntry?.actions[action];
                  const effective = overrideValue ?? roleDefault;
                  const isOverridden = overrideValue !== undefined && overrideValue !== roleDefault;
                  return (
                    <label key={action} className="flex cursor-pointer items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={effective}
                        onCheckedChange={(checked) => toggleAction(resource, action, checked === true)}
                      />
                      {ACTION_LABELS[action]}
                      {isOverridden && (
                        <Badge variant={effective ? "default" : "destructive"} className="px-1 py-0 text-[10px]">
                          {effective ? "Added" : "Removed"}
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" disabled={isSaving} onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={isSaving} onClick={handleSave}>
          {isSaving && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </div>
    </Modal>
  );
}
