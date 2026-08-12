import { Drawer, LoadingSkeleton, ProgressBar, SkillBadge, StatusBadge } from "@/components/common";
import { TaskStatusBadge } from "@/components/tasks/TaskBadges";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useEmployeeDetails } from "@/hooks/useEmployeeDetails";
import type { EmployeeWithStats } from "@/hooks/useEmployees";
import { useScopedTasks } from "@/hooks/useScopedTasks";
import { usePermission } from "@/security";
import { taskStatisticsService } from "@/services";
import type { SkillLevel } from "@/types";
import { formatDate } from "@/utils/format";
import { canViewCalendar } from "@/utils/permissions";
import { SKILL_COLUMNS } from "@/utils/skills";
import { PeopleCalendar } from "./PeopleCalendar";

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

interface EmployeeProfileDrawerProps {
  employee: EmployeeWithStats | null;
  /** Display name of whoever `employee.managerId` points to, if any. */
  managerName?: string;
  onClose: () => void;
}

export function EmployeeProfileDrawer({ employee, managerName, onClose }: EmployeeProfileDrawerProps) {
  const { details, isLoading } = useEmployeeDetails(employee);
  const { currentUser } = useAuth();
  // Field-level security: hidden fields are omitted from the drawer.
  const { canViewField, role, canView } = usePermission();
  const show = (field: string) => canViewField("people", field);

  // Task Board integration (docs/11 People integration).
  const showTasks = canView("tasks");
  const { tasks, workflow } = useScopedTasks(showTasks && Boolean(employee));
  const taskSummary = employee ? taskStatisticsService.employeeSummary(tasks, employee.id) : null;
  const employeeTasks = employee
    ? tasks
        .filter((task) => task.assigneeId === employee.id && !task.archived)
        .sort((a, b) => b.updatedDate.localeCompare(a.updatedDate))
    : [];

  if (!employee) return null;

  const canViewEmployeeCalendar = canViewCalendar(role?.id, employee.id, currentUser?.id);

  const headerParts = [
    show("role") ? employee.role : null,
    show("team") ? `${employee.team} team` : null,
    show("email") ? employee.email : null,
  ].filter(Boolean);

  return (
    <Drawer
      open={Boolean(employee)}
      onOpenChange={(open) => !open && onClose()}
      title={employee.name}
      description={headerParts.join(" · ")}
    >
      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile value={employee.stats.activities} label="Activities" />
        <StatTile value={`${employee.stats.hoursSaved}h`} label="Hours Saved" />
        <StatTile value={`${employee.stats.learningProgress}%`} label="Learning" />
        <StatTile value={employee.stats.pocs} label="POCs" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          {showTasks && <TabsTrigger value="tasks">Tasks</TabsTrigger>}
          <TabsTrigger value="pocs">POCs</TabsTrigger>
          {canViewEmployeeCalendar && <TabsTrigger value="calendar">Calendar</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-2">
          <InfoRow label="Employee ID" value={employee.id} />
          {show("role") && <InfoRow label="Role" value={employee.role} />}
          {show("experience") && <InfoRow label="Experience" value={`${employee.experience} years`} />}
          {show("team") && <InfoRow label="Team" value={employee.team} />}
          {show("primarySkill") && <InfoRow label="Primary Technology" value={employee.primarySkill} />}
          {show("secondarySkill") && (
            <InfoRow label="Secondary Technology" value={employee.secondarySkill || "—"} />
          )}
          {show("projects") && (
            <InfoRow
              label={employee.projects.length === 1 ? "Project" : "Projects"}
              value={employee.projects.length > 0 ? employee.projects.join(", ") : "—"}
            />
          )}
          {show("managerId") && <InfoRow label="Reports To" value={managerName ?? "—"} />}
          {show("status") && (
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={employee.status} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          {isLoading || !details ? (
            <LoadingSkeleton variant="list" count={4} />
          ) : !details.skills ? (
            <p className="text-sm text-muted-foreground">No skill record found.</p>
          ) : (
            <ul className="space-y-2">
              {SKILL_COLUMNS.map(({ key, label }) => (
                <li key={key} className="flex items-center justify-between gap-2 text-sm">
                  <span>{label}</span>
                  <SkillBadge level={details.skills![key] as SkillLevel} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="learning" className="mt-4 space-y-4">
          {isLoading || !details ? (
            <LoadingSkeleton variant="list" count={3} />
          ) : details.learning.length === 0 ? (
            <p className="text-sm text-muted-foreground">No learning records.</p>
          ) : (
            details.learning.map((record) => (
              <div key={record.id} className="space-y-1.5 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{record.course}</p>
                  <StatusBadge status={record.status} />
                </div>
                <ProgressBar value={record.progress} showValue />
                <p className="text-xs text-muted-foreground">
                  {record.platform} · {record.hours}h
                  {record.completionDate ? ` · Completed ${formatDate(record.completionDate)}` : ""}
                </p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="activities" className="mt-4 space-y-2">
          {isLoading || !details ? (
            <LoadingSkeleton variant="list" count={4} />
          ) : details.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No AI activities logged.</p>
          ) : (
            details.activities.slice(0, 8).map((activity) => (
              <div key={activity.id} className="rounded-lg border p-2.5">
                <p className="truncate text-sm font-medium">{activity.promptSummary}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.tool} · {activity.category} · {formatDate(activity.date)} ·{" "}
                  {activity.hoursSaved}h saved
                </p>
              </div>
            ))
          )}
        </TabsContent>

        {showTasks && (
          <TabsContent value="tasks" className="mt-4 space-y-4">
            {taskSummary && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile value={taskSummary.total} label="Assigned" />
                <StatTile value={taskSummary.completed} label="Completed" />
                <StatTile value={taskSummary.overdue} label="Overdue" />
                <StatTile value={`${taskSummary.actualHours}/${taskSummary.estimateHours}h`} label="Actual / Est." />
              </div>
            )}
            {taskSummary && (
              <p className="text-xs text-muted-foreground">
                {taskSummary.projectTasks} project task{taskSummary.projectTasks === 1 ? "" : "s"} ·{" "}
                {taskSummary.standalone} standalone · {taskSummary.inProgress} in progress
              </p>
            )}
            {employeeTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks assigned.</p>
            ) : (
              employeeTasks.slice(0, 8).map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.taskNumber} · {task.priority}
                      {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ""}
                    </p>
                  </div>
                  <TaskStatusBadge status={task.status} workflow={workflow} />
                </div>
              ))
            )}
          </TabsContent>
        )}

        <TabsContent value="pocs" className="mt-4 space-y-2">
          {isLoading || !details ? (
            <LoadingSkeleton variant="list" count={2} />
          ) : details.pocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No POCs owned.</p>
          ) : (
            details.pocs.map((poc) => (
              <div key={poc.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{poc.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{poc.businessValue}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{poc.category}</Badge>
                  <StatusBadge status={poc.status} />
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {canViewEmployeeCalendar && (
          <TabsContent value="calendar" className="mt-4">
            <PeopleCalendar employee={employee} />
          </TabsContent>
        )}
      </Tabs>
    </Drawer>
  );
}
