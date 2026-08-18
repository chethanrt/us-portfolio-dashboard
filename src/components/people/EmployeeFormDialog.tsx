import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormCheckboxGroupField, FormInputField, FormSelectField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { usePermission } from "@/security";
import type { Employee, POC, Project } from "@/types";
import { getEmployeeProjectAssignments } from "@/utils/employeeAssignments";

const REQUIRED = "This field is required.";

const TEAMS = ["Leadership", "Software Engineering", "Marketing & Communication", "Quality Assurance"];

const BUSINESS_UNITS = [
  "TS-ADM",
  "TS-Data",
  "TS- Digital eCommerce",
  "TS- Digital Marketing",
  "TS- Delivery Management",
  "TS- Project Management",
];

const TECH_NON_TECH = ["Tech", "Non-Tech"];

/** Sentinel for "no manager"/"no leader" — Radix Select can't hold an empty string value. */
const NO_MANAGER = "__none__";
const NO_LEADER = "__none__";

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
    designation: z.string(),
    experience: z
      .string()
      .min(1, REQUIRED)
      .refine((value) => !Number.isNaN(Number(value)), { message: "Please enter a valid number." })
      .refine((value) => Number(value) >= 0 && Number(value) <= 40, {
        message: "Experience must be between 0 and 40.",
      }),
    team: z.string().min(1, REQUIRED),
    skills: z.array(z.string()).min(1, "Select at least one skill."),
    pocIds: z.array(z.string()),
    status: z.string().min(1, REQUIRED),
    managerId: z.string(),
    leaderId: z.string(),
    businessUnit: z.string(),
    techNonTech: z.string().min(1, REQUIRED),
  });
}

type EmployeeFormValues = z.infer<ReturnType<typeof buildEmployeeSchema>>;

const EMPTY_VALUES: EmployeeFormValues = {
  name: "",
  email: "",
  role: "",
  designation: "",
  experience: "",
  team: "",
  skills: [],
  pocIds: [],
  status: "Active",
  managerId: NO_MANAGER,
  leaderId: NO_LEADER,
  businessUnit: "",
  techNonTech: "Tech",
};

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  employee: Employee | null;
  employees: Employee[];
  /** All projects — used to show (read-only) this employee's current project assignments. */
  projects: Project[];
  /** All POCs — used to pre-select this employee's current team assignments. */
  pocs: POC[];
  /** Settings-managed role list (Settings > Roles). */
  roles: string[];
  /** Settings-managed skills list (Settings > Skills). */
  skillOptions: string[];
  /** `pocIds` is this employee's edited POC *team* membership — never touches `ownerId`. */
  onSave: (values: Omit<Employee, "id">, pocIds: string[]) => Promise<void>;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  employees,
  projects,
  pocs,
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
              designation: employee.designation,
              experience: String(employee.experience),
              team: employee.team,
              skills: employee.skills,
              pocIds: pocs.filter((p) => p.team.includes(employee.id)).map((p) => p.id),
              status: employee.status,
              managerId: employee.managerId ?? NO_MANAGER,
              leaderId: employee.leaderId ?? NO_LEADER,
              businessUnit: employee.businessUnit,
              techNonTech: employee.techNonTech,
            }
          : EMPTY_VALUES
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const leaderOptions = useMemo(
    () => [
      { value: NO_LEADER, label: "— No leader —" },
      ...employees
        .filter((e) => e.id !== employee?.id && e.status !== "Ex-Employee")
        .map((e) => ({ value: e.id, label: `${e.name} (${e.role})` })),
    ],
    [employees, employee]
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await onSave(
        {
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          role: values.role as Employee["role"],
          designation: values.designation.trim(),
          experience: Number(values.experience),
          team: values.team,
          skills: values.skills,
          // No longer manually edited here — kept in sync from Project assignments (see EmployeeService.syncProjectMembership).
          projects: employee?.projects ?? [],
          profileImage: employee?.profileImage ?? "",
          status: values.status as Employee["status"],
          managerId: values.managerId === NO_MANAGER ? null : values.managerId,
          leaderId: values.leaderId === NO_LEADER ? null : values.leaderId,
          businessUnit: values.businessUnit,
          techNonTech: values.techNonTech as Employee["techNonTech"],
        },
        values.pocIds
      );
      onOpenChange(false);
    } catch {
      // save failed — the caller shows the error toast; keep the dialog open
    } finally {
      setIsSaving(false);
    }
  });

  const pocOptions = pocs.map((poc) => ({ value: poc.id, label: poc.title }));
  const projectAssignments = employee ? getEmployeeProjectAssignments(employee, projects) : [];

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
          {show("role") &&
            (isEdit ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm">{employee?.role}</p>
                <p className="text-xs text-muted-foreground">
                  Read-only — promotions/demotions are made from User Management, on this person's login account.
                </p>
              </div>
            ) : (
              <FormSelectField control={form.control} name="role" label="Role" options={roles} required disabled={readOnly("role")} />
            ))}
          {show("designation") && (
            <div className="space-y-1.5">
              <FormInputField
                control={form.control}
                name="designation"
                label="Designation"
                placeholder="e.g. Senior Software Engineer I"
                disabled={readOnly("designation")}
              />
              <p className="text-xs text-muted-foreground">
                Exact job title shown on this person's own dashboard — separate from Role, which controls permissions.
              </p>
            </div>
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
          {show("leaderId") && (
            <FormSelectField
              control={form.control}
              name="leaderId"
              label="Leader"
              options={leaderOptions}
              disabled={readOnly("leaderId")}
            />
          )}
          {show("businessUnit") && (
            <FormSelectField
              control={form.control}
              name="businessUnit"
              label="Business Unit"
              options={BUSINESS_UNITS}
              disabled={readOnly("businessUnit")}
            />
          )}
          {show("techNonTech") && (
            <FormSelectField
              control={form.control}
              name="techNonTech"
              label="Tech/Non-Tech"
              options={TECH_NON_TECH}
              required
              disabled={readOnly("techNonTech")}
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
          {show("projects") && isEdit && (
            <div className="space-y-1.5 sm:col-span-2">
              <p className="text-sm font-medium">Projects</p>
              {projectAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not currently assigned to any project.</p>
              ) : (
                <div className="space-y-1 rounded-md border p-2">
                  {projectAssignments.map(({ project, roles: projectRoles }) => (
                    <div key={project.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{project.name}</span>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {projectRoles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-[10px]">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Read-only — project assignment is edited from the Projects page.
              </p>
            </div>
          )}
          {show("pocs") && (
            <FormCheckboxGroupField
              control={form.control}
              name="pocIds"
              label="POCs"
              options={pocOptions}
              disabled={readOnly("pocs")}
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
