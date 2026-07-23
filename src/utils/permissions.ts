/**
 * @deprecated The hardcoded role checks that used to live here were replaced
 * by the permission framework in src/security. Use usePermission() —
 * hasPermission / canView / canCreate / canEdit / canDelete / canExport /
 * canViewField / canEditField — instead of role comparisons.
 */
export type { DashboardScope } from "@/security";
