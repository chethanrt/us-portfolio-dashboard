import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActivityRow } from "@/hooks/useActivities";
import { formatDate } from "@/utils/format";

function SortableHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-2 h-8" onClick={onClick}>
      {label}
      <ArrowUpDown className="size-3.5" />
    </Button>
  );
}

export function buildActivityColumns(
  onEdit: (row: ActivityRow) => void,
  onDelete: (row: ActivityRow) => void,
  canEdit: (row: ActivityRow) => boolean,
  canDelete: (row: ActivityRow) => boolean,
  /** Field-level security: columns whose field is not visible are dropped. */
  isFieldVisible: (field: string) => boolean
): ColumnDef<ActivityRow>[] {
  const columns: (ColumnDef<ActivityRow> & { field?: string })[] = [
    {
      field: "date",
      accessorKey: "date",
      header: ({ column }) => (
        <SortableHeader label="Date" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.date)}</span>,
    },
    {
      field: "employeeId",
      accessorKey: "employeeName",
      header: ({ column }) => (
        <SortableHeader label="Employee" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium">{row.original.employeeName}</p>
          {isFieldVisible("promptSummary") && (
            <p className="max-w-44 truncate text-xs text-muted-foreground" title={row.original.promptSummary}>
              {row.original.promptSummary}
            </p>
          )}
        </div>
      ),
    },
    {
      field: "projectId",
      accessorKey: "projectName",
      header: "Project",
      cell: ({ row }) => <span className="whitespace-nowrap">{row.original.projectName}</span>,
    },
    {
      field: "tool",
      accessorKey: "tool",
      header: "Tool",
      cell: ({ row }) => <Badge variant="secondary">{row.original.tool}</Badge>,
    },
    { field: "category", accessorKey: "category", header: "Category" },
    {
      field: "projectStage",
      accessorKey: "projectStage",
      header: "Stage",
      cell: ({ row }) => <span className="whitespace-nowrap">{row.original.projectStage}</span>,
    },
    {
      field: "hoursSaved",
      accessorKey: "hoursSaved",
      header: ({ column }) => (
        <SortableHeader label="Hours" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.hoursSaved}h</span>,
    },
    {
      field: "impact",
      accessorKey: "impact",
      header: "Impact",
      cell: ({ row }) => <StatusBadge status={row.original.impact} />,
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
              aria-label={`Edit activity ${row.original.id}`}
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="size-4" />
            </Button>
          )}
          {canDelete(row.original) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete activity ${row.original.id}`}
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
