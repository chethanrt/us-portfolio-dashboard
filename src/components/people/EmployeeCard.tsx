import { Pencil, UserX } from "lucide-react";
import { StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { EmployeeWithStats } from "@/hooks/useEmployees";
import { getInitials } from "@/utils/format";

interface EmployeeCardProps {
  employee: EmployeeWithStats;
  /** Whether the signed-in user can edit this employee. */
  canEdit: boolean;
  /** Whether the signed-in user can remove (offboard) this employee. */
  canDelete: boolean;
  /** False flags a data-integrity gap: an active employee with no login account. */
  hasAccount?: boolean;
  onViewProfile: (employee: EmployeeWithStats) => void;
  onEdit: (employee: EmployeeWithStats) => void;
  onRemove: (employee: EmployeeWithStats) => void;
}

export function EmployeeCard({
  employee,
  canEdit,
  canDelete,
  hasAccount = true,
  onViewProfile,
  onEdit,
  onRemove,
}: EmployeeCardProps) {
  const isExEmployee = employee.status === "Ex-Employee";
  return (
    <Card className="flex flex-col shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <Avatar className="size-11">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(employee.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{employee.name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {employee.role} · {employee.experience} yr{employee.experience === 1 ? "" : "s"}
          </p>
        </div>
        {employee.status !== "Active" && <StatusBadge status={employee.status} />}
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{employee.primarySkill}</Badge>
          {employee.secondarySkill && <Badge variant="outline">{employee.secondarySkill}</Badge>}
          {!hasAccount && !isExEmployee && (
            <Badge variant="destructive" title="No linked login account — add one in User Management">
              No Login Account
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground" title={employee.currentProject}>
          Project: <span className="text-foreground">{employee.currentProject}</span>
        </p>

        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-2 text-center">
          <div>
            <dd className="text-sm font-semibold">{employee.stats.activities}</dd>
            <dt className="text-xs text-muted-foreground">Activities</dt>
          </div>
          <div>
            <dd className="text-sm font-semibold">{employee.stats.learningProgress}%</dd>
            <dt className="text-xs text-muted-foreground">Learning</dt>
          </div>
          <div>
            <dd className="text-sm font-semibold">{employee.stats.pocs}</dd>
            <dt className="text-xs text-muted-foreground">POCs</dt>
          </div>
        </dl>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => onViewProfile(employee)}>
          View Profile
        </Button>
        <div className="flex gap-1">
          {canEdit && (
            <Button variant="ghost" size="icon" aria-label={`Edit ${employee.name}`} onClick={() => onEdit(employee)}>
              <Pencil className="size-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${employee.name}`}
              title={isExEmployee ? "Already marked as Ex-Employee" : "Mark as Ex-Employee"}
              disabled={isExEmployee}
              className="text-destructive hover:text-destructive"
              onClick={() => onRemove(employee)}
            >
              <UserX className="size-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
