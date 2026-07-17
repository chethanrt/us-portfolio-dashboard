import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DataScope, ModulePermission, PermissionAction, Resource } from "@/types";

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
};

const SCOPE_OPTIONS: { value: DataScope; label: string }[] = [
  { value: "all", label: "All records" },
  { value: "team", label: "Team" },
  { value: "own", label: "Own records" },
];

interface PermissionMatrixProps {
  resources: Resource[];
  value: ModulePermission[];
  onChange: (next: ModulePermission[]) => void;
}

/** Grouped checkbox editor for module, action, scope and field permissions. */
export function PermissionMatrix({ resources, value, onChange }: PermissionMatrixProps) {
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  const byModule = new Map(value.map((entry) => [entry.module, entry]));

  const updateModule = (
    resource: Resource,
    updater: (current: ModulePermission) => ModulePermission
  ) => {
    const current = byModule.get(resource.id) ?? { module: resource.id, actions: {} };
    const nextMap = new Map(byModule);
    nextMap.set(resource.id, updater(current));
    // Keep the registry order so saved JSON stays stable and readable.
    onChange(resources.map((r) => nextMap.get(r.id)).filter((m): m is ModulePermission => Boolean(m)));
  };

  return (
    <div className="space-y-2">
      {resources.map((resource) => {
        const entry = byModule.get(resource.id) ?? { module: resource.id, actions: {} };
        const fieldsExpanded = Boolean(expandedFields[resource.id]);
        const grantedCount = Object.values(entry.actions).filter(Boolean).length;

        return (
          <div key={resource.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{resource.label}</p>
                <p className="truncate text-xs text-muted-foreground">{resource.description}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {grantedCount === 0 ? "No access" : `${grantedCount} action${grantedCount === 1 ? "" : "s"}`}
              </span>
            </div>

            {/* Action checkboxes */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              {resource.actions.map((action) => (
                <label key={action} className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={Boolean(entry.actions[action])}
                    onCheckedChange={(checked) =>
                      updateModule(resource, (current) => ({
                        ...current,
                        actions: { ...current.actions, [action]: checked === true },
                      }))
                    }
                  />
                  {ACTION_LABELS[action]}
                </label>
              ))}
            </div>

            {/* Data scopes */}
            {resource.scopable && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  View scope
                  <Select
                    value={entry.scope?.view ?? "all"}
                    onValueChange={(scope) =>
                      updateModule(resource, (current) => ({
                        ...current,
                        scope: { ...current.scope, view: scope as DataScope },
                      }))
                    }
                  >
                    <SelectTrigger size="sm" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                {resource.actions.includes("edit") && (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Edit scope
                    <Select
                      value={entry.scope?.edit ?? entry.scope?.view ?? "all"}
                      onValueChange={(scope) =>
                        updateModule(resource, (current) => ({
                          ...current,
                          scope: { ...current.scope, edit: scope as DataScope },
                        }))
                      }
                    >
                      <SelectTrigger size="sm" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCOPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                )}
              </div>
            )}

            {/* Field permissions */}
            {resource.fields.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-medium text-primary"
                  onClick={() =>
                    setExpandedFields((current) => ({ ...current, [resource.id]: !fieldsExpanded }))
                  }
                >
                  {fieldsExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                  Field Permissions ({resource.fields.length})
                </button>
                {fieldsExpanded && (
                  <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-2">
                    <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 px-1 text-xs font-medium text-muted-foreground">
                      <span>Field</span>
                      <span className="text-center">Visible</span>
                      <span className="text-center">Editable</span>
                    </div>
                    {resource.fields.map((field) => {
                      const rule = entry.fields?.[field.key] ?? { visible: true, editable: true };
                      return (
                        <div
                          key={field.key}
                          className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2 px-1 text-sm"
                        >
                          <span className="truncate">{field.label}</span>
                          <span className="flex justify-center">
                            <Checkbox
                              checked={rule.visible}
                              onCheckedChange={(checked) =>
                                updateModule(resource, (current) => ({
                                  ...current,
                                  fields: {
                                    ...current.fields,
                                    [field.key]: {
                                      visible: checked === true,
                                      // Hidden fields can never be edited.
                                      editable: checked === true && rule.editable,
                                    },
                                  },
                                }))
                              }
                            />
                          </span>
                          <span className="flex justify-center">
                            <Checkbox
                              checked={rule.editable}
                              disabled={!rule.visible}
                              onCheckedChange={(checked) =>
                                updateModule(resource, (current) => ({
                                  ...current,
                                  fields: {
                                    ...current.fields,
                                    [field.key]: { visible: rule.visible, editable: checked === true },
                                  },
                                }))
                              }
                            />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
