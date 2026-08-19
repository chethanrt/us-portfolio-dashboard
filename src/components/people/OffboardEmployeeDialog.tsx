import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormSelectField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { Employee } from "@/types";

function buildSchema(directReports: Employee[]) {
  const shape: Record<string, z.ZodString> = {};
  directReports.forEach((report) => {
    shape[report.id] = z.string().min(1, "Choose a new manager.");
  });
  return z.object(shape);
}

interface OffboardEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Employee being marked as an Ex-Employee. */
  employee: Employee | null;
  /** Employees who currently report to `employee` and need a new manager. */
  directReports: Employee[];
  /** Other employees eligible to become a report's new manager. */
  candidateManagers: Employee[];
  onConfirm: (reassignments: Record<string, string>) => Promise<void>;
}

/**
 * Confirms marking an employee as an Ex-Employee. If they have direct
 * reports, the admin must pick a new manager for each one before the
 * offboard can proceed — the hierarchy should never point at someone who
 * has left.
 */
export function OffboardEmployeeDialog({
  open,
  onOpenChange,
  employee,
  directReports,
  candidateManagers,
  onConfirm,
}: OffboardEmployeeDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const schema = useMemo(() => buildSchema(directReports), [directReports]);
  const managerOptions = useMemo(
    () => candidateManagers.map((manager) => ({ value: manager.id, label: `${manager.name} (${manager.role})` })),
    [candidateManagers]
  );

  const form = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  useEffect(() => {
    if (open) form.reset({});
  }, [open, employee, form]);

  if (!employee) return null;

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await onConfirm(values);
      onOpenChange(false);
    } catch {
      // offboard failed — the caller shows the error toast; keep the dialog open
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !isSaving && onOpenChange(next)}
      title={`Mark ${employee.name} as Ex-Employee`}
      description={
        directReports.length > 0
          ? "This person still has direct reports. Choose who each of them will report to before continuing."
          : "Their profile, activities, and POCs stay on record — they'll show as Ex-Employee instead of being removed."
      }
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {directReports.length > 0 && (
            <div className="space-y-3 rounded-lg border p-3">
              {directReports.map((report) => (
                <FormSelectField
                  key={report.id}
                  control={form.control}
                  name={report.id}
                  label={`${report.name}'s new manager`}
                  options={managerOptions}
                  placeholder="Select a new manager"
                  required
                />
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={isSaving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              Mark as Ex-Employee
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
