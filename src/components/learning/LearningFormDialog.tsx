import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInputField, FormSelectField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePermission } from "@/security";
import type { Employee, LearningRecord } from "@/types";

const REQUIRED = "This field is required.";

const learningSchema = z
  .object({
    employeeId: z.string().min(1, REQUIRED),
    course: z.string().trim().min(1, REQUIRED).max(100, "Maximum 100 characters."),
    platform: z.string().min(1, REQUIRED),
    status: z.string().min(1, REQUIRED),
    progress: z
      .string()
      .min(1, REQUIRED)
      .refine((value) => !Number.isNaN(Number(value)), { message: "Please enter a valid number." })
      .refine((value) => Number(value) >= 0 && Number(value) <= 100, {
        message: "Value must be between 0 and 100.",
      }),
    hours: z
      .string()
      .min(1, REQUIRED)
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
        message: "Hours must be a positive number.",
      }),
    completionDate: z.string(),
  })
  // docs/08: Completion Date is required only when Status = Completed, never in the future.
  .refine((values) => values.status !== "Completed" || values.completionDate.length > 0, {
    message: "Completion date is required when the course is completed.",
    path: ["completionDate"],
  })
  .refine(
    (values) => !values.completionDate || values.completionDate <= format(new Date(), "yyyy-MM-dd"),
    { message: "Completion date cannot be in the future.", path: ["completionDate"] }
  );

type LearningFormValues = z.infer<typeof learningSchema>;

const EMPTY_VALUES: LearningFormValues = {
  employeeId: "",
  course: "",
  platform: "",
  status: "",
  progress: "0",
  hours: "0",
  completionDate: "",
};

interface LearningFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  record: LearningRecord | null;
  employees: Employee[];
  onSave: (values: Omit<LearningRecord, "id">) => Promise<void>;
}

export function LearningFormDialog({ open, onOpenChange, record, employees, onSave }: LearningFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(record);

  // Field-level security: hidden fields are not rendered, read-only fields are disabled.
  const { canViewField, canEditField } = usePermission();
  const show = (field: string) => canViewField("learning", field);
  const readOnly = (field: string) => !canEditField("learning", field);

  const form = useForm<LearningFormValues>({
    resolver: zodResolver(learningSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        record
          ? {
              employeeId: record.employeeId,
              course: record.course,
              platform: record.platform,
              status: record.status,
              progress: String(record.progress),
              hours: String(record.hours),
              completionDate: record.completionDate,
            }
          : EMPTY_VALUES
      );
    }
  }, [open, record, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const status = values.status as LearningRecord["status"];
      await onSave({
        employeeId: values.employeeId,
        course: values.course.trim(),
        platform: values.platform as LearningRecord["platform"],
        status,
        progress: status === "Completed" ? 100 : Number(values.progress),
        hours: Number(values.hours),
        certificate: record?.certificate ?? "",
        completionDate: status === "Completed" ? values.completionDate : "",
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
      title={isEdit ? "Edit Learning Record" : "Add Learning Record"}
      description="Track AI course progress and certifications."
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          {show("employeeId") && (
            <FormSelectField
              control={form.control}
              name="employeeId"
              label="Employee"
              required
              options={employees.map((e) => ({ value: e.id, label: e.name }))}
              disabled={readOnly("employeeId")}
            />
          )}
          {show("course") && (
            <FormInputField
              control={form.control}
              name="course"
              label="Course"
              placeholder="e.g. Prompt Engineering"
              required
              disabled={readOnly("course")}
            />
          )}
          {show("platform") && (
            <FormSelectField
              control={form.control}
              name="platform"
              label="Platform"
              required
              options={["Udemy AI Lab", "Internal Training", "Other"]}
              disabled={readOnly("platform")}
            />
          )}
          {show("status") && (
            <FormSelectField
              control={form.control}
              name="status"
              label="Status"
              required
              options={["Not Started", "In Progress", "Completed"]}
              disabled={readOnly("status")}
            />
          )}
          {show("progress") && (
            <FormInputField
              control={form.control}
              name="progress"
              label="Completion %"
              type="number"
              min="0"
              max="100"
              required
              disabled={readOnly("progress")}
            />
          )}
          {show("hours") && (
            <FormInputField control={form.control} name="hours" label="Hours" type="number" min="0" step="0.5" required disabled={readOnly("hours")} />
          )}
          {show("completionDate") && (
            <FormInputField control={form.control} name="completionDate" label="Completion Date" type="date" disabled={readOnly("completionDate")} />
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
