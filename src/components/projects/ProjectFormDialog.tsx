import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  FormCheckboxGroupField,
  FormInputField,
  FormSelectField,
  Modal,
  ProgressBar,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePermission } from "@/security";
import type { Employee, Project } from "@/types";

const REQUIRED = "This field is required.";

const PROGRAMS = ["US Portfolio – Commerce", "US Portfolio – CMS", "US Portfolio – Marketing"];
const STAGES = [
  "Planning",
  "Discovery",
  "Requirement Gathering",
  "Estimation",
  "Development",
  "Testing",
  "Documentation",
  "Deployment",
  "Support",
];
const STATUSES = ["Active", "On Hold", "Completed"];

function buildProjectSchema(existing: Project[], editingId: string | null) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, REQUIRED)
        .max(100, "Maximum 100 characters.")
        // docs/08: project name must be unique
        .refine(
          (value) =>
            !existing.some(
              (p) => p.id !== editingId && p.name.trim().toLowerCase() === value.trim().toLowerCase()
            ),
          { message: "A project with this name already exists." }
        ),
      client: z.string().trim().min(1, REQUIRED).max(80, "Maximum 80 characters."),
      program: z.string().min(1, REQUIRED),
      technology: z.array(z.string()).min(1, "Please select at least one technology."),
      stage: z.string().min(1, REQUIRED),
      status: z.string().min(1, REQUIRED),
      manager: z.string(),
      techLead: z.string(),
      projectManager: z.string(),
      startDate: z.string().min(1, "Start Date cannot be empty."),
      endDate: z.string(),
      aiAdoption: z.number().min(0).max(100),
      aiAdoptionCategories: z.array(z.string()),
      members: z.array(z.string()).min(1, "Please assign at least one team member."),
    })
    // docs/08: End Date must be after Start Date
    .refine((values) => !values.endDate || values.endDate > values.startDate, {
      message: "End Date must be after Start Date.",
      path: ["endDate"],
    });
}

type ProjectFormValues = z.infer<ReturnType<typeof buildProjectSchema>>;

