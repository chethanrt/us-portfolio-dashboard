import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { PermissionProvider } from "@/security";
import type { ModuleId } from "@/types";

const Login = lazy(() => import("@/pages/Login"));

// Pages are lazy-loaded; AppLayout renders a LoadingSkeleton while a chunk loads.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Projects = lazy(() => import("@/pages/Projects"));
const TaskBoard = lazy(() => import("@/pages/TaskBoard"));
const Activities = lazy(() => import("@/pages/Activities"));
const People = lazy(() => import("@/pages/People"));
const CalendarPage = lazy(() => import("@/pages/Calendar"));
const SkillMatrix = lazy(() => import("@/pages/SkillMatrix"));
const AIAdoption = lazy(() => import("@/pages/AIAdoption"));
const Learning = lazy(() => import("@/pages/Learning"));
const POCs = lazy(() => import("@/pages/POCs"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));
const Users = lazy(() => import("@/pages/Users"));
const Roles = lazy(() => import("@/pages/Roles"));
const AuditLog = lazy(() => import("@/pages/AuditLog"));

/** Route table — every page is protected by its module's View permission. */
const PROTECTED_ROUTES: { path: string; module: ModuleId; Page: LazyExoticComponent<ComponentType> }[] = [
  { path: "/dashboard", module: "dashboard", Page: Dashboard },
  { path: "/projects", module: "projects", Page: Projects },
  { path: "/tasks", module: "tasks", Page: TaskBoard },
  { path: "/activities", module: "activities", Page: Activities },
  { path: "/people", module: "people", Page: People },
  { path: "/calendar", module: "people", Page: CalendarPage },
  { path: "/skills", module: "skills", Page: SkillMatrix },
  { path: "/ai-adoption", module: "aiAdoption", Page: AIAdoption },
  { path: "/learning", module: "learning", Page: Learning },
  { path: "/pocs", module: "pocs", Page: POCs },
  { path: "/reports", module: "reports", Page: Reports },
  { path: "/settings", module: "settings", Page: Settings },
  { path: "/users", module: "users", Page: Users },
  { path: "/roles", module: "roles", Page: Roles },
  { path: "/audit-log", module: "auditLog", Page: AuditLog },
];

export default function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              {PROTECTED_ROUTES.map(({ path, module, Page }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <RequirePermission module={module}>
                      <Page />
                    </RequirePermission>
                  }
                />
              ))}
              {/* Unknown routes redirect to Dashboard per docs/04 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton duration={3000} />
      </PermissionProvider>
    </AuthProvider>
  );
}
