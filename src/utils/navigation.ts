import {
  BarChart3,
  Brain,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  /** Roles allowed to see this page. Omit to allow every role. */
  roles?: UserRole[];
}

/**
 * Sidebar navigation. Per docs/05, every role can view all modules except
 * Settings (Director/DM/EM + Super Admin) and User Management (Super Admin).
 */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", path: "/projects", icon: FolderKanban },
  { title: "AI Activities", path: "/activities", icon: Brain },
  { title: "People", path: "/people", icon: Users },
  { title: "Skill Matrix", path: "/skills", icon: LayoutGrid },
  { title: "Learning", path: "/learning", icon: GraduationCap },
  { title: "POCs", path: "/pocs", icon: Lightbulb },
  { title: "Reports", path: "/reports", icon: BarChart3 },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["Super Admin", "Director", "Delivery Manager", "Engineering Manager"],
  },
  {
    title: "User Management",
    path: "/users",
    icon: UserCog,
    roles: ["Super Admin", "Director"],
  },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
