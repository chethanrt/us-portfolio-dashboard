import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmationDialog,
  DataTable,
  EmptyState,
  FilterBar,
  LoadingSkeleton,
  PageHeader,
  SearchBar,
} from "@/components/common";
import { RoleFormDialog } from "@/components/roles/RoleFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRoles } from "@/hooks/useRoles";
import type { RoleRow } from "@/hooks/useRoles";
import { usePermission } from "@/security";
import type { ModulePermission, Role } from "@/types";

export default function Roles() {
  const { canCreate, canEdit, canDelete } = usePermission();
  const { rows, roles, resources, isLoading, error, getModulesForRole, addRole, updateRole, deleteRole } =
    useRoles();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [deleting, setDeleting] = useState<RoleRow | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.name, row.description].some((field) => field.toLowerCase().includes(query))
    );
  }, [rows, search]);

  const columns = useMemo<ColumnDef<RoleRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Role",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <p className="max-w-md truncate text-sm text-muted-foreground" title={row.original.description}>
            {row.original.description}
          </p>
        ),
      },
      {
        accessorKey: "moduleCount",
        header: "Modules",
        cell: ({ row }) => <span>{row.original.moduleCount}</span>,
      },
      {
        accessorKey: "userCount",
        header: "Users",
        cell: ({ row }) => <span>{row.original.userCount}</span>,
      },
      {
        accessorKey: "isSystem",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant={row.original.isSystem ? "secondary" : "outline"}>
            {row.original.isSystem ? "System" : "Custom"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {canEdit("roles") && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${row.original.name}`}
                onClick={() => {
                  setEditing(row.original);
                  setFormOpen(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {canDelete("roles") && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.original.name}`}
                className="text-destructive hover:text-destructive"
                disabled={row.original.isSystem}
                title={row.original.isSystem ? "System roles cannot be deleted" : undefined}
                onClick={() => setDeleting(row.original)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Roles & Permissions" description="Roles with module, action and field permissions" />
        <LoadingSkeleton variant="table" count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Roles & Permissions" />
        <EmptyState icon={ShieldCheck} title="Unable to load roles" description={error} />
      </div>
    );
  }

  const handleSave = async (values: Pick<Role, "name" | "description">, modules: ModulePermission[]) => {
    try {
      if (editing) {
        await updateRole(editing.id, values, modules);
        toast.success("Role updated successfully. Users get the new permissions on their next sign-in.");
      } else {
        await addRole(values, modules);
        toast.success("Role created successfully.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error && err.message === "DUPLICATE_NAME"
          ? "A role with this name already exists."
          : "Unable to save. Please try again."
      );
      throw new Error("save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRole(deleting.id);
      toast.success("Role deleted successfully.");
    } catch (err) {
      const message =
        err instanceof Error && err.message === "ROLE_IN_USE"
          ? "Cannot delete — users are still assigned to this role."
          : err instanceof Error && err.message === "SYSTEM_ROLE"
            ? "System roles cannot be deleted."
            : "Unable to delete. Please try again.";
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description={`${rows.length} roles with module, action and field permissions`}
        actions={
          canCreate("roles") ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Create Role
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search roles…" className="w-full sm:w-64" />
      </FilterBar>

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Roles Found"
          description="No roles match the current search."
          actionLabel="Clear Search"
          onAction={() => setSearch("")}
        />
      ) : (
        <DataTable columns={columns} data={filteredRows} pageSize={10} />
      )}

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editing}
        roles={roles}
        resources={resources}
        initialModules={editing ? getModulesForRole(editing.id) : []}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        message={
          deleting
            ? `Are you sure you want to delete the "${deleting.name}" role? This cannot be undone.`
            : "Are you sure you want to delete this record?"
        }
      />
    </div>
  );
}
