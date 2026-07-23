import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskWorkflowStatus } from "@/types";

/** Priority colors per docs/11: Critical red, High orange, Medium blue, Low gray. */
const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Critical: "border-red-200 bg-red-50 text-red-700",
  High: "border-orange-200 bg-orange-50 text-orange-700",
  Medium: "border-blue-200 bg-blue-50 text-blue-700",
  Low: "border-slate-200 bg-slate-50 text-slate-600",
};

export function TaskPriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <Badge variant="outline" className={cn(PRIORITY_STYLES[priority], className)}>
      {priority}
    </Badge>
  );
}

interface TaskStatusBadgeProps {
  status: string;
  workflow: TaskWorkflowStatus[];
  className?: string;
}

/** Status badge tinted with the workflow configuration color. */
export function TaskStatusBadge({ status, workflow, className }: TaskStatusBadgeProps) {
  const color = workflow.find((s) => s.name === status)?.color ?? "#64748b";
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap", className)}
      style={{ color, backgroundColor: `${color}14`, borderColor: `${color}40` }}
    >
      {status}
    </Badge>
  );
}

/** Project name chip or the Standalone marker. */
export function TaskProjectBadge({ projectName, className }: { projectName: string | null; className?: string }) {
  if (!projectName) {
    return (
      <Badge variant="outline" className={cn("border-dashed text-muted-foreground", className)}>
        Standalone
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className={cn("max-w-36 truncate", className)} title={projectName}>
      {projectName}
    </Badge>
  );
}
