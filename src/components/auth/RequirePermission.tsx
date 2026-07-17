import type { ReactNode } from "react";
import { LoadingSkeleton } from "@/components/common";
import { usePermission } from "@/security";
import type { ModuleId } from "@/types";
import AccessDenied from "@/pages/AccessDenied";

interface RequirePermissionProps {
  /** Module the route belongs to — View permission is required to render. */
  module: ModuleId;
  children: ReactNode;
}

/** Route guard: renders the Access Denied page without View permission. */
export function RequirePermission({ module, children }: RequirePermissionProps) {
  const { isLoading, canView } = usePermission();

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!canView(module)) {
    return <AccessDenied />;
  }

  return children;
}