const EMPTY_VALUES: ProjectFormValues = {
  name: "",
  client: "",
  program: "",
  technology: [],
  stage: "Planning",
  status: "Active",
  manager: "",
  techLead: "",
  projectManager: "",
  startDate: "",
  endDate: "",
  aiAdoption: 0,
  aiAdoptionCategories: [],
  members: [],
};

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  project: Project | null;
  projects: Project[];
  employees: Employee[];
  /** Settings-managed technology list (Settings > Technical Skills). */
  technicalSkills: string[];
  /** Settings-managed AI adoption category options (Settings > AI Adoption Categories). */
  aiAdoptionCategoryOptions: string[];
  onSave: (values: Omit<Project, "id">) => Promise<void>;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  projects,
  employees,
  technicalSkills,
  aiAdoptionCategoryOptions,
  onSave,
}: ProjectFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(project);

  // Field-level security: hidden fields are not rendered, read-only fields are disabled.
  const { canViewField, canEditField } = usePermission();
  const show = (field: string) => canViewField("projects", field);
  const readOnly = (field: string) => !canEditField("projects", field);

  const schema = useMemo(() => buildProjectSchema(projects, project?.id ?? null), [projects, project]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        project
          ? {
              name: project.name,
              client: project.client,
              program: project.program,
              technology: project.technology,
              stage: project.stage,
              status: project.status,
              manager: project.manager,
              techLead: project.techLead,
              projectManager: project.projectManager,
              startDate: project.startDate,
              endDate: project.endDate,
              aiAdoption: project.aiAdoption,
              aiAdoptionCategories: project.aiAdoptionCategories,
              members: project.members,
            }
          : EMPTY_VALUES
      );
    }
  }, [open, project, form]);

  // AI Adoption % is derived from how many of the available categories are
  // selected, rather than set manually — keeps the number honest and in sync
  // with the categories the team actually reports.
  const selectedCategories = form.watch("aiAdoptionCategories") ?? [];
  const totalCategoryOptions = aiAdoptionCategoryOptions.length;
  const computedAiAdoption =
    totalCategoryOptions > 0 ? Math.round((selectedCategories.length / totalCategoryOptions) * 100) : 0;

  useEffect(() => {
    form.setValue("aiAdoption", computedAiAdoption, { shouldDirty: true });
  }, [computedAiAdoption, form]);

  // docs/08 business rules: EM, Tech Lead and PM come from matching roles.
  const managerOptions = employees.filter((e) => e.role === "Engineering Manager").map((e) => e.name);
  const techLeadOptions = employees
    .filter((e) => e.role === "Tech Lead" || e.role === "Senior Tech Lead")
    .map((e) => e.name);
  const projectManagerOptions = employees.filter((e) => e.role === "Project Manager").map((e) => e.name);

  // Whoever is picked as Engineering Manager / Tech Lead / Project Manager is
  // already on the team — don't let them be picked again as a Team Member.
  const managerName = form.watch("manager");
  const techLeadName = form.watch("techLead");
  const projectManagerName = form.watch("projectManager");
  const leadIds = new Set(
    [managerName, techLeadName, projectManagerName]
      .map((name) => employees.find((e) => e.name === name)?.id)
      .filter((id): id is string => Boolean(id))
  );
  const memberOptions = employees
    .filter((e) => !leadIds.has(e.id))
    .map((e) => ({ value: e.id, label: `${e.name} (${e.role})` }));

  useEffect(() => {
    const current: string[] = form.getValues("members") ?? [];
    const withoutLeads = current.filter((id) => !leadIds.has(id));
    if (withoutLeads.length !== current.length) {
      form.setValue("members", withoutLeads, { shouldDirty: true, shouldValidate: true });
    }
  }, [managerName, techLeadName, projectManagerName]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await onSave({
        name: values.name.trim(),
        client: values.client.trim(),
        program: values.program,
        technology: values.technology,
        stage: values.stage as Project["stage"],
        status: values.status as Project["status"],
        manager: values.manager,
        techLead: values.techLead,
        projectManager: values.projectManager,
        startDate: values.startDate,
        endDate: values.endDate,
        aiAdoption: values.aiAdoption,
        aiAdoptionCategories: values.aiAdoptionCategories,
        members: values.members,
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
      title={isEdit ? "Edit Project" : "Add Project"}
      description={isEdit ? `Update ${project?.name}.` : "Create a new portfolio project."}
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          {show("name") && (
            <FormInputField control={form.control} name="name" label="Project Name" placeholder="Project name" required disabled={readOnly("name")} />
          )}
          {show("client") && (
            <FormInputField control={form.control} name="client" label="Client" placeholder="Client name" required disabled={readOnly("client")} />
          )}
          {show("program") && (
            <FormSelectField control={form.control} name="program" label="Program" required options={PROGRAMS} disabled={readOnly("program")} />
          )}
          {show("technology") && (
            <FormCheckboxGroupField
              control={form.control}
              name="technology"
              label="Technology"
              required
              options={technicalSkills.map((t) => ({ value: t, label: t }))}
              disabled={readOnly("technology")}
            />
          )}
          {show("stage") && (
            <FormSelectField control={form.control} name="stage" label="Project Stage" required options={STAGES} disabled={readOnly("stage")} />
          )}
          {show("status") && (
            <FormSelectField control={form.control} name="status" label="Status" required options={STATUSES} disabled={readOnly("status")} />
          )}
          {show("manager") && (
            <FormSelectField
              control={form.control}
              name="manager"
              label="Engineering Manager"
              options={managerOptions}
              disabled={readOnly("manager")}
            />
          )}
          {show("techLead") && (
            <FormSelectField control={form.control} name="techLead" label="Tech Lead" options={techLeadOptions} disabled={readOnly("techLead")} />
          )}
          {show("projectManager") && (
            <FormSelectField
              control={form.control}
              name="projectManager"
              label="Project Manager"
              options={projectManagerOptions}
              disabled={readOnly("projectManager")}
            />
          )}
          {show("startDate") && (
            <FormInputField control={form.control} name="startDate" label="Start Date" type="date" required disabled={readOnly("startDate")} />
          )}
          {show("endDate") && (
            <FormInputField control={form.control} name="endDate" label="End Date" type="date" disabled={readOnly("endDate")} />
          )}
          {show("aiAdoptionCategories") && (
            <FormCheckboxGroupField
              control={form.control}
              name="aiAdoptionCategories"
              label="AI Adoption Categories"
              options={aiAdoptionCategoryOptions.map((c) => ({ value: c, label: c }))}
              disabled={readOnly("aiAdoptionCategories")}
            />
          )}
          {show("aiAdoption") && (
            <div className="space-y-1 sm:col-span-2">
              <ProgressBar label="AI Adoption" value={computedAiAdoption} />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from {selectedCategories.length} of {totalCategoryOptions} AI Adoption Categories selected.
              </p>
            </div>
          )}
          {show("members") && (
            <FormCheckboxGroupField
              control={form.control}
              name="members"
              label="Team Members"
              required
              options={memberOptions}
              disabled={readOnly("members")}
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
