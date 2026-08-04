import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInputField, FormSelectField, FormTextareaField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePermission } from "@/security";
import type { Employee, POC, Project } from "@/types";

const REQUIRED = "This field is required.";
const URL_MESSAGE = "Please enter a valid URL.";

const CATEGORIES = ["Automation", "Documentation", "CMS", "Marketing", "Testing", "Development", "Estimation"];
const STATUSES = ["Idea", "In Progress", "Completed", "On Hold"];

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
    })
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
  category: "",
  status: "Idea",
  description: "",
  businessValue: "",
  hoursSaved: "",
  repo: "",
  demo: "",
};

interface POCFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode. */
  poc: POC | null;
  pocs: POC[];
  employees: Employee[];
  projects: Project[];
  onSave: (values: Omit<POC, "id">) => Promise<void>;
}

export function POCFormDialog({ open, onOpenChange, poc, pocs, employees, projects, onSave }: POCFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
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
      form.reset(
        poc
          ? {
              title: poc.title,
              projectId: poc.projectId,
              ownerId: poc.ownerId,
              category: poc.category,
              status: poc.status,
              description: poc.description,
              businessValue: poc.businessValue,
              hoursSaved: poc.hoursSaved > 0 ? String(poc.hoursSaved) : "",
              repo: poc.repo,
              demo: poc.demo,
            }
          : EMPTY_VALUES
      );
    }
  }, [open, poc, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await onSave({
        title: values.title.trim(),
        projectId: values.projectId,
        ownerId: values.ownerId,
        category: values.category as POC["category"],
        status: values.status as POC["status"],
        description: values.description.trim(),
        businessValue: values.businessValue.trim(),
        hoursSaved: values.hoursSaved ? Number(values.hoursSaved) : 0,
        repo: values.repo.trim(),
        demo: values.demo.trim(),
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
              options={employees.map((e) => ({ value: e.id, label: e.name }))}
              disabled={readOnly("ownerId")}
            />
          )}
          {show("category") && (
            <FormSelectField control={form.control} name="category" label="Category" required options={CATEGORIES} disabled={readOnly("category")} />
          )}
          {show("status") && (
            <FormSelectField control={form.control} name="status" label="Status" required options={STATUSES} disabled={readOnly("status")} />
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
