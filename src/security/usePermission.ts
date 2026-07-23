import { useContext } from "react";
import { PermissionContext } from "./PermissionContext";
import type { PermissionContextValue } from "./PermissionContext";

/** Access the permission framework: hasPermission, canView, canViewField, … */
export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermission must be used within a PermissionProvider");
  }
  return context;
}
