import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import {
  ALL_FILTER,
  DataTable,
  EmptyState,
  FilterBar,
  FilterSelect,
  LoadingSkeleton,
  PageHeader,
  SearchBar,
} from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/useEmployees";
import type { EmployeeWithStats } from "@/hooks/useEmployees";
import { useSettings } from "@/hooks/useSettings";
import { usePermission } from "@/security";
import { getInitials } from "@/utils/format";

export default function SkillMatrix() {
  const { employees, isLoading, error } = useEmployees();
  const { settings } = useSettings();
  const skillOptions = settings?.skills ?? [];
  const { currentUser } = useAuth();
  const { canExport, isOwnDataScope } = usePermission();
  const ownDataOnly = isOwnDataScope("skills");

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState(ALL_FILTER);

  // Own-data view scope: see only their own row.
  const visibleEmployees = useMemo(
    () => (ownDataOnly ? employees.filter((e) => e.id === currentUser?.id) : employees),
    [employees, ownDataOnly, currentUser]
  );

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleEmployees.filter((employee) => {
      if (skillFilter !== ALL_FILTER && !employee.skills.includes(skillFilter)) return false;
      if (!query) return true;
      return [employee.name, employee.role, ...employee.skills].some((field) =>
        field.toLowerCase().includes(query)
      );
    });
  }, [visibleEmployees, search, skillFilter]);

  const clearFilters = () => {
    setSearch("");
    setSkillFilter(ALL_FILTER);
  };

  const columns = useMemo<ColumnDef<EmployeeWithStats>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Employee",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.role}</p>
            </div>
          </div>
        ),
      },
      {
        id: "skills",
        header: "Skills",
        cell: ({ row }) =>
          row.original.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {row.original.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Skill Matrix" description="Skills employees have selected on their profile" />
        <LoadingSkeleton variant="table" count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Skill Matrix" />
        <EmptyState icon={LayoutGrid} title="Unable to load the skill matrix" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Matrix"
        description={
          ownDataOnly
            ? "Your skills"
            : `${visibleEmployees.length} team members · ${skillOptions.length} tracked skills`
        }
        actions={
          canExport("skills") ? (
            <Button variant="outline" onClick={() => toast.info("Export arrives with the Reports phase.")}>
              <Download /> Export
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        {!ownDataOnly && (
          <SearchBar value={search} onChange={setSearch} placeholder="Search employees…" className="w-full sm:w-64" />
        )}
        <FilterSelect
          placeholder="Skills"
          options={skillOptions}
          value={skillFilter}
          onChange={setSkillFilter}
          className="sm:w-48"
        />
      </FilterBar>

      {filteredEmployees.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No Matching Employees"
          description="No employees match the current search and filters."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <DataTable columns={columns} data={filteredEmployees} pageSize={15} />
      )}
    </div>
  );
}
