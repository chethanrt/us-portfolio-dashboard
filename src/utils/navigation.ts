import {
  BarChart3,
  CalendarDays,
  FolderKanban,
  GraduationCap,
  History,
  KanbanSquare,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ModuleId } from "@/types";

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  /** Module whose View permission controls the item's visibility. */
  module: ModuleId;
}

/** Sidebar navigation — items are filtered by the user's View permissions. */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { title: "Projects", path: "/projects", icon: FolderKanban, module: "projects" },
  { title: "Task Board", path: "/tasks", icon: KanbanSquare, module: "tasks" },
  { title: "People", path: "/people", icon: Users, module: "people" },
  { title: "Calendar", path: "/calendar", icon: CalendarDays, module: "people" },
  { title: "Skill Matrix", path: "/skills", icon: LayoutGrid, module: "skills" },
  { title: "Learning", path: "/learning", icon: GraduationCap, module: "learning" },
  { title: "POCs", path: "/pocs", icon: Lightbulb, module: "pocs" },
  { title: "Reports", path: "/reports", icon: BarChart3, module: "reports" },
  { title: "Settings", path: "/settings", icon: Settings, module: "settings" },
  { title: "User Management", path: "/users", icon: UserCog, module: "users" },
  { title: "Roles & Permissions", path: "/roles", icon: ShieldCheck, module: "roles" },
  { title: "Audit Log", path: "/audit-log", icon: History, module: "auditLog" },
];

/** Items the given permission check allows (hide modules without View). */
export function getVisibleNavItems(canView: (module: ModuleId) => boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => canView(item.module));
}
