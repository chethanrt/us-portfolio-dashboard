import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { SkillBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { SkillMatrixRow } from "@/hooks/useSkillMatrix";
import { getInitials } from "@/utils/format";
import { SKILL_COLUMNS } from "@/utils/skills";

export function buildSkillMatrixColumns(): ColumnDef<SkillMatrixRow>[] {
  return [
    {
      id: "employee",
      accessorFn: (row) => row.employee.name,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Employee
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex min-w-44 items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(row.original.employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.original.employee.name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.employee.role}</p>
          </div>
        </div>
      ),
    },
    ...SKILL_COLUMNS.map<ColumnDef<SkillMatrixRow>>(({ key, label }) => ({
      id: key,
      accessorFn: (row) => row.skills[key],
      header: () => <span className="whitespace-nowrap">{label}</span>,
      cell: ({ row }) => <SkillBadge level={row.original.skills[key]} />,
    })),
  ];
}
