import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils/format";
import { getNavItemsForRole } from "@/utils/navigation";

interface SidebarProps {
  /** Called after a nav item is clicked (used to close the mobile drawer). */
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const { account, currentUser, role, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = getNavItemsForRole(role);
  const displayName = currentUser?.name ?? account?.username ?? "Guest";

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully.");
    navigate("/login", { replace: true });
  };

  return (
    <div className={cn("flex h-full flex-col bg-sidebar", className)}>
      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      {/* User profile + logout */}
      <div className="p-3">
        <Separator className="mb-3" />
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{role}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleLogout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
