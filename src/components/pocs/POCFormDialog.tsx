import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormCheckboxGroupField, FormInputField, FormSelectField, FormTextareaField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePermission } from "@/security";
import { checkPOCScheduleConflicts } from "@/services/POCService";
import type { ScheduleConflict } from "@/services/POCService";
import type { Employee, POC, Project } from "@/types";

const REQUIRED = "This field is required.";
const URL_MESSAGE = "Please enter a valid URL.";

const CATEGORIES = ["Automation", "Documentation", "CMS", "Marketing", "Testing", "Development", "Estimation"];
const STATUSES = ["Idea", "In Progress", "Completed", "On Hold"];

/** Owner is restricted to senior roles; Team to junior roles (user-specified split). */
const OWNER_ELIGIBLE_ROLES = ["Director", "Delivery Manager", "Engineering Manager", "Senior Tech Lead", "Tech Lead"];
const TEAM_ELIGIBLE_ROLES = ["Senior Developer", "Developer", "Intern"];

/** POCs are longer-running than ad-hoc calendar blocks — a quarter plus buffer. */
const MAX_POC_RANGE_DAYS = 120;

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\//.test(value), { message: URL_MESSAGE });

function buildPOCSchema(existing: POC[], editingId: string | null) {
  return z
    .object({
      title: z.string().trim().min(1, REQUIRED).max(100, "Maximum 100 characters."),
      projectId: z.string().min(1, REQUIRED),
      ownerId: z.string().min(1, REQUIRED),
      team: z.array(z.string()),
      category: z.string().min(1, REQUIRED),
      status: z.string().min(1, REQUIRED),
      description: z.string().trim().min(1, REQUIRED).max(500, "Maximum 500 characters."),
      businessValue: z.string().trim().min(1, REQUIRED).max(500, "Maximum 500 characters."),
      hoursSaved: z
        .string()
        .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
          message: "Hours must be a positive number.",
        }),
      repo: optionalUrl,
      demo: optionalUrl,
      startDate: z.string().min(1, REQUIRED),
      endDate: z.string().min(1, REQUIRED),
      startTime: z.string().min(1, REQUIRED),
      hoursPerDay: z
        .string()
        .min(1, REQUIRED)
        .refine((value) => !Number.isNaN(Number(value)), { message: "Please enter a valid number." })
        .refine((value) => Number(value) > 0 && Number(value) <= 12, {
          message: "Hours per day must be between 0 and 12.",
        }),
    })
    // End Date must be on/after Start Date, and the range must stay within the safety cap.
    .refine((values) => values.endDate >= values.startDate, {
      message: "End Date must be on or after the Start Date.",
      path: ["endDate"],
    })
    .refine(
      (values) =>
        differenceInCalendarDays(parseISO(values.endDate), parseISO(values.startDate)) < MAX_POC_RANGE_DAYS,
      { message: `Date range cannot exceed ${MAX_POC_RANGE_DAYS} days.`, path: ["endDate"] }
    )
    // docs/08: POC title must be unique within the same project.
    .superRefine((values, ctx) => {
      const duplicate = existing.some(
        (poc) =>
          poc.id !== editingId &&
          poc.projectId === values.projectId &&
          poc.title.trim().toLowerCase() === values.title.trim().toLowerCase()
      );
      if (duplicate) {
        ctx.addIssue({
          code: "custom",
          path: ["title"],
          message: "A POC with this title already exists in the selected project.",
        });
      }
    });
}

type POCFormValues = z.infer<ReturnType<typeof buildPOCSchema>>;

const EMPTY_VALUES: POCFormValues = {
  title: "",
  projectId: "",
  ownerId: "",
  team: [],
  category: "",
  status: "Idea",
  description: "",
  businessValue: "",
  hoursSaved: "",
  repo: "",
  demo: "",
  startDate: "",
  endDate: "",
  startTime: "",
  hoursPerDay: "",
};

interface POCFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  poc: POC | null;
  pocs: POC[];
  /** Full roster — source for the Team field. */
  employees: Employee[];
  /** Owner dropdown source (scope-restricted by the page for "own POCs" users). */
  ownerCandidates: Employee[];
  projects: Project[];
  onSave: (values: Omit<POC, "id">) => Promise<void>;
}

