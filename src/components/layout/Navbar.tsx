import { Bell, Brain, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/security";
import { formatNavbarDate, getInitials } from "@/utils/format";

interface NavbarProps {
  /** Opens the mobile sidebar drawer. */
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { account, currentUser, logout } = useAuth();
  const { role } = usePermission();
  const navigate = useNavigate();

  const displayName = currentUser?.name ?? account?.username ?? "Guest";

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully.");
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[70px] items-center gap-3 border-b bg-card px-4 lg:px-6">
      {/* Mobile menu trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
      >
        <Menu className="size-5" />
      </Button>

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
          <Brain className="size-5 text-primary-foreground" aria-hidden="true" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold leading-tight">AI Portfolio Dashboard</p>
          <p className="text-xs leading-tight text-muted-foreground">US Portfolio</p>
        </div>
      </div>

      {/* Global search */}
      <div className="relative ml-4 hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects, people, activities…"
          className="bg-background pl-9"
          aria-label="Global search"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Current date */}
        <span className="hidden text-sm text-muted-foreground xl:block">
          {formatNavbarDate()}
        </span>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
          onClick={() => toast.info("Notifications will arrive in a later phase.")}
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
        </Button>

        {/* Role badge */}
        {role && (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {role.name}
          </Badge>
        )}

        {/* Account menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-32 truncate text-sm font-medium md:block">{displayName}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.email ?? `Signed in as ${account?.username}`}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
