import { useEffect, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  ALL_FILTER,
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
import { OffboardEmployeeDialog } from "@/components/people/OffboardEmployeeDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/useEmployees";
import type { EmployeeWithStats } from "@/hooks/useEmployees";
import { useSettings } from "@/hooks/useSettings";
import { usePermission } from "@/security";
import { userService } from "@/services";
import type { Employee } from "@/types";
import { getEmployeeProjectAssignments } from "@/utils/employeeAssignments";
import { PeopleRoleSummary } from "@/components/people/PeopleRoleSummary";

export default function People() {
  const { employees, projects, pocs, isLoading, error, addEmployee, updateEmployee, offboardEmployee } =
    useEmployees();
  const { settings } = useSettings();
  const roles = settings?.roles ?? [];
  const skillOptions = settings?.skills ?? [];
  const { currentUser } = useAuth();
  const { canCreate, canEditRow, canDeleteRow, isOwnDataScope } = usePermission();
  const ownDataOnly = isOwnDataScope("people");

  // Employees without a login account (docs/10: People and User Management must stay in sync).
  // Re-checked whenever the employee list changes so a newly added employee's
  // auto-created account is reflected immediately.
  const [linkedEmployeeIds, setLinkedEmployeeIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    userService.getAll().then((users) => {
      if (!cancelled) setLinkedEmployeeIds(new Set(users.map((u) => u.employeeId).filter(Boolean)));
    });
    return () => {
      cancelled = true;
    };
  }, [employees]);

  // Own-data view scope: see only their own profile.
  const visibleEmployees = useMemo(
    () => (ownDataOnly ? employees.filter((e) => e.id === currentUser?.id) : employees),
    [employees, ownDataOnly, currentUser]
  );

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(ALL_FILTER);
  const [projectFilter, setProjectFilter] = useState(ALL_FILTER);

  const [viewing, setViewing] = useState<EmployeeWithStats | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeWithStats | null>(null);
  const [offboarding, setOffboarding] = useState<EmployeeWithStats | null>(null);

  // People who'd be left reporting to a departed manager, and who's eligible to take over for them.
  const directReports = useMemo(
    () =>
      offboarding
        ? employees.filter((e) => e.managerId === offboarding.id && e.status !== "Ex-Employee")
        : [],
    [employees, offboarding]
  );
  const candidateManagers = useMemo(
    () => (offboarding ? employees.filter((e) => e.id !== offboarding.id && e.status !== "Ex-Employee") : []),
    [employees, offboarding]
  );

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleEmployees.filter((employee) => {
      if (roleFilter !== ALL_FILTER && employee.role !== roleFilter) return false;
      if (
        projectFilter !== ALL_FILTER &&
        !getEmployeeProjectAssignments(employee, projects).some((a) => a.project.name === projectFilter)
      )
        return false;
      if (!query) return true;
      return [employee.name, employee.role, employee.team, ...employee.skills].some((field) =>
        field.toLowerCase().includes(query)
      );
    });
  }, [visibleEmployees, projects, search, roleFilter, projectFilter]);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter(ALL_FILTER);
    setProjectFilter(ALL_FILTER);
  };

  const handleSave = async (values: Omit<Employee, "id">, pocIds: string[]) => {
    try {
      if (editing) {
        await updateEmployee(editing.id, values, pocIds);
        toast.success("Employee updated successfully.");
      } else {
        await addEmployee(values, pocIds);
        toast.success("Employee created successfully.");
      }
    } catch {
      toast.error("Unable to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleOffboard = async (reassignments: Record<string, string>) => {
    if (!offboarding) return;
    try {
      await offboardEmployee(offboarding.id, reassignments);
      toast.success(
        directReports.length > 0
          ? `${offboarding.name} marked as Ex-Employee. ${directReports.length} report(s) reassigned.`
          : `${offboarding.name} marked as Ex-Employee.`
      );
    } catch {
      toast.error("Unable to update. Please try again.");
      throw new Error("offboard failed");
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
          canCreate("people") ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Add Employee
            </Button>
          ) : undefined
        }
      />

      {!ownDataOnly && <PeopleRoleSummary employees={employees} roles={roles} />}

      {!ownDataOnly && (
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search people…" className="w-full sm:w-64" />
          <FilterSelect placeholder="Roles" options={roles} value={roleFilter} onChange={setRoleFilter} className="sm:w-48" />
          <FilterSelect
            placeholder="Projects"
            options={[...new Set(projects.map((p) => p.name))]}
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
              projectNames={getEmployeeProjectAssignments(employee, projects).map((a) => a.project.name)}
              canEdit={canEditRow("people", employee.id)}
              canDelete={canDeleteRow("people", employee.id)}
              hasAccount={linkedEmployeeIds ? linkedEmployeeIds.has(employee.id) : true}
              onViewProfile={setViewing}
              onEdit={(e) => {
                setEditing(e);
                setFormOpen(true);
              }}
              onRemove={setOffboarding}
            />
          ))}
        </div>
      )}

      <EmployeeProfileDrawer
        employee={viewing}
        managerName={employees.find((e) => e.id === viewing?.managerId)?.name}
        onClose={() => setViewing(null)}
      />

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        employees={employees}
        projects={projects}
        pocs={pocs}
        roles={roles}
        skillOptions={skillOptions}
        onSave={handleSave}
      />

      <OffboardEmployeeDialog
        open={Boolean(offboarding)}
        onOpenChange={(open) => !open && setOffboarding(null)}
        employee={offboarding}
        directReports={directReports}
        candidateManagers={candidateManagers}
        onConfirm={handleOffboard}
      />
    </div>
  );
}
