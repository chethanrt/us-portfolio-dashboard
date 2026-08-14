import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormCheckboxGroupField, FormInputField, FormSelectField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePermission } from "@/security";
import type { Employee, Project } from "@/types";

const REQUIRED = "This field is required.";

const TEAMS = ["Leadership", "Software Engineering", "Marketing & Communication", "Quality Assurance"];

/** Sentinel for "no manager" — Radix Select can't hold an empty string value. */
const NO_MANAGER = "__none__";

function buildEmployeeSchema(takenEmails: Set<string>) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters.")
      .max(80, "Name must be at most 80 characters."),
    email: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .email("Please enter a valid email address.")
      .refine((value) => !takenEmails.has(value.toLowerCase()), {
        message: "This email already exists.",
      }),
    role: z.string().min(1, REQUIRED),
    experience: z
      .string()
      .min(1, REQUIRED)
      .refine((value) => !Number.isNaN(Number(value)), { message: "Please enter a valid number." })
      .refine((value) => Number(value) >= 0 && Number(value) <= 40, {
        message: "Experience must be between 0 and 40.",
      }),
    team: z.string().min(1, REQUIRED),
    skills: z.array(z.string()).min(1, "Select at least one skill."),
    projects: z.array(z.string()),
    status: z.string().min(1, REQUIRED),
    managerId: z.string(),
  });
}

type EmployeeFormValues = z.infer<ReturnType<typeof buildEmployeeSchema>>;

const EMPTY_VALUES: EmployeeFormValues = {
  name: "",
  email: "",
  role: "",
  experience: "",
  team: "",
  skills: [],
  projects: [],
  status: "Active",
  managerId: NO_MANAGER,
};

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  employee: Employee | null;
  employees: Employee[];
  projects: Project[];
  /** Settings-managed role list (Settings > Roles). */
  roles: string[];
  /** Settings-managed skills list (Settings > Skills). */
  skillOptions: string[];
  onSave: (values: Omit<Employee, "id">) => Promise<void>;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  employees,
  projects,
  roles,
  skillOptions,
  onSave,
}: EmployeeFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(employee);

  // Field-level security: hidden fields are not rendered, read-only fields are disabled.
  const { canViewField, canEditField } = usePermission();
  const show = (field: string) => canViewField("people", field);
  const readOnly = (field: string) => !canEditField("people", field);

  // Duplicate email check excludes the employee being edited (docs/08).
  const schema = useMemo(() => {
    const takenEmails = new Set(
      employees.filter((e) => e.id !== employee?.id).map((e) => e.email.toLowerCase())
    );
    return buildEmployeeSchema(takenEmails);
  }, [employees, employee]);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        employee
          ? {
              name: employee.name,
              email: employee.email,
              role: employee.role,
              experience: String(employee.experience),
              team: employee.team,
              skills: employee.skills,
              projects: employee.projects,
              status: employee.status,
              managerId: employee.managerId ?? NO_MANAGER,
            }
          : EMPTY_VALUES
      );
    }
  }, [open, employee, form]);

  // Can't report to yourself or to one of your own direct reports (would create a cycle).
  const managerOptions = useMemo(() => {
    const ownDirectReportIds = new Set(
      employees.filter((e) => employee && e.managerId === employee.id).map((e) => e.id)
    );
    return [
      { value: NO_MANAGER, label: "— No manager (top of hierarchy) —" },
      ...employees
        .filter(
          (e) =>
            e.id !== employee?.id && e.status !== "Ex-Employee" && !ownDirectReportIds.has(e.id)
        )
        .map((e) => ({ value: e.id, label: `${e.name} (${e.role})` })),
    ];
  }, [employees, employee]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await onSave({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role as Employee["role"],
        experience: Number(values.experience),
        team: values.team,
        skills: values.skills,
        projects: values.projects,
        profileImage: employee?.profileImage ?? "",
        status: values.status as Employee["status"],
        managerId: values.managerId === NO_MANAGER ? null : values.managerId,
      });
      onOpenChange(false);
    } catch {
      // save failed — the caller shows the error toast; keep the dialog open
    } finally {
      setIsSaving(false);
    }
  });

  const projectOptions = [...new Set(projects.map((p) => p.name))].map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !isSaving && onOpenChange(next)}
      title={isEdit ? "Edit Employee" : "Add Employee"}
      description={
        isEdit
          ? `Employee ID: ${employee?.id}`
          : "Employee ID is generated automatically."
      }
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          {show("name") && (
            <FormInputField control={form.control} name="name" label="Name" placeholder="Full name" required disabled={readOnly("name")} />
          )}
          {show("email") && (
            <FormInputField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="name@company.com"
              required
              disabled={readOnly("email")}
            />
          )}
          {show("role") && (
            <FormSelectField control={form.control} name="role" label="Role" options={roles} required disabled={readOnly("role")} />
          )}
          {show("experience") && (
            <FormInputField
              control={form.control}
              name="experience"
              label="Experience (years)"
              type="number"
              min="0"
              max="40"
              required
              disabled={readOnly("experience")}
            />
          )}
          {show("team") && (
            <FormSelectField control={form.control} name="team" label="Team" options={TEAMS} required disabled={readOnly("team")} />
          )}
          {show("status") && (
            <FormSelectField
              control={form.control}
              name="status"
              label="Status"
              options={["Active", "Inactive", "Ex-Employee"]}
              required
              disabled={readOnly("status")}
            />
          )}
          {show("managerId") && (
            <FormSelectField
              control={form.control}
              name="managerId"
              label="Reports To"
              options={managerOptions}
              disabled={readOnly("managerId")}
            />
          )}
          {show("skills") && (
            <FormCheckboxGroupField
              control={form.control}
              name="skills"
              label="Skills"
              required
              options={skillOptions.map((s) => ({ value: s, label: s }))}
              disabled={readOnly("skills")}
            />
          )}
          {show("projects") && (
            <FormCheckboxGroupField
              control={form.control}
              name="projects"
              label="Projects"
              options={projectOptions}
              disabled={readOnly("projects")}
            />
          )}

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
