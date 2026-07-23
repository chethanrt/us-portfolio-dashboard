import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";

const Login = lazy(() => import("@/pages/Login"));

// Pages are lazy-loaded; AppLayout renders a LoadingSkeleton while a chunk loads.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Projects = lazy(() => import("@/pages/Projects"));
const Activities = lazy(() => import("@/pages/Activities"));
const People = lazy(() => import("@/pages/People"));
const SkillMatrix = lazy(() => import("@/pages/SkillMatrix"));
const Learning = lazy(() => import("@/pages/Learning"));
const POCs = lazy(() => import("@/pages/POCs"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));
const Users = lazy(() => import("@/pages/Users"));

export default function App() {
  return (
    <AuthProvider>
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/people" element={<People />} />
            <Route path="/skills" element={<SkillMatrix />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/pocs" element={<POCs />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<Users />} />
            {/* Unknown routes redirect to Dashboard per docs/04 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
