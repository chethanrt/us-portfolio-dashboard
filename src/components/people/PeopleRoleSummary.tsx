import { Card, CardContent } from "@/components/ui/card";
import type { Employee } from "@/types";

interface PeopleRoleSummaryProps {
  employees: Employee[];
  /** Settings-managed role list (Settings > Roles) — drives the tiles, never a hardcoded role set. */
  roles: string[];
}

/**
 * Live headcount by role. Every count is computed on render from the
 * current `employees`/`roles` data — nothing here is a stored or cached
 * number, so a new role added in Settings or a status/role change on an
 * employee shows up immediately without any separate sync step.
 */
export function PeopleRoleSummary({ employees, roles }: PeopleRoleSummaryProps) {
  const activeEmployees = employees.filter((e) => e.status !== "Ex-Employee");
  const roleCounts = [...roles]
    .sort((a, b) => a.localeCompare(b))
    .map((role) => ({ role, count: activeEmployees.filter((e) => e.role === role).length }));

  return (
    <Card className="shadow-sm">
      <CardContent>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-lg bg-muted p-2 text-center">
            <dd className="text-lg font-semibold">{activeEmployees.length}</dd>
            <dt className="text-xs text-muted-foreground">Total Team Members</dt>
          </div>
          {roleCounts.map(({ role, count }) => (
            <div key={role} className="rounded-lg bg-muted p-2 text-center">
              <dd className="text-lg font-semibold">{count}</dd>
              <dt className="truncate text-xs text-muted-foreground" title={role}>
                {role}
              </dt>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
