import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task, TaskWorkflowStatus } from "@/types";
import type { TaskLookups } from "@/services/TaskFilterService";
import { TaskCard } from "./TaskCard";
import type { TaskCardActions } from "./TaskCard";

export interface TaskCardPermissions {
  canEditTask: (task: Task) => boolean;
  canDeleteTask: (task: Task) => boolean;
  canDuplicate: boolean;
}

interface SortableTaskCardProps {
  task: Task;
  lookups: TaskLookups;
  actions: TaskCardActions;
  permissions: TaskCardPermissions;
  dragDisabled: boolean;
}

/** dnd-kit sortable wrapper around the memoized TaskCard. */
function SortableTaskCard({ task, lookups, actions, permissions, dragDisabled }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
    disabled: dragDisabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        assigneeName={lookups.employeesById.get(task.assigneeId)?.name ?? "Unknown"}
        projectName={task.projectId ? lookups.projectsById.get(task.projectId)?.name ?? null : null}
        actions={actions}
        canEdit={permissions.canEditTask(task)}
        canDelete={permissions.canDeleteTask(task)}
        canDuplicate={permissions.canDuplicate}
        isDragging={isDragging}
      />
    </div>
  );
}

interface TaskColumnProps {
  status: TaskWorkflowStatus;
  tasks: Task[];
  lookups: TaskLookups;
  actions: TaskCardActions;
  permissions: TaskCardPermissions;
  canCreate: boolean;
  onAddTask: (status: string) => void;
  /** Users without edit permission cannot drag cards. */
  dragDisabled: boolean;
}

function TaskColumnInner({
  status,
  tasks,
  lookups,
  actions,
  permissions,
  canCreate,
  onAddTask,
  dragDisabled,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status.name}`, data: { status: status.name } });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: status.color }} aria-hidden="true" />
        <h3 className="text-sm font-semibold">{status.name}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2",
          isOver && "rounded-lg bg-primary/5"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
              No Tasks
            </p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                lookups={lookups}
                actions={actions}
                permissions={permissions}
                dragDisabled={dragDisabled || !permissions.canEditTask(task)}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Add task */}
      {canCreate && (
        <Button
          variant="ghost"
          size="sm"
          className="mx-2 mb-2 justify-start text-muted-foreground"
          onClick={() => onAddTask(status.name)}
        >
          <Plus /> Add Task
        </Button>
      )}
    </div>
  );
}

export const TaskColumn = memo(TaskColumnInner);
