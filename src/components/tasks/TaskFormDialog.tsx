import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInputField, FormSelectField, FormTextareaField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePermission } from "@/security";
import { taskWorkflowService } from "@/services";
import type { Employee, POC, Project, Task, TaskCategory, TaskPriority, TaskType, TaskWorkflowStatus } from "@/types";

const REQUIRED = "This field is required.";
const NONE = "none";

const taskSchema = z
  .object({
    title: z.string().trim().min(1, REQUIRED).max(120, "Maximum 120 characters."),
    description: z.string().trim().max(2000, "Maximum 2000 characters."),
    type: z.string().min(1, REQUIRED),
    category: z.string().min(1, REQUIRED),
    projectId: z.string(),
    assigneeId: z.string().min(1, REQUIRED),
    reporterId: z.string().min(1, REQUIRED),
    priority: z.string().min(1, REQUIRED),
    status: z.string().min(1, REQUIRED),
    estimateHours: z.string().refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: "Estimate cannot be negative.",
    }),
    actualHours: z.string().refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: "Actual hours cannot be negative.",
    }),
    startDate: z.string(),
    dueDate: z.string(),
    labels: z.string(),
    aiTool: z.string(),
    linkedActivityId: z.string(),
    linkedPocId: z.string(),
  })
  // docs/11: Project is required only for Project tasks.
  .refine((v) => v.type !== "Project" || v.projectId !== NONE, {
    message: "Project tasks must reference a project.",
    path: ["projectId"],
  })
  .refine((v) => !v.dueDate || !v.startDate || v.dueDate >= v.startDate, {
    message: "Due Date cannot be before Start Date.",
    path: ["dueDate"],
  });

type TaskFormValues = z.infer<typeof taskSchema>;

