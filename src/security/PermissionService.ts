import type {
  DataScope,
  ModuleId,
  ModulePermission,
  PermissionAction,
} from "@/types";

/**
 * Merges a role's ModulePermission[] with a user's own overrides.
 * Override actions always win; an action key absent from the override
 * means "inherit the role default". Scope and field rules are never
 * overridden — they always come from the role. A module the role doesn't
 * grant at all but the override does gets added standalone.
 */
export function mergeModulePermissions(
  roleModules: ModulePermission[],
  overrideModules: ModulePermission[]
): ModulePermission[] {
  const merged = new Map(roleModules.map((entry) => [entry.module, { ...entry, actions: { ...entry.actions } }]));
  for (const override of overrideModules) {
    const existing = merged.get(override.module);
    if (existing) {
      existing.actions = { ...existing.actions, ...override.actions };
    } else {
      merged.set(override.module, { module: override.module, actions: { ...override.actions } });
    }
  }
  return [...merged.values()];
}

/**
 * Permission evaluator — the runtime side of the framework.
 *
 * One instance is built per signed-in user from their role's
 * ModulePermission list (see src/services/PermissionService for the data
 * layer), merged with any user-specific overrides. Everything defaults to
 * DENY: a module missing from the list grants nothing. Fields default to
 * visible + editable once the module itself is viewable, so field rules
 * only need to list exceptions.
 */
export class PermissionService {
  private readonly modules: Map<ModuleId, ModulePermission>;

  constructor(modules: ModulePermission[]) {
    this.modules = new Map(modules.map((entry) => [entry.module, entry]));
  }

  /** An evaluator that denies everything (signed out / role still loading). */
  static denyAll(): PermissionService {
    return new PermissionService([]);
  }

  /** Builds an evaluator from a role's modules plus that user's own overrides. */
  static fromRoleAndOverrides(roleModules: ModulePermission[], overrideModules: ModulePermission[] = []): PermissionService {
    return new PermissionService(mergeModulePermissions(roleModules, overrideModules));
  }

  hasPermission(module: ModuleId, action: PermissionAction): boolean {
    return Boolean(this.modules.get(module)?.actions[action]);
  }

  canView(module: ModuleId): boolean {
    return this.hasPermission(module, "view");
  }

  canCreate(module: ModuleId): boolean {
    return this.hasPermission(module, "create");
  }

  canEdit(module: ModuleId): boolean {
    return this.hasPermission(module, "edit");
  }

  canDelete(module: ModuleId): boolean {
    return this.hasPermission(module, "delete");
  }

  canExport(module: ModuleId): boolean {
    return this.hasPermission(module, "export");
  }

  /** Row scope when reading records. Defaults to "all". */
  getViewScope(module: ModuleId): DataScope {
    return this.modules.get(module)?.scope?.view ?? "all";
  }

  /** Row scope when mutating records. Falls back to the view scope. */
  getEditScope(module: ModuleId): DataScope {
    const scope = this.modules.get(module)?.scope;
    return scope?.edit ?? scope?.view ?? "all";
  }

  canViewField(module: ModuleId, field: string): boolean {
    if (!this.canView(module)) return false;
    return this.modules.get(module)?.fields?.[field]?.visible ?? true;
  }

  canEditField(module: ModuleId, field: string): boolean {
    if (!this.canViewField(module, field)) return false;
    return this.modules.get(module)?.fields?.[field]?.editable ?? true;
  }
}
