import { useMemo, useState } from "react";
import { Lightbulb, Plus } from "lucide-react";
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
import { POCCard } from "@/components/pocs/POCCard";
import { POCDetailsDrawer } from "@/components/pocs/POCDetailsDrawer";
import { POCFormDialog } from "@/components/pocs/POCFormDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePOCs } from "@/hooks/usePOCs";
import type { POCRow } from "@/hooks/usePOCs";
import type { POC } from "@/types";
import { canCreatePOC, canEditPOC, isOwnDataRole } from "@/utils/permissions";

const STATUSES = ["Idea", "In Progress", "Completed", "On Hold"];
const CATEGORIES = ["Automation", "Documentation", "CMS", "Marketing", "Testing", "Development", "Estimation"];

export default function POCs() {
  const { rows, pocs, employees, projects, isLoading, error, addPOC, updatePOC, deletePOC } = usePOCs();
  const { currentUser, role } = useAuth();
  const ownDataOnly = isOwnDataRole(role);

  // Own-data roles (below Tech Lead) see only their own POCs.
  const visibleRows = useMemo(
    () => (ownDataOnly ? rows.filter((row) => row.ownerId === currentUser?.id) : rows),
    [rows, ownDataOnly, currentUser]
  );

  // Individual contributor roles create POCs under their own name.
  const formEmployees = ["Tech Lead", "Senior Developer", "Developer"].includes(role)
    ? employees.filter((e) => e.id === currentUser?.id)
    : employees;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [ownerFilter, setOwnerFilter] = useState(ALL_FILTER);
  const [categoryFilter, setCategoryFilter] = useState(ALL_FILTER);

  const [viewing, setViewing] = useState<POCRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<POCRow | null>(null);
  const [deleting, setDeleting] = useState<POCRow | null>(null);

  const ownerOptions = useMemo(() => [...new Set(visibleRows.map((r) => r.ownerName))].sort(), [visibleRows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleRows.filter((row) => {
      if (statusFilter !== ALL_FILTER && row.status !== statusFilter) return false;
      if (ownerFilter !== ALL_FILTER && row.ownerName !== ownerFilter) return false;
      if (categoryFilter !== ALL_FILTER && row.category !== categoryFilter) return false;
      if (!query) return true;
      return [row.title, row.ownerName, row.projectName, row.description, row.businessValue].some(
        (field) => field.toLowerCase().includes(query)
      );
    });
  }, [visibleRows, search, statusFilter, ownerFilter, categoryFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(ALL_FILTER);
    setOwnerFilter(ALL_FILTER);
    setCategoryFilter(ALL_FILTER);
  };

  const handleSave = async (values: Omit<POC, "id">) => {
    try {
      if (editing) {
        await updatePOC(editing.id, values);
        toast.success("POC updated successfully.");
      } else {
        await addPOC(values);
        toast.success("POC created successfully.");
      }
    } catch {
      toast.error("Unable to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deletePOC(deleting.id);
      toast.success("POC deleted successfully.");
    } catch {
      toast.error("Unable to delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="POCs & Innovation" description="AI initiatives, automation ideas and business value" />
        <LoadingSkeleton variant="cards" count={6} className="lg:grid-cols-3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="POCs & Innovation" />
        <EmptyState icon={Lightbulb} title="Unable to load POCs" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="POCs & Innovation"
        description={
          ownDataOnly
            ? `${visibleRows.length} of your POCs · ${visibleRows.reduce((sum, r) => sum + r.hoursSaved, 0)} hours saved`
            : `${visibleRows.length} POCs · ${visibleRows.reduce((sum, r) => sum + r.hoursSaved, 0)} hours saved`
        }
        actions={
          <Button
            disabled={!canCreatePOC(role)}
            title={!canCreatePOC(role) ? `The ${role} role is view-only for POCs` : undefined}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Add POC
          </Button>
        }
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search POCs…" className="w-full sm:w-64" />
        <FilterSelect placeholder="Status" options={STATUSES} value={statusFilter} onChange={setStatusFilter} className="sm:w-40" />
        {!ownDataOnly && (
          <FilterSelect placeholder="Owners" options={ownerOptions} value={ownerFilter} onChange={setOwnerFilter} className="sm:w-44" />
        )}
        <FilterSelect placeholder="Categories" options={CATEGORIES} value={categoryFilter} onChange={setCategoryFilter} className="sm:w-44" />
      </FilterBar>

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No POCs Yet"
          description="No POCs match the current search and filters."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map((poc) => (
            <POCCard
              key={poc.id}
              poc={poc}
              canEdit={canEditPOC(role, poc.ownerId, currentUser?.id)}
              onViewDetails={setViewing}
              onEdit={(p) => {
                setEditing(p);
                setFormOpen(true);
              }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <POCDetailsDrawer poc={viewing} onClose={() => setViewing(null)} />

      <POCFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        poc={editing}
        pocs={pocs}
        employees={editing ? employees : formEmployees}
        projects={projects}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        message={
          deleting
            ? `Are you sure you want to delete "${deleting.title}"? This cannot be undone.`
            : "Are you sure you want to delete this record?"
        }
      />
    </div>
  );
}
