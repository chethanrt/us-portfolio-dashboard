import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { employeeService, userService } from "@/services";
import type { Employee, User } from "@/types";

const SESSION_STORAGE_KEY = "ai-portfolio-dashboard.session";

export interface AuthContextValue {
  /** The logged-in account, or null when signed out. */
  account: User | null;
  /** The employee linked to the account (null for Super Admin). */
  currentUser: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Returns true on success; false shows "invalid credentials". */
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on startup.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const employeeList = await employeeService.getAll();
        if (cancelled) return;
        setEmployees(employeeList);

        const sessionUserId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionUserId) {
          const user = await userService.getById(sessionUserId);
          if (!cancelled && user && user.status === "Active") setAccount(user);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const user = await userService.authenticate(username, password);
    if (!user) return false;
    localStorage.setItem(SESSION_STORAGE_KEY, user.id);
    setAccount(user);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setAccount(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const currentUser = account?.employeeId
      ? employees.find((e) => e.id === account.employeeId) ?? null
      : null;
    return {
      account,
      currentUser,
      isAuthenticated: Boolean(account),
      isLoading,
      login,
      logout,
    };
  }, [account, employees, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
