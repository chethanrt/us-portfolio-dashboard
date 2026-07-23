import type { TaskGroup } from "@/services/TaskBoardService";
import type { TaskLookups } from "@/services/TaskFilterService";
import type { TaskWorkflowStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import type { TaskCardActions } from "./TaskCard";
import type { TaskCardPermissions } from "./TaskColumn";

interface GroupedViewProps {
  groups: TaskGroup[];
  workflow: TaskWorkflowStatus[];
  lookups: TaskLookups;
  actions: TaskCardActions;
  permissions: TaskCardPermissions;
}

/**
 * Stacked sections used when grouping by Project / Assignee / Category /
 * Priority (docs/11 Grouping). Cards show their status badge because the
 * column no longer implies it. Drag-and-drop applies to Status grouping only.
 */
export function GroupedView({ groups, workflow, lookups, actions, permissions }: GroupedViewProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            {group.label}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {group.tasks.length}
            </span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeName={lookups.employeesById.get(task.assigneeId)?.name ?? "Unknown"}
                projectName={task.projectId ? lookups.projectsById.get(task.projectId)?.name ?? null : null}
                actions={actions}
                canEdit={permissions.canEditTask(task)}
                canDelete={permissions.canDeleteTask(task)}
                canDuplicate={permissions.canDuplicate}
                showStatus
                workflow={workflow}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
