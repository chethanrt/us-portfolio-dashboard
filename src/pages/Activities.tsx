import { useMemo, useState } from "react";
import { subDays, format } from "date-fns";
import { Brain, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  ALL_FILTER,
  ConfirmationDialog,
  EmptyState,
  FilterBar,
  FilterSelect,
  DataTable,
  LoadingSkeleton,
  PageHeader,
  SearchBar,
} from "@/components/common";
import { ActivityFormDialog } from "@/components/activities/ActivityFormDialog";
import { buildActivityColumns } from "@/components/activities/activityColumns";
import { Button } from "@/components/ui/button";
import { useActivities } from "@/hooks/useActivities";
import type { ActivityRow } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/security";
import type { Activity } from "@/types";

const DATE_RANGES = ["Last 7 days", "Last 30 days", "Last 90 days"];

export default function Activities() {
  const { rows, employees, projects, settings, isLoading, error, addActivity, updateActivity, deleteActivity } =
    useActivities();
  const { currentUser } = useAuth();
  const { canCreate, canEditRow, canDeleteRow, canViewField, isOwnDataScope } = usePermission();
  const ownDataOnly = isOwnDataScope("activities");

  // Own-data view scope: see and log only their own activities.
  const visibleRows = useMemo(
    () => (ownDataOnly ? rows.filter((row) => row.employeeId === currentUser?.id) : rows),
    [rows, ownDataOnly, currentUser]
  );
  const formEmployees = ownDataOnly
    ? employees.filter((e) => e.id === currentUser?.id)
    : employees;

  const [search, setSearch] = useState("");
  const [toolFilter, setToolFilter] = useState(ALL_FILTER);
  const [projectFilter, setProjectFilter] = useState(ALL_FILTER);
  const [employeeFilter, setEmployeeFilter] = useState(ALL_FILTER);
  const [categoryFilter, setCategoryFilter] = useState(ALL_FILTER);
  const [dateFilter, setDateFilter] = useState(ALL_FILTER);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState<ActivityRow | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const minDate =
      dateFilter === ALL_FILTER
        ? ""
        : format(subDays(new Date(), Number(dateFilter.match(/\d+/)?.[0] ?? 0)), "yyyy-MM-dd");

    return visibleRows.filter((row) => {
      if (toolFilter !== ALL_FILTER && row.tool !== toolFilter) return false;
      if (projectFilter !== ALL_FILTER && row.projectName !== projectFilter) return false;
      if (employeeFilter !== ALL_FILTER && row.employeeName !== employeeFilter) return false;
      if (categoryFilter !== ALL_FILTER && row.category !== categoryFilter) return false;
      if (minDate && row.date < minDate) return false;
      if (!query) return true;
      return [row.employeeName, row.projectName, row.promptSummary, row.category, row.tool].some(
        (field) => field.toLowerCase().includes(query)
      );
    });
  }, [visibleRows, search, toolFilter, projectFilter, employeeFilter, categoryFilter, dateFilter]);

  const columns = useMemo(
    () =>
      buildActivityColumns(
        (row) => {
          setEditing(row);
          setFormOpen(true);
        },
        (row) => setDeleting(row),
        (row) => canEditRow("activities", row.employeeId),
        (row) => canDeleteRow("activities", row.employeeId),
        (field) => canViewField("activities", field)
      ),
    [canEditRow, canDeleteRow, canViewField]
  );

  const handleSave = async (values: Omit<Activity, "id">) => {
    try {
      if (editing) {
        await updateActivity(editing.id, values);
        toast.success("Activity updated successfully.");
      } else {
        await addActivity(values);
        toast.success("Activity logged successfully.");
      }
    } catch {
      toast.error("Unable to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteActivity(deleting.id);
      toast.success("Activity deleted successfully.");
    } catch {
      toast.error("Unable to delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setToolFilter(ALL_FILTER);
    setProjectFilter(ALL_FILTER);
    setEmployeeFilter(ALL_FILTER);
    setCategoryFilter(ALL_FILTER);
    setDateFilter(ALL_FILTER);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Activities" description="Track how AI is used across projects and stages" />
        <LoadingSkeleton variant="table" count={8} />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Activities" />
        <EmptyState icon={Brain} title="Unable to load activities" description={error ?? "Please try again."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Activities"
        description={
          ownDataOnly
            ? `${visibleRows.length} activities logged by you`
            : `${visibleRows.length} activities logged across the portfolio`
        }
        actions={
          canCreate("activities") ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Add Activity
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search activities…" className="w-full sm:w-60" />
        <FilterSelect placeholder="Dates" options={DATE_RANGES} value={dateFilter} onChange={setDateFilter} className="sm:w-36" />
        <FilterSelect placeholder="Tools" options={settings.aiTools} value={toolFilter} onChange={setToolFilter} className="sm:w-36" />
        <FilterSelect
          placeholder="Projects"
          options={projects.map((p) => p.name)}
          value={projectFilter}
          onChange={setProjectFilter}
          className="sm:w-44"
        />
        {!ownDataOnly && (
          <FilterSelect
            placeholder="Employees"
            options={employees.map((e) => e.name)}
            value={employeeFilter}
            onChange={setEmployeeFilter}
            className="sm:w-44"
          />
        )}
        <FilterSelect
          placeholder="Categories"
          options={settings.activityTypes}
          value={categoryFilter}
          onChange={setCategoryFilter}
          className="sm:w-40"
        />
      </FilterBar>

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No AI Activities Found"
          description="No activities match the current search and filters."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <DataTable columns={columns} data={filteredRows} pageSize={10} />
      )}

      <ActivityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        activity={editing}
        employees={formEmployees}
        projects={projects}
        settings={settings}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        message={
          deleting
            ? `Are you sure you want to delete this activity by ${deleting.employeeName}? This cannot be undone.`
            : "Are you sure you want to delete this record?"
        }
      />
    </div>
  );
}
