import { useMemo } from "react";
import { Network, Users } from "lucide-react";
import { EmptyState } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { EmployeeWithStats } from "@/hooks/useEmployees";
import { getInitials } from "@/utils/format";

interface OrgChartProps {
  employees: EmployeeWithStats[];
  onViewProfile: (employee: EmployeeWithStats) => void;
}

interface PersonRowProps {
  employee: EmployeeWithStats;
  depth: number;
  childrenByManagerId: Map<string, EmployeeWithStats[]>;
  onViewProfile: (employee: EmployeeWithStats) => void;
}

function PersonRow({ employee, depth, childrenByManagerId, onViewProfile }: PersonRowProps) {
  const reports = (childrenByManagerId.get(employee.id) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  const isExEmployee = employee.status === "Ex-Employee";

  return (
    <div>
      <button
        type="button"
        onClick={() => onViewProfile(employee)}
        style={{ marginLeft: depth * 28 }}
        className={`flex w-full items-center gap-3 rounded-lg border-l-2 py-2 pl-3 pr-2 text-left hover:bg-muted ${
          isExEmployee ? "border-muted opacity-60" : "border-primary/40"
        }`}
      >
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(employee.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{employee.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {employee.role} · {employee.team}
          </p>
        </div>
        {reports.length > 0 && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {reports.length} report{reports.length === 1 ? "" : "s"}
          </Badge>
        )}
      </button>

      {reports.map((report) => (
        <PersonRow
          key={report.id}
          employee={report}
          depth={depth + 1}
          childrenByManagerId={childrenByManagerId}
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  );
}

/**
 * Reporting-line tree (from `managerId`) plus a by-team roster — the
 * "subordinates / leads / team members" directory (docs/10 People module,
 * planned Manager Hierarchy + Organization Chart).
 */
export function OrgChart({ employees, onViewProfile }: OrgChartProps) {
  const childrenByManagerId = useMemo(() => {
    const map = new Map<string, EmployeeWithStats[]>();
    for (const employee of employees) {
      if (!employee.managerId) continue;
      const list = map.get(employee.managerId) ?? [];
      list.push(employee);
      map.set(employee.managerId, list);
    }
    return map;
  }, [employees]);

  const roots = useMemo(() => {
    const ids = new Set(employees.map((e) => e.id));
    return employees
      .filter((e) => !e.managerId || !ids.has(e.managerId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const teams = useMemo(() => {
    const map = new Map<string, EmployeeWithStats[]>();
    for (const employee of employees) {
      const list = map.get(employee.team) ?? [];
      list.push(employee);
      map.set(employee.team, list);
    }
    return [...map.entries()]
      .map(([team, members]) => ({ team, members: members.slice().sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [employees]);

  if (employees.length === 0) {
    return <EmptyState icon={Users} title="No People to Show" description="There's no one in this view yet." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Network className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Reporting Structure</h3>
        </CardHeader>
        <CardContent className="space-y-1">
          {roots.map((root) => (
            <PersonRow
              key={root.id}
              employee={root}
              depth={0}
              childrenByManagerId={childrenByManagerId}
              onViewProfile={onViewProfile}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Users className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Teams</h3>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(({ team, members }) => (
            <div key={team} className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-semibold">
                {team} <span className="font-normal text-muted-foreground">({members.length})</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {members.map((member) => (
                  <button key={member.id} type="button" onClick={() => onViewProfile(member)}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/70">
                      {member.name}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
