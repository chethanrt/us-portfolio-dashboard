import type {
  DataScope,
  ModuleId,
  ModulePermission,
  PermissionAction,
} from "@/types";

/**
 * Permission evaluator — the runtime side of the framework.
 *
 * One instance is built per signed-in user from their role's
 * ModulePermission list (see src/services/PermissionService for the data
 * layer). Everything defaults to DENY: a module missing from the list grants
 * nothing. Fields default to visible + editable once the module itself is
 * viewable, so field rules only need to list exceptions.
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
