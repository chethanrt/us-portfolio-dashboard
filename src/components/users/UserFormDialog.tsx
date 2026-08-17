import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInputField, FormSelectField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { UserInput } from "@/services/UserService";
import type { Employee, Role, User } from "@/types";

const REQUIRED = "This field is required.";
const NO_EMPLOYEE = "none";

function buildUserSchema(takenUsernames: Set<string>, isEdit: boolean) {
  return z.object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .max(40, "Maximum 40 characters.")
      .regex(/^[a-z0-9._-]+$/i, "Use letters, numbers, dots, dashes or underscores only.")
      .refine((value) => !takenUsernames.has(value.toLowerCase()), {
        message: "This username already exists.",
      }),
    password: isEdit
      ? z.string().refine((value) => value === "" || value.length >= 6, {
          message: "Password must be at least 6 characters.",
        })
      : z.string().min(6, "Password must be at least 6 characters."),
    roleId: z.string().min(1, REQUIRED),
    employeeId: z.string(),
    status: z.string().min(1, REQUIRED),
  });
}

type UserFormValues = z.infer<ReturnType<typeof buildUserSchema>>;

const EMPTY_VALUES: UserFormValues = {
  username: "",
  password: "",
  roleId: "",
  employeeId: NO_EMPLOYEE,
  status: "Active",
};

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  user: User | null;
  users: User[];
  employees: Employee[];
  /** Assignable roles (roles.json via RoleService). */
  roles: Role[];
  onSave: (values: UserInput) => Promise<void>;
}

export function UserFormDialog({ open, onOpenChange, user, users, employees, roles, onSave }: UserFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(user);

  // Employees already linked to a different account can't be picked again —
  // that's how People and User Management drift out of sync with each other.
  const linkableEmployees = useMemo(() => {
    const linkedElsewhere = new Set(
      users.filter((u) => u.employeeId && u.employeeId !== user?.employeeId).map((u) => u.employeeId)
    );
    return employees.filter((e) => !linkedElsewhere.has(e.id));
  }, [employees, users, user]);

  const schema = useMemo(() => {
    const taken = new Set(
      users.filter((u) => u.id !== user?.id).map((u) => u.username.toLowerCase())
    );
    return buildUserSchema(taken, isEdit);
  }, [users, user, isEdit]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        user
          ? {
              username: user.username,
              password: "",
              roleId: user.roleId,
              employeeId: user.employeeId || NO_EMPLOYEE,
              status: user.status,
            }
          : EMPTY_VALUES
      );
    }
  }, [open, user, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await onSave({
        username: values.username.trim().toLowerCase(),
        roleId: values.roleId,
        employeeId: values.employeeId === NO_EMPLOYEE ? "" : values.employeeId,
        status: values.status as User["status"],
        // Blank password in Edit mode keeps the current one — omitting the
        // key entirely (not resubmitting the existing bcrypt hash) is what
        // makes that work; see UserInput's doc comment for why.
        ...(values.password ? { password: values.password } : {}),
      });
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
      title={isEdit ? "Edit User" : "Create User"}
      description={
        isEdit
          ? `Account ${user?.id} — leave the password blank to keep the current one.`
          : "Create a login account and set its password."
      }
      className="sm:max-w-xl"
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <FormInputField
            control={form.control}
            name="username"
            label="Username"
            placeholder="firstname.lastname"
            required
          />
          <FormInputField
            control={form.control}
            name="password"
            label={isEdit ? "New Password" : "Password"}
            type="password"
            placeholder={isEdit ? "Leave blank to keep current" : "Minimum 6 characters"}
            required={!isEdit}
          />
          <FormSelectField
            control={form.control}
            name="roleId"
            label="Role"
            required
            options={roles.map((role) => ({ value: role.id, label: role.name }))}
          />
          <FormSelectField
            control={form.control}
            name="status"
            label="Status"
            required
            options={["Active", "Inactive"]}
          />
          <FormSelectField
            control={form.control}
            name="employeeId"
            label="Linked Employee"
            options={[
              { value: NO_EMPLOYEE, label: "None (system account)" },
              ...linkableEmployees.map((e) => ({ value: e.id, label: e.name })),
            ]}
          />

          <div className="flex justify-end gap-2 sm:col-span-2">
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
