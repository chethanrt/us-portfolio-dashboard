import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TaskLookups } from "@/services/TaskFilterService";
import type { Task, TaskWorkflowStatus } from "@/types";
import { formatDate } from "@/utils/format";
import { TaskPriorityBadge, TaskProjectBadge, TaskStatusBadge } from "./TaskBadges";

function SortableHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-2 h-8" onClick={onClick}>
      {label}
      <ArrowUpDown className="size-3.5" />
    </Button>
  );
}

interface ListColumnOptions {
  lookups: TaskLookups;
  workflow: TaskWorkflowStatus[];
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  canEdit: (task: Task) => boolean;
  canDelete: (task: Task) => boolean;
  isFieldVisible: (field: string) => boolean;
}

/** List View columns (docs/11) — fields hidden by field-level security are dropped. */
export function buildTaskListColumns({
  lookups,
  workflow,
  onOpen,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  isFieldVisible,
}: ListColumnOptions): ColumnDef<Task>[] {
  const today = new Date().toISOString().slice(0, 10);

  const columns: (ColumnDef<Task> & { field?: string })[] = [
    {
      accessorKey: "taskNumber",
      header: ({ column }) => (
        <SortableHeader label="Task" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="whitespace-nowrap text-sm font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original)}
        >
          {row.original.taskNumber}
        </button>
      ),
    },
    {
      field: "title",
      accessorKey: "title",
      header: ({ column }) => (
        <SortableHeader label="Title" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <p className="max-w-72 truncate font-medium" title={row.original.title}>
          {row.original.title}
        </p>
      ),
    },
    {
      field: "projectId",
      id: "project",
      accessorFn: (task) => (task.projectId ? lookups.projectsById.get(task.projectId)?.name ?? "" : ""),
      header: "Project",
      cell: ({ row }) => (
        <TaskProjectBadge
          projectName={
            row.original.projectId ? lookups.projectsById.get(row.original.projectId)?.name ?? null : null
          }
        />
      ),
    },
    { field: "category", accessorKey: "category", header: "Category" },
    {
      field: "assigneeId",
      id: "assignee",
      accessorFn: (task) => lookups.employeesById.get(task.assigneeId)?.name ?? "",
      header: ({ column }) => (
        <SortableHeader label="Assignee" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {lookups.employeesById.get(row.original.assigneeId)?.name ?? "Unknown"}
        </span>
      ),
    },
    {
      field: "priority",
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <TaskPriorityBadge priority={row.original.priority} />,
    },
    {
      field: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <TaskStatusBadge status={row.original.status} workflow={workflow} />,
    },
    {
      field: "estimateHours",
      accessorKey: "estimateHours",
      header: ({ column }) => (
        <SortableHeader label="Est." onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span>{row.original.estimateHours ? `${row.original.estimateHours}h` : "—"}</span>,
    },
    {
      field: "actualHours",
      accessorKey: "actualHours",
      header: "Actual",
      cell: ({ row }) => <span>{row.original.actualHours ? `${row.original.actualHours}h` : "—"}</span>,
    },
    {
      field: "dueDate",
      accessorKey: "dueDate",
      header: ({ column }) => (
        <SortableHeader label="Due" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => {
        const { dueDate, percentComplete } = row.original;
        if (!dueDate) return <span className="text-muted-foreground">—</span>;
        const overdue = dueDate < today && percentComplete < 100;
        return (
          <span className={overdue ? "font-medium text-destructive" : undefined}>{formatDate(dueDate)}</span>
        );
      },
    },
    {
      field: "aiTool",
      accessorKey: "aiTool",
      header: "AI Tool",
      cell: ({ row }) =>
        row.original.aiTool ? (
          <Badge variant="secondary">{row.original.aiTool}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canEdit(row.original) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${row.original.taskNumber}`}
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="size-4" />
            </Button>
          )}
          {canDelete(row.original) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${row.original.taskNumber}`}
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return columns
    .filter((column) => !column.field || isFieldVisible(column.field))
    .map(({ field: _field, ...column }) => column);
}