const EMPTY_VALUES: TaskFormValues = {
  title: "",
  description: "",
  type: "Project",
  category: "",
  projectId: NONE,
  assigneeId: "",
  reporterId: "",
  priority: "Medium",
  status: "To Do",
  estimateHours: "",
  actualHours: "",
  startDate: "",
  dueDate: "",
  labels: "",
  aiTool: "",
  linkedActivityId: NONE,
  linkedPocId: NONE,
};

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  task: Task | null;
  employees: Employee[];
  projects: Project[];
  categories: TaskCategory[];
  workflow: TaskWorkflowStatus[];
  pocs: POC[];
  /** AI activities selectable for linking (kept short by the caller). */
  activityOptions: { value: string; label: string }[];
  aiTools: string[];
  /** Pre-selects a project (Projects module integration). */
  defaultProjectId?: string | null;
  /** Pre-selects a status (column Add Task button). */
  defaultStatus?: string;
  /** The current user's employee id — default Reporter selection on a new task (editable), and always the actual createdBy/lastModifiedBy. */
  reporterId: string;
  onSave: (values: Omit<Task, "id" | "taskNumber" | "createdDate" | "updatedDate">) => Promise<void>;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  employees,
  projects,
  categories,
  workflow,
  pocs,
  activityOptions,
  aiTools,
  defaultProjectId,
  defaultStatus,
  reporterId,
  onSave,
}: TaskFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(task);

  // Field-level security: hidden fields are not rendered, read-only fields are disabled.
  const { canViewField, canEditField } = usePermission();
  const show = (field: string) => canViewField("tasks", field);
  const readOnly = (field: string) => !canEditField("tasks", field);

  const form = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema), defaultValues: EMPTY_VALUES });
  const type = form.watch("type");

  useEffect(() => {
    if (!open) return;
    form.reset(
      task
        ? {
            title: task.title,
            description: task.description,
            type: task.type,
            category: task.category,
            projectId: task.projectId ?? NONE,
            assigneeId: task.assigneeId,
            reporterId: task.reporterId,
            priority: task.priority,
            status: task.status,
            estimateHours: task.estimateHours ? String(task.estimateHours) : "",
            actualHours: task.actualHours ? String(task.actualHours) : "",
            startDate: task.startDate,
            dueDate: task.dueDate,
            labels: task.labels.join(", "),
            aiTool: task.aiTool || "",
            linkedActivityId: task.linkedActivityId || NONE,
            linkedPocId: task.linkedPocId || NONE,
          }
        : {
            ...EMPTY_VALUES,
            type: defaultProjectId ? "Project" : EMPTY_VALUES.type,
            projectId: defaultProjectId ?? NONE,
            status: defaultStatus ?? EMPTY_VALUES.status,
            reporterId,
          }
    );
  }, [open, task, defaultProjectId, defaultStatus, reporterId, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const projectId = values.projectId !== NONE ? values.projectId : null;
      const transition = taskWorkflowService.getTransitionChanges(workflow, values.status);
      await onSave({
        title: values.title.trim(),
        description: values.description.trim(),
        type: values.type as TaskType,
        category: values.category,
        projectId,
        assigneeId: values.assigneeId,
        reporterId: values.reporterId,
        createdBy: task?.createdBy ?? reporterId,
        lastModifiedBy: reporterId,
        priority: values.priority as TaskPriority,
        status: transition.status,
        estimateHours: values.estimateHours ? Number(values.estimateHours) : 0,
        actualHours: values.actualHours ? Number(values.actualHours) : 0,
        percentComplete: transition.percentComplete,
        startDate: values.startDate,
        dueDate: values.dueDate,
        completedDate: transition.completedDate || task?.completedDate || "",
        displayOrder: task?.displayOrder ?? 0,
        labels: values.labels.split(",").map((l) => l.trim()).filter(Boolean),
        aiTool: values.aiTool === NONE ? "" : values.aiTool,
        linkedActivityId: values.linkedActivityId === NONE ? "" : values.linkedActivityId,
        linkedPocId: values.linkedPocId === NONE ? "" : values.linkedPocId,
        comments: task?.comments ?? [],
        attachments: task?.attachments ?? [],
        archived: task?.archived ?? false,
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
      title={isEdit ? `Edit ${task?.taskNumber}` : "New Task"}
      description={isEdit ? "Update the work item." : "Create a project or standalone work item."}
      className="sm:max-w-2xl"
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          {show("title") && (
            <div className="sm:col-span-2">
              <FormInputField control={form.control} name="title" label="Title" placeholder="What needs to be done?" required disabled={readOnly("title")} />
            </div>
          )}
          {show("description") && (
            <FormTextareaField control={form.control} name="description" label="Description" placeholder="Details, links, acceptance criteria…" maxLength={2000} disabled={readOnly("description")} />
          )}
          {show("type") && (
            <FormSelectField control={form.control} name="type" label="Task Type" required options={["Project", "Standalone"]} disabled={readOnly("type")} />
          )}
          {show("projectId") && (
            <FormSelectField
              control={form.control}
              name="projectId"
              label="Project"
              required={type === "Project"}
              options={[{ value: NONE, label: "No project" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
              disabled={readOnly("projectId")}
            />
          )}
          {show("category") && (
            <FormSelectField control={form.control} name="category" label="Category" required options={categories.map((c) => c.name)} disabled={readOnly("category")} />
          )}
          {show("assigneeId") && (
            <FormSelectField
              control={form.control}
              name="assigneeId"
              label="Assignee"
              required
              options={employees.map((e) => ({ value: e.id, label: e.name }))}
              disabled={readOnly("assigneeId")}
            />
          )}
          {show("reporterId") && (
            <FormSelectField
              control={form.control}
              name="reporterId"
              label="Reporter"
              required
              options={employees.map((e) => ({ value: e.id, label: e.name }))}
              disabled={readOnly("reporterId")}
            />
          )}
          {show("priority") && (
            <FormSelectField control={form.control} name="priority" label="Priority" required options={["Critical", "High", "Medium", "Low"]} disabled={readOnly("priority")} />
          )}
          {show("status") && (
            <FormSelectField control={form.control} name="status" label="Status" required options={workflow.map((s) => s.name)} disabled={readOnly("status")} />
          )}
          {show("estimateHours") && (
            <FormInputField control={form.control} name="estimateHours" label="Estimate (hours)" type="number" min="0" step="0.5" disabled={readOnly("estimateHours")} />
          )}
          {show("actualHours") && (
            <FormInputField control={form.control} name="actualHours" label="Actual (hours)" type="number" min="0" step="0.5" disabled={readOnly("actualHours")} />
          )}
          {show("startDate") && (
            <FormInputField control={form.control} name="startDate" label="Start Date" type="date" disabled={readOnly("startDate")} />
          )}
          {show("dueDate") && (
            <FormInputField control={form.control} name="dueDate" label="Due Date" type="date" disabled={readOnly("dueDate")} />
          )}
          {show("labels") && (
            <FormInputField control={form.control} name="labels" label="Labels" placeholder="React, AI, Backend (comma separated)" disabled={readOnly("labels")} />
          )}
          {show("aiTool") && (
            <FormSelectField
              control={form.control}
              name="aiTool"
              label="AI Tool"
              options={[{ value: NONE, label: "None" }, ...aiTools]}
              disabled={readOnly("aiTool")}
            />
          )}
          {show("linkedActivityId") && (
            <FormSelectField
              control={form.control}
              name="linkedActivityId"
              label="Linked AI Activity"
              options={[{ value: NONE, label: "None" }, ...activityOptions]}
              disabled={readOnly("linkedActivityId")}
            />
          )}
          {show("linkedPocId") && (
            <FormSelectField
              control={form.control}
              name="linkedPocId"
              label="Linked POC"
              options={[{ value: NONE, label: "None" }, ...pocs.map((p) => ({ value: p.id, label: p.title }))]}
              disabled={readOnly("linkedPocId")}
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
