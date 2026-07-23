import { createContext } from "react";
import type { DataScope, ModuleId, PermissionAction, Role } from "@/types";

/** Dashboard data scope derived from the dashboard module's view scope. */
export type DashboardScope = "portfolio" | "team" | "personal";

export interface PermissionContextValue {
  /** True while the signed-in user's role and permissions are loading. */
  isLoading: boolean;
  /** The signed-in user's role, or null when signed out. */
  role: Role | null;

  // Module + action checks --------------------------------------------------
  hasPermission: (module: ModuleId, action: PermissionAction) => boolean;
  canView: (module: ModuleId) => boolean;
  canCreate: (module: ModuleId) => boolean;
  canEdit: (module: ModuleId) => boolean;
  canDelete: (module: ModuleId) => boolean;
  canExport: (module: ModuleId) => boolean;

  // Field-level security ----------------------------------------------------
  canViewField: (module: ModuleId, field: string) => boolean;
  canEditField: (module: ModuleId, field: string) => boolean;

  // Row-level scope ---------------------------------------------------------
  getViewScope: (module: ModuleId) => DataScope;
  getEditScope: (module: ModuleId) => DataScope;
  /** True when the user only sees their own records in this module. */
  isOwnDataScope: (module: ModuleId) => boolean;
  /** Edit/delete a specific record owned by an employee. */
  canEditRow: (module: ModuleId, ownerEmployeeId: string) => boolean;
  canDeleteRow: (module: ModuleId, ownerEmployeeId: string) => boolean;

  /** Data scope driving dashboard widgets and KPIs. */
  dashboardScope: DashboardScope;
}

export const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);
