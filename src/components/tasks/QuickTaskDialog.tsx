import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInputField, FormSelectField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { Employee, Project, Task, TaskCategory, TaskPriority } from "@/types";

const REQUIRED = "This field is required.";
const NO_PROJECT = "none";

const quickTaskSchema = z.object({
  title: z.string().trim().min(1, REQUIRED).max(120, "Maximum 120 characters."),
  assigneeId: z.string().min(1, REQUIRED),
  reporterId: z.string().min(1, REQUIRED),
  projectId: z.string(),
  category: z.string().min(1, REQUIRED),
  priority: z.string().min(1, REQUIRED),
  dueDate: z.string(),
});

type QuickTaskValues = z.infer<typeof quickTaskSchema>;

const EMPTY_VALUES: QuickTaskValues = {
  title: "",
  assigneeId: "",
  reporterId: "",
  projectId: NO_PROJECT,
  category: "",
  priority: "Medium",
  dueDate: "",
};

interface QuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Employees the current user may assign (permission-scoped). */
  employees: Employee[];
  projects: Project[];
  categories: TaskCategory[];
  /** Status new tasks enter, e.g. "To Do" (workflow config). */
  defaultStatus: string;
  /** The current user's employee id — default Reporter selection (editable), and always the actual createdBy/lastModifiedBy. */
  reporterId: string;
  onSave: (values: Omit<Task, "id" | "taskNumber" | "createdDate" | "updatedDate">) => Promise<void>;
}

/** Lightweight task creation (docs/11 Quick Task): six fields, lands in To Do. */
export function QuickTaskDialog({
  open,
  onOpenChange,
  employees,
  projects,
  categories,
  defaultStatus,
  reporterId,
  onSave,
}: QuickTaskDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<QuickTaskValues>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) form.reset({ ...EMPTY_VALUES, reporterId });
  }, [open, reporterId, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const projectId = values.projectId === NO_PROJECT ? null : values.projectId;
      await onSave({
        title: values.title.trim(),
        description: "",
        type: projectId ? "Project" : "Standalone",
        category: values.category,
        projectId,
        assigneeId: values.assigneeId,
        reporterId: values.reporterId,
        createdBy: reporterId,
        lastModifiedBy: reporterId,
        priority: values.priority as TaskPriority,
        status: defaultStatus,
        estimateHours: 0,
        actualHours: 0,
        percentComplete: 0,
        startDate: "",
        dueDate: values.dueDate,
        completedDate: "",
        displayOrder: 0,
        labels: [],
        aiTool: "",
        linkedActivityId: "",
        linkedPocId: "",
        comments: [],
        attachments: [],
        archived: false,
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
      title="Quick Task"
      description={`Creates the task directly in ${defaultStatus}.`}
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <FormInputField control={form.control} name="title" label="Title" placeholder="What needs to be done?" required />
          </div>
          <FormSelectField
            control={form.control}
            name="assigneeId"
            label="Assignee"
            required
            options={employees.map((e) => ({ value: e.id, label: e.name }))}
          />
          <FormSelectField
            control={form.control}
            name="reporterId"
            label="Reporter"
            required
            options={employees.map((e) => ({ value: e.id, label: e.name }))}
          />
          <FormSelectField
            control={form.control}
            name="projectId"
            label="Project"
            options={[
              { value: NO_PROJECT, label: "None (Standalone)" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <FormSelectField
            control={form.control}
            name="category"
            label="Category"
            required
            options={categories.map((c) => c.name)}
          />
          <FormSelectField
            control={form.control}
            name="priority"
            label="Priority"
            required
            options={["Critical", "High", "Medium", "Low"]}
          />
          <FormInputField control={form.control} name="dueDate" label="Due Date" type="date" />

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
