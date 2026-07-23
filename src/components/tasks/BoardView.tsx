import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { taskBoardService } from "@/services";
import type { TaskGroup } from "@/services/TaskBoardService";
import type { TaskLookups } from "@/services/TaskFilterService";
import type { Task, TaskWorkflowStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import type { TaskCardActions } from "./TaskCard";
import { TaskColumn } from "./TaskColumn";
import type { TaskCardPermissions } from "./TaskColumn";

interface BoardViewProps {
  tasks: Task[];
  workflow: TaskWorkflowStatus[];
  lookups: TaskLookups;
  actions: TaskCardActions;
  permissions: TaskCardPermissions;
  canCreate: boolean;
  onAddTask: (status: string) => void;
  /** Persist a drop: the moved task, its new status and final column state. */
  onDrop: (movedTaskId: string, targetStatus: string, columns: TaskGroup[]) => void;
  /** Disables all dragging (e.g. no edit permission at all). */
  dragDisabled: boolean;
}

/**
 * Kanban board (docs/11): one column per workflow status, @dnd-kit
 * drag-and-drop within and across columns. Columns are kept in local state
 * while dragging so cards move live, then the final layout is persisted.
 */
export function BoardView({
  tasks,
  workflow,
  lookups,
  actions,
  permissions,
  canCreate,
  onAddTask,
  onDrop,
  dragDisabled,
}: BoardViewProps) {
  const [columns, setColumns] = useState<TaskGroup[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // A small drag distance keeps plain clicks opening the drawer.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Resync from data whenever tasks change (outside of an active drag).
  useEffect(() => {
    setColumns(taskBoardService.groupByStatus(tasks, workflow));
  }, [tasks, workflow]);

  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const findColumn = (id: string): TaskGroup | undefined => {
    if (id.startsWith("column:")) return columns.find((c) => c.key === id.slice("column:".length));
    return columns.find((c) => c.tasks.some((t) => t.id === id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(taskById.get(String(event.active.id)) ?? null);
  };

  /** Moves the card between columns live while hovering. */
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const source = findColumn(String(active.id));
    const target = findColumn(String(over.id));
    if (!source || !target || source.key === target.key) return;

    setColumns((current) => {
      const task = source.tasks.find((t) => t.id === active.id);
      if (!task) return current;
      const overIndex = target.tasks.findIndex((t) => t.id === over.id);
      const insertAt = overIndex === -1 ? target.tasks.length : overIndex;
      return current.map((column) => {
        if (column.key === source.key) {
          return { ...column, tasks: column.tasks.filter((t) => t.id !== active.id) };
        }
        if (column.key === target.key) {
          const next = [...column.tasks];
          next.splice(insertAt, 0, task);
          return { ...column, tasks: next };
        }
        return column;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const column = findColumn(String(active.id));
    if (!column) return;

    // Reorder within the (possibly new) column.
    const fromIndex = column.tasks.findIndex((t) => t.id === active.id);
    const overColumn = findColumn(String(over.id));
    let finalColumns = columns;
    if (overColumn && overColumn.key === column.key && String(over.id) !== String(active.id)) {
      const toIndex = column.tasks.findIndex((t) => t.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        finalColumns = columns.map((c) =>
          c.key === column.key ? { ...c, tasks: arrayMove(c.tasks, fromIndex, toIndex) } : c
        );
        setColumns(finalColumns);
      }
    }

    onDrop(String(active.id), column.key, finalColumns);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex items-start gap-3 overflow-x-auto pb-2">
        {columns.map((column) => {
          const status = workflow.find((s) => s.name === column.key);
          if (!status) return null;
          return (
            <TaskColumn
              key={column.key}
              status={status}
              tasks={column.tasks}
              lookups={lookups}
              actions={actions}
              permissions={permissions}
              canCreate={canCreate}
              onAddTask={onAddTask}
              dragDisabled={dragDisabled}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            assigneeName={lookups.employeesById.get(activeTask.assigneeId)?.name ?? "Unknown"}
            projectName={
              activeTask.projectId ? lookups.projectsById.get(activeTask.projectId)?.name ?? null : null
            }
            actions={actions}
            canEdit={false}
            canDelete={false}
            canDuplicate={false}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
