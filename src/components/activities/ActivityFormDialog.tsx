import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInputField, FormSelectField, FormTextareaField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { Activity, AppSettings, Employee, Project } from "@/types";

const REQUIRED = "This field is required.";

const activitySchema = z.object({
  employeeId: z.string().min(1, REQUIRED),
  projectId: z.string().min(1, REQUIRED),
  date: z
    .string()
    .min(1, REQUIRED)
    .refine((value) => value <= format(new Date(), "yyyy-MM-dd"), {
      message: "Activity date cannot be a future date.",
    }),
  tool: z.string().min(1, REQUIRED),
  category: z.string().min(1, REQUIRED),
  projectStage: z.string().min(1, REQUIRED),
  promptSummary: z.string().trim().min(1, REQUIRED).max(1000, "Maximum 1000 characters."),
  outcome: z.string().trim().min(1, REQUIRED).max(2000, "Maximum 2000 characters."),
  hoursSaved: z
    .string()
    .min(1, REQUIRED)
    .refine((value) => !Number.isNaN(Number(value)), { message: "Please enter a valid number." })
    .refine((value) => Number(value) >= 0 && Number(value) <= 100, {
      message: "Value must be between 0 and 100.",
    }),
  impact: z.string().min(1, REQUIRED),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

const EMPTY_VALUES: ActivityFormValues = {
  employeeId: "",
  projectId: "",
  date: format(new Date(), "yyyy-MM-dd"),
  tool: "",
  category: "",
  projectStage: "",
  promptSummary: "",
  outcome: "",
  hoursSaved: "",
  impact: "",
};

function toFormValues(activity: Activity): ActivityFormValues {
  return {
    employeeId: activity.employeeId,
    projectId: activity.projectId,
    date: activity.date,
    tool: activity.tool,
    category: activity.category,
    projectStage: activity.projectStage,
    promptSummary: activity.promptSummary,
    outcome: activity.outcome,
    hoursSaved: String(activity.hoursSaved),
    impact: activity.impact,
  };
}

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  activity: Activity | null;
  employees: Employee[];
  projects: Project[];
  settings: AppSettings;
  onSave: (values: Omit<Activity, "id">) => Promise<void>;
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  employees,
  projects,
  settings,
  onSave,
}: ActivityFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(activity);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: EMPTY_VALUES,
  });

  // Load values whenever the dialog opens for add or edit.
  useEffect(() => {
    if (open) form.reset(activity ? toFormValues(activity) : EMPTY_VALUES);
  }, [open, activity, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await onSave({
        employeeId: values.employeeId,
        projectId: values.projectId,
        date: values.date,
        tool: values.tool as Activity["tool"],
        category: values.category as Activity["category"],
        projectStage: values.projectStage as Activity["projectStage"],
        promptSummary: values.promptSummary.trim(),
        outcome: values.outcome.trim(),
        hoursSaved: Number(values.hoursSaved),
        impact: values.impact as Activity["impact"],
        attachment: activity?.attachment ?? "",
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
      title={isEdit ? "Edit AI Activity" : "Add AI Activity"}
      description={isEdit ? "Update the logged AI activity." : "Log how AI was used on a project."}
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <FormSelectField
            control={form.control}
            name="employeeId"
            label="Employee"
            required
            options={employees.map((e) => ({ value: e.id, label: e.name }))}
          />
          <FormSelectField
            control={form.control}
            name="projectId"
            label="Project"
            required
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
          <FormInputField control={form.control} name="date" label="Date" type="date" required />
          <FormSelectField control={form.control} name="tool" label="AI Tool" required options={settings.aiTools} />
          <FormSelectField
            control={form.control}
            name="category"
            label="Activity Type"
            required
            options={settings.activityTypes}
          />
          <FormSelectField
            control={form.control}
            name="projectStage"
            label="Project Stage"
            required
            options={settings.projectStages}
          />
          <FormTextareaField
            control={form.control}
            name="promptSummary"
            label="Prompt Summary"
            placeholder="What did you ask the AI to do?"
            maxLength={1000}
            required
          />
          <FormTextareaField
            control={form.control}
            name="outcome"
            label="Outcome"
            placeholder="What was the result?"
            maxLength={2000}
            required
          />
          <FormInputField
            control={form.control}
            name="hoursSaved"
            label="Hours Saved"
            type="number"
            step="0.5"
            min="0"
            max="100"
            required
          />
          <FormSelectField
            control={form.control}
            name="impact"
            label="Impact"
            required
            options={settings.impactLevels}
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
