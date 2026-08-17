import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmationDialog,
  DataTable,
  EmptyState,
  FilterBar,
  LoadingSkeleton,
  PageHeader,
  SearchBar,
  StatusBadge,
} from "@/components/common";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import type { UserRow } from "@/hooks/useUsers";
import { usePermission } from "@/security";
import type { UserInput } from "@/services/UserService";

export default function Users() {
  const { account } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermission();
  const { rows, users, employees, roles, isLoading, error, addUser, updateUser, deleteUser } = useUsers();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.username, row.employeeName, row.roleName].some((field) => field.toLowerCase().includes(query))
    );
  }, [rows, search]);

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.username}</p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      { accessorKey: "employeeName", header: "Employee" },
      {
        accessorKey: "roleName",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={row.original.roleId === "super-admin" ? "default" : "secondary"}>
            {row.original.roleName}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {canEdit("users") && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${row.original.username}`}
                onClick={() => {
                  setEditing(row.original);
                  setFormOpen(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {canDelete("users") && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.original.username}`}
                className="text-destructive hover:text-destructive"
                disabled={row.original.id === account?.id}
                title={row.original.id === account?.id ? "You cannot delete your own account" : undefined}
                onClick={() => setDeleting(row.original)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [account, canEdit, canDelete]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Management" description="Create login accounts and manage passwords" />
        <LoadingSkeleton variant="table" count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Management" />
        <EmptyState icon={UserCog} title="Unable to load user accounts" description={error} />
      </div>
    );
  }

  const handleSave = async (values: UserInput) => {
    try {
      if (editing) {
        await updateUser(editing.id, values);
        toast.success("User updated successfully.");
      } else {
        await addUser(values);
        toast.success("User created successfully.");
      }
    } catch {
      toast.error("Unable to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteUser(deleting.id);
      toast.success("User deleted successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message === "LAST_ADMIN"
          ? "Cannot delete the last active Super Admin account."
          : "Unable to delete. Please try again."
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={`${rows.length} login accounts`}
        actions={
          canCreate("users") ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Create User
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search users…" className="w-full sm:w-64" />
      </FilterBar>

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No Users Found"
          description="No accounts match the current search."
          actionLabel="Clear Search"
          onAction={() => setSearch("")}
        />
      ) : (
        <DataTable columns={columns} data={filteredRows} pageSize={10} />
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        users={users}
        employees={employees}
        roles={roles}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        message={
          deleting
            ? `Are you sure you want to delete the account "${deleting.username}"? They will no longer be able to sign in.`
            : "Are you sure you want to delete this record?"
        }
      />
    </div>
  );
}
