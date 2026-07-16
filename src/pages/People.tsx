import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  ALL_FILTER,
  ConfirmationDialog,
  EmptyState,
  FilterBar,
  FilterSelect,
  LoadingSkeleton,
  PageHeader,
  SearchBar,
} from "@/components/common";
import { EmployeeCard } from "@/components/people/EmployeeCard";
import { EmployeeFormDialog } from "@/components/people/EmployeeFormDialog";
import { EmployeeProfileDrawer } from "@/components/people/EmployeeProfileDrawer";
import { Button } from "@/components/ui/button";
import { ALL_ROLES } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/useEmployees";
import type { EmployeeWithStats } from "@/hooks/useEmployees";
import type { Employee } from "@/types";
import { canManagePeople, isOwnDataRole } from "@/utils/permissions";

export default function People() {
  const { employees, projects, isLoading, error, addEmployee, updateEmployee, deleteEmployee } =
    useEmployees();
  const { currentUser, role } = useAuth();
  const canManage = canManagePeople(role);
  const ownDataOnly = isOwnDataRole(role);

  // Own-data roles (below Tech Lead) see only their own profile.
  const visibleEmployees = useMemo(
    () => (ownDataOnly ? employees.filter((e) => e.id === currentUser?.id) : employees),
    [employees, ownDataOnly, currentUser]
  );

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(ALL_FILTER);
  const [technologyFilter, setTechnologyFilter] = useState(ALL_FILTER);
  const [projectFilter, setProjectFilter] = useState(ALL_FILTER);

  const [viewing, setViewing] = useState<EmployeeWithStats | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeWithStats | null>(null);
  const [deleting, setDeleting] = useState<EmployeeWithStats | null>(null);

  const technologyOptions = useMemo(
    () => [...new Set(visibleEmployees.map((e) => e.primarySkill))].sort(),
    [visibleEmployees]
  );

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleEmployees.filter((employee) => {
      if (roleFilter !== ALL_FILTER && employee.role !== roleFilter) return false;
      if (technologyFilter !== ALL_FILTER && employee.primarySkill !== technologyFilter) return false;
      if (projectFilter !== ALL_FILTER && employee.currentProject !== projectFilter) return false;
      if (!query) return true;
      return [employee.name, employee.role, employee.primarySkill, employee.secondarySkill, employee.team]
        .some((field) => field.toLowerCase().includes(query));
    });
  }, [visibleEmployees, search, roleFilter, technologyFilter, projectFilter]);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter(ALL_FILTER);
    setTechnologyFilter(ALL_FILTER);
    setProjectFilter(ALL_FILTER);
  };

  const handleSave = async (values: Omit<Employee, "id">) => {
    try {
      if (editing) {
        await updateEmployee(editing.id, values);
        toast.success("Employee updated successfully.");
      } else {
        await addEmployee(values);
        toast.success("Employee created successfully.");
      }
    } catch {
      toast.error("Unable to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteEmployee(deleting.id);
      toast.success("Employee deleted successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message === "REFERENCED"
          ? "Cannot delete — this employee has linked activities or POCs."
          : "Unable to delete. Please try again."
      );
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="People" description="Employee profiles, skills and AI statistics" />
        <LoadingSkeleton variant="cards" count={8} className="xl:grid-cols-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="People" />
        <EmptyState icon={Users} title="Unable to load employees" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description={
          ownDataOnly ? "Your profile and statistics" : `${visibleEmployees.length} team members across the portfolio`
        }
        actions={
          <Button
            disabled={!canManage}
            title={!canManage ? "Only Engineering Managers can manage employees" : undefined}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Add Employee
          </Button>
        }
      />

      {!ownDataOnly && (
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search people…" className="w-full sm:w-64" />
          <FilterSelect placeholder="Roles" options={ALL_ROLES} value={roleFilter} onChange={setRoleFilter} className="sm:w-48" />
          <FilterSelect
            placeholder="Technologies"
            options={technologyOptions}
            value={technologyFilter}
            onChange={setTechnologyFilter}
            className="sm:w-44"
          />
          <FilterSelect
            placeholder="Projects"
            options={["US Portfolio", ...projects.map((p) => p.name)]}
            value={projectFilter}
            onChange={setProjectFilter}
            className="sm:w-44"
          />
        </FilterBar>
      )}

      {filteredEmployees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No People to Show"
          description="No employees match the current search and filters."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              canManage={canManage}
              onViewProfile={setViewing}
              onEdit={(e) => {
                setEditing(e);
                setFormOpen(true);
              }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <EmployeeProfileDrawer employee={viewing} onClose={() => setViewing(null)} />

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        employees={employees}
        projects={projects}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        message={
          deleting
            ? `Are you sure you want to delete ${deleting.name}? This cannot be undone.`
            : "Are you sure you want to delete this record?"
        }
      />
    </div>
  );
}
