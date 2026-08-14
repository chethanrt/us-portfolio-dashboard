import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { DataTable, Modal } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { employeeService } from "@/services";
import type { Employee, LearningRecord } from "@/types";
import { buildImportRows, parseImportFile } from "@/utils/learningImport";
import type { ImportRow } from "@/utils/learningImport";

interface LearningImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onImportRecord: (values: Omit<LearningRecord, "id">) => Promise<void>;
  /** Called after a matched employee's profile is backfilled, so the caller can refresh its employee list. */
  onEmployeeUpdated: (employee: Employee) => void;
}

const OUTCOME_LABEL: Record<ImportRow["outcome"], string> = {
  ok: "Ready",
  noMatch: "No match",
  invalid: "Invalid",
};

export function LearningImportDialog({
  open,
  onOpenChange,
  employees,
  onImportRecord,
  onEmployeeUpdated,
}: LearningImportDialogProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const importableCount = rows.filter((r) => r.outcome === "ok").length;
  const noMatchCount = rows.filter((r) => r.outcome === "noMatch").length;
  const invalidCount = rows.filter((r) => r.outcome === "invalid").length;

  const reset = () => {
    setFileName("");
    setRows([]);
    setParseError(null);
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    setIsParsing(true);
    try {
      const parsed = await parseImportFile(file);
      if (parsed.rows.length === 0) {
        const headerList =
          parsed.detectedHeaders.length > 0
            ? `Columns detected: ${parsed.detectedHeaders.join(", ")}.`
            : "No columns/rows were detected at all in the first sheet.";
        setParseError(
          `No usable rows found in "${parsed.sheetNames[0] ?? "the first sheet"}". ${headerList} None of these matched a recognized column name, or there were no data rows below the header.`
        );
        setRows([]);
        return;
      }
      setRows(buildImportRows(parsed.rows, employees));
    } catch (err) {
      setParseError(
        `Unable to read this file: ${err instanceof Error ? err.message : String(err)}`
      );
      setRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = async () => {
    setIsImporting(true);
    let imported = 0;
    let profilesUpdated = 0;
    try {
      for (const row of rows) {
        if (row.outcome !== "ok" || !row.employee) continue;

        if (Object.keys(row.employeeUpdates).length > 0) {
          const updated = await employeeService.update(row.employee.id, {
            ...row.employee,
            ...row.employeeUpdates,
          });
          onEmployeeUpdated(updated);
          profilesUpdated += 1;
        }

        await onImportRecord({
          employeeId: row.employee.id,
          course: row.learning.course,
          platform: row.learning.platform,
          status: row.learning.status,
          progress: row.learning.progress,
          hours: row.learning.hours,
          certificate: "",
          completionDate: row.learning.status === "Completed" ? new Date().toISOString().slice(0, 10) : "",
          programCoordinator: row.learning.programCoordinator,
          minutesCompleted: row.learning.minutesCompleted,
        });
        imported += 1;
      }
      toast.success(
        `${imported} record${imported === 1 ? "" : "s"} imported${
          profilesUpdated > 0 ? `, ${profilesUpdated} employee profile${profilesUpdated === 1 ? "" : "s"} updated` : ""
        }.`
      );
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Import stopped — some records may not have been saved. Please review and retry.");
    } finally {
      setIsImporting(false);
    }
  };

  const columns = useMemo<ColumnDef<ImportRow>[]>(
    () => [
      {
        header: "Employee",
        cell: ({ row }) =>
          row.original.employee ? (
            row.original.employee.name
          ) : (
            <span className="text-destructive">{row.original.raw.email || "—"}</span>
          ),
      },
      { header: "Course", accessorFn: (row) => row.learning.course },
      { header: "Platform", accessorFn: (row) => row.learning.platform },
      { header: "Status", accessorFn: (row) => row.learning.status },
      { header: "%", accessorFn: (row) => row.learning.progress },
      { header: "Mins", accessorFn: (row) => row.learning.minutesCompleted },
      { header: "Coordinator", accessorFn: (row) => row.learning.programCoordinator },
      {
        header: "Result",
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant={row.original.outcome === "ok" ? "secondary" : "destructive"}>
              {OUTCOME_LABEL[row.original.outcome]}
            </Badge>
            {Object.keys(row.original.employeeUpdates).length > 0 && (
              <p className="text-[11px] text-muted-foreground">Will also update profile</p>
            )}
            {row.original.errors.length > 0 && (
              <p className="text-[11px] text-destructive">{row.original.errors.join(" ")}</p>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!isImporting) {
          if (!next) reset();
          onOpenChange(next);
        }
      }}
      title="Import Learning Records"
      description="Upload an .xlsx, .xls or .csv export to bulk-create learning records, matching each row to an employee by email."
      className="sm:max-w-5xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" disabled={isParsing || isImporting}>
            <label className="cursor-pointer">
              <Upload />
              Choose File
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
            </label>
          </Button>
          {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          {isParsing && <Loader2 className="size-4 animate-spin" />}
        </div>

        {parseError && <p className="text-sm text-destructive">{parseError}</p>}

        {rows.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {importableCount} importable, {noMatchCount} no email match, {invalidCount} invalid — rows other than
              "Ready" will be skipped.
            </p>
            <DataTable columns={columns} data={rows} pageSize={8} />
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={isImporting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isImporting || importableCount === 0} onClick={handleConfirm}>
            {isImporting && <Loader2 className="animate-spin" />}
            Import {importableCount > 0 ? `${importableCount} Record${importableCount === 1 ? "" : "s"}` : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
