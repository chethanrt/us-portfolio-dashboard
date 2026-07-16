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
  canEdit: (row: ActivityRow) => boolean
): ColumnDef<ActivityRow>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <SortableHeader label="Date" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.date)}</span>,
    },
    {
      accessorKey: "employeeName",
      header: ({ column }) => (
        <SortableHeader label="Employee" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium">{row.original.employeeName}</p>
          <p className="max-w-44 truncate text-xs text-muted-foreground" title={row.original.promptSummary}>
            {row.original.promptSummary}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "projectName",
      header: "Project",
      cell: ({ row }) => <span className="whitespace-nowrap">{row.original.projectName}</span>,
    },
    {
      accessorKey: "tool",
      header: "Tool",
      cell: ({ row }) => <Badge variant="secondary">{row.original.tool}</Badge>,
    },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "projectStage",
      header: "Stage",
      cell: ({ row }) => <span className="whitespace-nowrap">{row.original.projectStage}</span>,
    },
    {
      accessorKey: "hoursSaved",
      header: ({ column }) => (
        <SortableHeader label="Hours" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.hoursSaved}h</span>,
    },
    {
      accessorKey: "impact",
      header: "Impact",
      cell: ({ row }) => <StatusBadge status={row.original.impact} />,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) =>
        canEdit(row.original) && (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit activity ${row.original.id}`}
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete activity ${row.original.id}`}
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        ),
    },
  ];
}
