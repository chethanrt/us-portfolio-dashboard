import { useMemo, useState } from "react";
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
  SkillBadge,
} from "@/components/common";
import { buildSkillMatrixColumns } from "@/components/skills/skillMatrixColumns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSkillMatrix } from "@/hooks/useSkillMatrix";
import type { SkillLevel } from "@/types";
import { isOwnDataRole } from "@/utils/permissions";
import { SKILL_COLUMNS } from "@/utils/skills";

const LEVELS: SkillLevel[] = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function SkillMatrix() {
  const { rows, isLoading, error } = useSkillMatrix();
  const { currentUser, role } = useAuth();
  const ownDataOnly = isOwnDataRole(role);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState(ALL_FILTER);
  const [levelFilter, setLevelFilter] = useState(ALL_FILTER);

  const columns = useMemo(() => buildSkillMatrixColumns(), []);

  // Own-data roles (below Tech Lead) see only their own skill row.
  const visibleRows = useMemo(
    () => (ownDataOnly ? rows.filter((row) => row.employee.id === currentUser?.id) : rows),
    [rows, ownDataOnly, currentUser]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleRows.filter(({ employee, skills }) => {
      if (query) {
        const matches = [employee.name, employee.role, employee.team].some((field) =>
          field.toLowerCase().includes(query)
        );
        if (!matches) return false;
      }
      if (skillFilter !== ALL_FILTER && levelFilter !== ALL_FILTER) {
        const key = SKILL_COLUMNS.find((c) => c.label === skillFilter)?.key;
        return key ? skills[key] === levelFilter : true;
      }
      if (skillFilter !== ALL_FILTER) return true; // skill alone doesn't narrow rows
      if (levelFilter !== ALL_FILTER) {
        return SKILL_COLUMNS.some(({ key }) => skills[key] === levelFilter);
      }
      return true;
    });
  }, [visibleRows, search, skillFilter, levelFilter]);

  const clearFilters = () => {
    setSearch("");
    setSkillFilter(ALL_FILTER);
    setLevelFilter(ALL_FILTER);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Skill Matrix" description="Technical and AI skills across the team" />
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
            ? `Your ${SKILL_COLUMNS.length} tracked skills`
            : `${visibleRows.length} team members · ${SKILL_COLUMNS.length} tracked skills`
        }
        actions={
          <Button variant="outline" onClick={() => toast.info("Export arrives with the Reports phase.")}>
            <Download /> Export
          </Button>
        }
      />

      <FilterBar>
        {!ownDataOnly && (
          <SearchBar value={search} onChange={setSearch} placeholder="Search employees…" className="w-full sm:w-64" />
        )}
        <FilterSelect
          placeholder="Skills"
          options={SKILL_COLUMNS.map((c) => c.label)}
          value={skillFilter}
          onChange={setSkillFilter}
          className="sm:w-48"
        />
        <FilterSelect placeholder="Levels" options={LEVELS} value={levelFilter} onChange={setLevelFilter} className="sm:w-40" />
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
          {LEVELS.map((level) => (
            <SkillBadge key={level} level={level} />
          ))}
        </div>
      </FilterBar>

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No Matching Employees"
          description="No employees match the current search and filters."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <DataTable columns={columns} data={filteredRows} pageSize={15} />
      )}
    </div>
  );
}
