import { useNavigate } from "react-router-dom";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight } from "lucide-react";
import { ChartCard } from "@/components/common";
import { TaskStatusBadge } from "@/components/tasks/TaskBadges";
import { Button } from "@/components/ui/button";
import type { TaskDashboardData } from "@/hooks/useTaskStats";
import { formatDate } from "@/utils/format";
import { TOOLTIP_STYLE } from "./chartTheme";

function StatTile({ value, label, alert }: { value: number; label: string; alert?: boolean }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2 text-center">
      <p className={`text-lg font-semibold ${alert && value > 0 ? "text-destructive" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * "My Tasks" dashboard widget (docs/11): personal counts, standalone vs
 * project split and the most recently updated tasks in scope.
 */
export function MyTasksWidget({ data }: { data: TaskDashboardData }) {
  const navigate = useNavigate();
  // Logins with no linked employee (e.g. a system admin account) have no personal task
  // scope to show, so this widget and its shortcut fall back to the org-wide view.
  const { hasIdentity } = data;

  return (
    <ChartCard
      title={hasIdentity ? "My Tasks" : "All Tasks"}
      description={`${data.overview.standalone.total} standalone · ${data.overview.project.total} project tasks in scope`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile value={data.my.total} label={hasIdentity ? "Assigned" : "Total"} />
          <StatTile value={data.my.inProgress} label="In Progress" />
          <StatTile value={data.my.dueToday} label="Due Today" />
          <StatTile value={data.my.overdue} label="Overdue" alert />
        </div>

        <ul className="divide-y">
          {data.recent.map((task) => (
            <li key={task.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.taskNumber} · updated {formatDate(task.updatedDate)}
                </p>
              </div>
              <TaskStatusBadge status={task.status} workflow={data.workflow} />
            </li>
          ))}
        </ul>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate(hasIdentity ? "/tasks?view=My Tasks" : "/tasks")}
        >
          Open Task Board <ArrowRight />
        </Button>
      </div>
    </ChartCard>
  );
}

/** "Tasks by Status" bar chart with a priority breakdown row (docs/11). */
export function TasksByStatusChart({ data }: { data: TaskDashboardData }) {
  return (
    <ChartCard
      title="Tasks by Status"
      description={`${data.overview.total} tasks · ${data.overview.overdue} overdue · ${data.overview.dueToday} due today`}
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.overview.byStatus} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgba(100, 116, 139, 0.08)" }}
              formatter={(value) => [`${Number(value ?? 0)} tasks`, "Count"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.overview.byStatus.map((slice) => (
                <Cell key={slice.status} fill={slice.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Priority breakdown */}
      <ul className="mt-3 grid grid-cols-4 gap-2 border-t pt-3">
        {data.overview.byPriority.map((slice) => (
          <li key={slice.priority} className="text-center">
            <p className="text-sm font-semibold">{slice.count}</p>
            <p className="text-xs text-muted-foreground">{slice.priority}</p>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
