import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInputField, FormTextareaField, Modal } from "@/components/common";
import { PermissionMatrix } from "@/components/roles/PermissionMatrix";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { ModulePermission, Resource, Role } from "@/types";

function buildRoleSchema(takenNames: Set<string>) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(3, "Role name must be at least 3 characters.")
      .max(40, "Maximum 40 characters.")
      .refine((value) => !takenNames.has(value.toLowerCase()), {
        message: "A role with this name already exists.",
      }),
    description: z.string().trim().min(1, "Please describe what this role can do.").max(200, "Maximum 200 characters."),
  });
}

type RoleFormValues = z.infer<ReturnType<typeof buildRoleSchema>>;

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  role: Role | null;
  roles: Role[];
  resources: Resource[];
  /** The role's current permission set (empty for new roles). */
  initialModules: ModulePermission[];
  onSave: (values: Pick<Role, "name" | "description">, modules: ModulePermission[]) => Promise<void>;
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  roles,
  resources,
  initialModules,
  onSave,
}: RoleFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [modules, setModules] = useState<ModulePermission[]>([]);
  const isEdit = Boolean(role);
  // System role names are stable; their permissions stay editable.
  const nameLocked = Boolean(role?.isSystem);

  const schema = useMemo(() => {
    const taken = new Set(
      roles.filter((r) => r.id !== role?.id).map((r) => r.name.toLowerCase())
    );
    return buildRoleSchema(taken);
  }, [roles, role]);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(role ? { name: role.name, description: role.description } : { name: "", description: "" });
      setModules(structuredClone(initialModules));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await onSave({ name: values.name.trim(), description: values.description.trim() }, modules);
      onOpenChange(false);
    } catch {
      // save failed — the caller shows the error toast; keep the dialog open
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !isSaving && onOpenChange(next)}
      title={isEdit ? "Edit Role" : "Create Role"}
      description={
        isEdit
          ? `Update permissions for ${role?.name}.`
          : "Define a role and assign its module, action and field permissions."
      }
      className="sm:max-w-2xl"
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInputField
              control={form.control}
              name="name"
              label="Role Name"
              placeholder="e.g. QA Lead"
              required
              disabled={nameLocked}
            />
            <FormTextareaField
              control={form.control}
              name="description"
              label="Description"
              placeholder="What can this role do?"
              rows={2}
              maxLength={200}
              required
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Permissions</p>
            <div className="max-h-[45vh] overflow-y-auto pr-1">
              <PermissionMatrix resources={resources} value={modules} onChange={setModules} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={isSaving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
