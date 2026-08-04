import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { LoadingSkeleton } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";

/** Redirects unauthenticated visitors to the login page. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <LoadingSkeleton variant="page" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
