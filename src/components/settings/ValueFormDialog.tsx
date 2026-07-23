import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInputField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

interface ValueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Section label, e.g. "AI Tools". */
  sectionLabel: string;
  /** Existing values for duplicate validation. */
  existingValues: string[];
  /** The value being edited; null = Add mode. */
  editingValue: string | null;
  onSave: (value: string) => Promise<void>;
}

/** Single-field add/edit dialog for Settings master-data values. */
export function ValueFormDialog({
  open,
  onOpenChange,
  sectionLabel,
  existingValues,
  editingValue,
  onSave,
}: ValueFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const schema = useMemo(() => {
    const taken = new Set(
      existingValues.filter((v) => v !== editingValue).map((v) => v.toLowerCase())
    );
    return z.object({
      value: z
        .string()
        .trim()
        .min(1, "This field is required.")
        .max(60, "Maximum 60 characters.")
        .refine((v) => !taken.has(v.toLowerCase()), { message: "This record already exists." }),
    });
  }, [existingValues, editingValue]);

  const form = useForm<{ value: string }>({
    resolver: zodResolver(schema),
    defaultValues: { value: "" },
  });

  useEffect(() => {
    if (open) form.reset({ value: editingValue ?? "" });
  }, [open, editingValue, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await onSave(values.value.trim());
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
      title={editingValue ? `Edit ${sectionLabel}` : `Add ${sectionLabel}`}
      className="sm:max-w-md"
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormInputField control={form.control} name="value" label="Name" required />
          <div className="flex justify-end gap-2">
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
