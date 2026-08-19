import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { employeeService, userService } from "@/services";
import type { Employee, User } from "@/types";

export interface AuthContextValue {
  /** The logged-in account, or null when signed out. */
  account: User | null;
  /** The employee linked to the account (null for Super Admin). */
  currentUser: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Returns true on success, false on bad credentials; rethrows anything else (rate limit, network/server error). */
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on startup — ask the server who (if anyone) the
  // session cookie belongs to, rather than trusting a client-side flag.
  // Employees are only fetched once we know there's an authenticated
  // session, since /api/employees now requires one.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const user = await userService.me();
        if (cancelled) return;
        if (user && user.status === "Active") {
          setAccount(user);
          const employeeList = await employeeService.getAll();
          if (!cancelled) setEmployees(employeeList);
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
    // Only a genuine bad-credentials response resolves to false (shows
    // "invalid username or password"); anything else (rate limit, network
    // hiccup, backend not reachable yet) rethrows so Login.tsx can tell the
    // user what actually happened instead of blaming their password.
    let user: User;
    try {
      user = await userService.authenticate(username, password);
    } catch (err) {
      if (err instanceof Error && err.message === "INVALID_CREDENTIALS") return false;
      throw err;
    }
    setAccount(user);
    setEmployees(await employeeService.getAll());
    return true;
  }, []);

  const logout = useCallback(() => {
    setAccount(null);
    setEmployees([]);
    // Fire-and-forget: the UI signs out immediately regardless of how long
    // the server takes to delete the session row server-side. The logout
    // audit event is recorded there too (server/routes/users.ts), using the
    // verified session's user id rather than a client-supplied header.
    void userService.logout();
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