export function POCFormDialog({
  open,
  onOpenChange,
  poc,
  pocs,
  employees,
  ownerCandidates,
  projects,
  onSave,
}: POCFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleConflicts, setScheduleConflicts] = useState<ScheduleConflict[]>([]);
  const isEdit = Boolean(poc);

  // Field-level security: hidden fields are not rendered, read-only fields are disabled.
  const { canViewField, canEditField } = usePermission();
  const show = (field: string) => canViewField("pocs", field);
  const readOnly = (field: string) => !canEditField("pocs", field);

  const schema = useMemo(() => buildPOCSchema(pocs, poc?.id ?? null), [pocs, poc]);

  const form = useForm<POCFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      setScheduleConflicts([]);
      form.reset(
        poc
          ? {
              title: poc.title,
              projectId: poc.projectId,
              ownerId: poc.ownerId,
              team: poc.team,
              category: poc.category,
              status: poc.status,
              description: poc.description,
              businessValue: poc.businessValue,
              hoursSaved: poc.hoursSaved > 0 ? String(poc.hoursSaved) : "",
              repo: poc.repo,
              demo: poc.demo,
              startDate: poc.startDate,
              endDate: poc.endDate,
              startTime: poc.startTime,
              hoursPerDay: poc.hoursPerDay > 0 ? String(poc.hoursPerDay) : "",
            }
          : EMPTY_VALUES
      );
    }
  }, [open, poc, form]);

  // Owner is role-restricted only when there's an actual roster to restrict — a forced
  // single candidate ("own POCs" scope) isn't a choice the role gate needs to police.
  const ownerOptions = useMemo(() => {
    const candidates =
      ownerCandidates.length === 1
        ? ownerCandidates
        : ownerCandidates.filter((e) => OWNER_ELIGIBLE_ROLES.includes(e.role));
    return candidates.map((e) => ({ value: e.id, label: e.name }));
  }, [ownerCandidates]);

  const teamOptions = useMemo(
    () =>
      employees
        .filter((e) => TEAM_ELIGIBLE_ROLES.includes(e.role))
        .map((e) => ({ value: e.id, label: `${e.name} (${e.role})` })),
    [employees]
  );

  const employeeById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const conflicts = await checkPOCScheduleConflicts({
        employeeIds: [values.ownerId, ...values.team],
        schedule: {
          startDate: values.startDate,
          endDate: values.endDate,
          startTime: values.startTime,
          hoursPerDay: Number(values.hoursPerDay),
        },
        excludeBlockGroupId: poc?.blockGroupId ?? null,
      });
      if (conflicts.length > 0) {
        setScheduleConflicts(conflicts);
        return;
      }
      setScheduleConflicts([]);

      await onSave({
        title: values.title.trim(),
        projectId: values.projectId,
        ownerId: values.ownerId,
        team: values.team,
        category: values.category as POC["category"],
        status: values.status as POC["status"],
        description: values.description.trim(),
        businessValue: values.businessValue.trim(),
        hoursSaved: values.hoursSaved ? Number(values.hoursSaved) : 0,
        repo: values.repo.trim(),
        demo: values.demo.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        startTime: values.startTime,
        hoursPerDay: Number(values.hoursPerDay),
        blockGroupId: poc?.blockGroupId ?? null,
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
      title={isEdit ? "Edit POC" : "Add POC"}
      description="Track an AI innovation or proof of concept."
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          {show("title") && (
            <FormInputField control={form.control} name="title" label="Title" placeholder="POC title" required disabled={readOnly("title")} />
          )}
          {show("projectId") && (
            <FormSelectField
              control={form.control}
              name="projectId"
              label="Project"
              required
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              disabled={readOnly("projectId")}
            />
          )}
          {show("ownerId") && (
            <FormSelectField
              control={form.control}
              name="ownerId"
              label="Owner"
              required
              options={ownerOptions}
              disabled={readOnly("ownerId")}
            />
          )}
          {show("category") && (
            <FormSelectField control={form.control} name="category" label="Category" required options={CATEGORIES} disabled={readOnly("category")} />
          )}
          {show("status") && (
            <FormSelectField control={form.control} name="status" label="Status" required options={STATUSES} disabled={readOnly("status")} />
          )}
          {show("team") && (
            <FormCheckboxGroupField
              control={form.control}
              name="team"
              label="Team"
              options={teamOptions}
              disabled={readOnly("team")}
            />
          )}
          {show("startDate") && (
            <FormInputField control={form.control} name="startDate" label="Start Date" type="date" required disabled={readOnly("startDate")} />
          )}
          {show("endDate") && (
            <FormInputField control={form.control} name="endDate" label="End Date" type="date" required disabled={readOnly("endDate")} />
          )}
          {show("startTime") && (
            <FormInputField control={form.control} name="startTime" label="Start Time" type="time" required disabled={readOnly("startTime")} />
          )}
          {show("hoursPerDay") && (
            <FormInputField
              control={form.control}
              name="hoursPerDay"
              label="Hours per Day"
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              required
              disabled={readOnly("hoursPerDay")}
            />
          )}
          {show("hoursSaved") && (
            <FormInputField
              control={form.control}
              name="hoursSaved"
              label="Hours Saved"
              type="number"
              min="0"
              step="0.5"
              disabled={readOnly("hoursSaved")}
            />
          )}
          {show("description") && (
            <FormTextareaField
              control={form.control}
              name="description"
              label="Description"
              placeholder="What does this POC do?"
              maxLength={500}
              required
              disabled={readOnly("description")}
            />
          )}
          {show("businessValue") && (
            <FormTextareaField
              control={form.control}
              name="businessValue"
              label="Business Value"
              placeholder="What value does it deliver?"
              rows={2}
              maxLength={500}
              required
              disabled={readOnly("businessValue")}
            />
          )}
          {show("repo") && (
            <FormInputField
              control={form.control}
              name="repo"
              label="Repository URL"
              placeholder="https://github.com/…"
              disabled={readOnly("repo")}
            />
          )}
          {show("demo") && (
            <FormInputField control={form.control} name="demo" label="Demo URL" placeholder="https://…" disabled={readOnly("demo")} />
          )}

          {scheduleConflicts.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">
              <p className="font-medium">Some people are already busy during this schedule:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {scheduleConflicts.map((conflict, index) => (
                  <li key={index}>
                    {employeeById.get(conflict.employeeId)?.name ?? "Unknown"} is busy{" "}
                    {format(parseISO(conflict.date), "MMM d")}{" "}
                    {format(parseISO(conflict.existingEvent.start), "h:mm a")}–
                    {format(parseISO(conflict.existingEvent.end), "h:mm a")} ({conflict.existingEvent.title})
                  </li>
                ))}
              </ul>
            </div>
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
