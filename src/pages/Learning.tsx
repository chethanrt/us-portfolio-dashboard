import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Clock, GraduationCap, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  ALL_FILTER,
  ConfirmationDialog,
  EmptyState,
  FilterBar,
  FilterSelect,
  KPICard,
  LoadingSkeleton,
  PageHeader,
  SearchBar,
} from "@/components/common";
import { LearningCard } from "@/components/learning/LearningCard";
import { LearningFormDialog } from "@/components/learning/LearningFormDialog";
import { LearningLeaderboard } from "@/components/learning/LearningLeaderboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearning";
import type { LearningRow } from "@/hooks/useLearning";
import type { LearningRecord } from "@/types";
import { canAddOwnRecords, canEditRecord, isOwnDataRole } from "@/utils/permissions";

const PLATFORMS = ["Udemy AI Lab", "Internal Training", "Other"];
const STATUSES = ["Not Started", "In Progress", "Completed"];

export default function Learning() {
  const { rows, employees, stats, leaderboard, isLoading, error, addRecord, updateRecord, deleteRecord } =
    useLearning();
  const { currentUser, role } = useAuth();
  const ownDataOnly = isOwnDataRole(role);

  // Own-data roles (docs/05): see and track only their own learning.
  const visibleRows = useMemo(
    () => (ownDataOnly ? rows.filter((row) => row.employeeId === currentUser?.id) : rows),
    [rows, ownDataOnly, currentUser]
  );
  const formEmployees = ownDataOnly
    ? employees.filter((e) => e.id === currentUser?.id)
    : employees;

  // Portfolio stats for leads and above; personal stats for own-data roles.
  const visibleStats = useMemo(() => {
    if (!ownDataOnly) return stats;
    return {
      completion: visibleRows.length
        ? Math.round(visibleRows.reduce((sum, r) => sum + r.progress, 0) / visibleRows.length)
        : 0,
      completedCourses: visibleRows.filter((r) => r.status === "Completed").length,
      inProgressCourses: visibleRows.filter((r) => r.status === "In Progress").length,
      hoursLearned: Math.round(visibleRows.reduce((sum, r) => sum + r.hours, 0)),
    };
  }, [ownDataOnly, stats, visibleRows]);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [employeeFilter, setEmployeeFilter] = useState(ALL_FILTER);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LearningRow | null>(null);
  const [deleting, setDeleting] = useState<LearningRow | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleRows.filter((row) => {
      if (platformFilter !== ALL_FILTER && row.platform !== platformFilter) return false;
      if (statusFilter !== ALL_FILTER && row.status !== statusFilter) return false;
      if (employeeFilter !== ALL_FILTER && row.employeeName !== employeeFilter) return false;
      if (!query) return true;
      return [row.course, row.employeeName, row.platform].some((field) =>
        field.toLowerCase().includes(query)
      );
    });
  }, [visibleRows, search, platformFilter, statusFilter, employeeFilter]);

  const clearFilters = () => {
    setSearch("");
    setPlatformFilter(ALL_FILTER);
    setStatusFilter(ALL_FILTER);
    setEmployeeFilter(ALL_FILTER);
  };

  const handleSave = async (values: Omit<LearningRecord, "id">) => {
    try {
      if (editing) {
        await updateRecord(editing.id, values);
        toast.success("Learning record updated successfully.");
      } else {
        await addRecord(values);
        toast.success("Learning record created successfully.");
      }
    } catch {
      toast.error("Unable to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRecord(deleting.id);
      toast.success("Learning record deleted successfully.");
    } catch {
      toast.error("Unable to delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Learning" description="Udemy AI Lab, internal training and certifications" />
        <LoadingSkeleton variant="page" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Learning" />
        <EmptyState icon={GraduationCap} title="Unable to load learning records" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning"
        description={
          ownDataOnly
            ? `${visibleRows.length} of your learning records`
            : `${visibleRows.length} learning records across the team`
        }
        actions={
          <Button
            disabled={!canAddOwnRecords(role)}
            title={!canAddOwnRecords(role) ? `The ${role} role is view-only for learning` : undefined}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Add Learning
          </Button>
        }
      />

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Overall Completion" value={`${visibleStats.completion}%`} icon={GraduationCap} hint="Average progress" />
        <KPICard title="Courses Completed" value={visibleStats.completedCourses} icon={CheckCircle2} hint={`of ${visibleRows.length} enrollments`} />
        <KPICard title="In Progress" value={visibleStats.inProgressCourses} icon={BookOpen} hint="Currently being taken" />
        <KPICard title="Hours Learned" value={visibleStats.hoursLearned.toLocaleString()} icon={Clock} hint={ownDataOnly ? "By you" : "Across the team"} />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search courses…" className="w-full sm:w-64" />
        <FilterSelect placeholder="Platforms" options={PLATFORMS} value={platformFilter} onChange={setPlatformFilter} className="sm:w-44" />
        <FilterSelect placeholder="Status" options={STATUSES} value={statusFilter} onChange={setStatusFilter} className="sm:w-40" />
        {!ownDataOnly && (
          <FilterSelect
            placeholder="Employees"
            options={employees.map((e) => e.name)}
            value={employeeFilter}
            onChange={setEmployeeFilter}
            className="sm:w-44"
          />
        )}
      </FilterBar>

      <div className={ownDataOnly ? "grid items-start gap-4" : "grid items-start gap-4 xl:grid-cols-[1fr_320px]"}>
        {filteredRows.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No Learning Records"
            description="No records match the current search and filters."
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredRows.map((record) => (
              <LearningCard
                key={record.id}
                record={record}
                canEdit={canEditRecord(role, record.employeeId, currentUser?.id)}
                onEdit={(r) => {
                  setEditing(r);
                  setFormOpen(true);
                }}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
        {/* Leaderboard shows other people's data — hidden for own-data roles */}
        {!ownDataOnly && <LearningLeaderboard learners={leaderboard} />}
      </div>

      <LearningFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        employees={formEmployees}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        message={
          deleting
            ? `Are you sure you want to delete "${deleting.course}" for ${deleting.employeeName}?`
            : "Are you sure you want to delete this record?"
        }
      />
    </div>
  );
}
