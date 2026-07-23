import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ValueFormDialog } from "./ValueFormDialog";

interface SettingsSectionProps {
  label: string;
  description: string;
  values: string[];
  /** Director-only editing; others see disabled actions (docs/04). */
  readOnly: boolean;
  onChange: (values: string[]) => Promise<void>;
}

export function SettingsSection({ label, description, values, readOnly, onChange }: SettingsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSave = async (value: string) => {
    try {
      const next = editing ? values.map((v) => (v === editing ? value : v)) : [...values, value];
      await onChange(next);
      toast.success("Settings updated successfully.");
    } catch {
      toast.error("Unable to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await onChange(values.filter((v) => v !== deleting));
      toast.success("Settings updated successfully.");
    } catch {
      toast.error("Unable to delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          size="sm"
          disabled={readOnly}
          title={readOnly ? "Only the Director can edit settings" : undefined}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus /> Add
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.map((value, index) => (
              <TableRow key={value}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{value}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${value}`}
                      disabled={readOnly}
                      onClick={() => {
                        setEditing(value);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${value}`}
                      disabled={readOnly}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(value)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <ValueFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        sectionLabel={label}
        existingValues={values}
        editingValue={editing}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        message={`Are you sure you want to delete "${deleting}"? Existing records that use it are not changed.`}
      />
    </Card>
  );
}
