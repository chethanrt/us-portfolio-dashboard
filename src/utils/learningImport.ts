import * as XLSX from "xlsx";
import type { Employee, LearningPlatform, LearningStatus } from "@/types";

type ImportField =
  | "name"
  | "email"
  | "directManager"
  | "leader"
  | "businessUnit"
  | "techNonTech"
  | "programCoordinator"
  | "course"
  | "platform"
  | "minutesCompleted"
  | "progress"
  | "status";

/** Header text is matched case/space/hyphen-insensitively — "Program Co-ordinator" and "programcoordinator" both hit this. */
const HEADER_MAP: Record<string, ImportField> = {
  name: "name",
  email: "email",
  directmanager: "directManager",
  manager: "directManager",
  leader: "leader",
  bu: "businessUnit",
  businessunit: "businessUnit",
  technontech: "techNonTech",
  tech: "techNonTech",
  programcoordinator: "programCoordinator",
  coordinator: "programCoordinator",
  course: "course",
  platform: "platform",
  minscompleted: "minutesCompleted",
  minutescompleted: "minutesCompleted",
  mins: "minutesCompleted",
  percentagecompletion: "progress",
  percentcompletion: "progress",
  completion: "progress",
  status: "status",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export type RawImportRow = Partial<Record<ImportField, string>>;

export interface ParsedImportFile {
  rows: RawImportRow[];
  /** The literal column headers the parser saw, in order — for diagnosing "no usable rows" cases. */
  detectedHeaders: string[];
  /** How many sheets the workbook had, and which one was read (always the first). */
  sheetNames: string[];
}

/** Reads the first sheet of an .xlsx/.xls/.csv file (row 1 = headers) into header-normalized rows. */
export async function parseImportFile(file: File): Promise<ParsedImportFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const detectedHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];

  const normalizedRows = rows
    .map((row) => {
      const normalized: RawImportRow = {};
      for (const [header, value] of Object.entries(row)) {
        const field = HEADER_MAP[normalizeHeader(header)];
        if (!field) continue;
        normalized[field] = String(value ?? "").trim();
      }
      return normalized;
    })
    .filter((row) => Object.values(row).some((value) => value !== ""));

  return { rows: normalizedRows, detectedHeaders, sheetNames: workbook.SheetNames };
}

const KNOWN_PLATFORMS: readonly LearningPlatform[] = ["Udemy AI Lab", "Internal Training", "Other"];
const KNOWN_STATUSES: readonly LearningStatus[] = ["Not Started", "In Progress", "Completed"];

export interface ImportRow {
  raw: RawImportRow;
  employee: Employee | null;
  learning: {
    course: string;
    platform: LearningPlatform;
    status: LearningStatus;
    progress: number;
    minutesCompleted: number;
    hours: number;
    programCoordinator: string;
  };
  /** Employee profile fields this row can backfill — only ones currently blank on the matched employee, never overwritten. */
  employeeUpdates: Partial<Pick<Employee, "leaderId" | "businessUnit">>;
  errors: string[];
  outcome: "ok" | "noMatch" | "invalid";
}

/** Matches each raw row to an existing employee by email and validates/derives the Learning fields. */
export function buildImportRows(rawRows: RawImportRow[], employees: Employee[]): ImportRow[] {
  const byEmail = new Map(employees.map((e) => [e.email.toLowerCase(), e]));
  const byName = new Map(employees.map((e) => [e.name.trim().toLowerCase(), e]));

  return rawRows.map((raw) => {
    const errors: string[] = [];

    const email = (raw.email ?? "").toLowerCase();
    const employee = email ? byEmail.get(email) ?? null : null;
    if (!employee) errors.push(email ? `No employee found with email "${raw.email}".` : "Missing email.");

    const course = (raw.course ?? "").trim();
    if (!course) errors.push("Missing course.");

    const platformRaw = (raw.platform ?? "").trim();
    const platform =
      (KNOWN_PLATFORMS.find((p) => p.toLowerCase() === platformRaw.toLowerCase()) as
        | LearningPlatform
        | undefined) ?? "Other";

    const statusRaw = (raw.status ?? "").trim();
    const status = KNOWN_STATUSES.find((s) => s.toLowerCase() === statusRaw.toLowerCase());
    if (!status) errors.push(`Unrecognized status "${raw.status}".`);

    const progressRaw = Number.parseFloat((raw.progress ?? "").replace("%", ""));
    const progress = Number.isFinite(progressRaw) ? Math.min(100, Math.max(0, Math.round(progressRaw))) : 0;

    const minutesRaw = Number.parseFloat(raw.minutesCompleted ?? "");
    const minutesCompleted = Number.isFinite(minutesRaw) ? minutesRaw : 0;
    const hours = Math.round((minutesCompleted / 60) * 100) / 100;

    // Only ever fills in currently-blank Employee fields — never overwrites existing org data.
    const employeeUpdates: ImportRow["employeeUpdates"] = {};
    if (employee) {
      const leaderName = (raw.leader ?? "").trim();
      const leaderEmployee = leaderName ? byName.get(leaderName.toLowerCase()) : undefined;
      if (leaderEmployee && !employee.leaderId) employeeUpdates.leaderId = leaderEmployee.id;

      const businessUnit = (raw.businessUnit ?? "").trim();
      if (businessUnit && !employee.businessUnit) employeeUpdates.businessUnit = businessUnit;
    }

    const outcome: ImportRow["outcome"] = !employee ? "noMatch" : errors.length > 0 ? "invalid" : "ok";

    return {
      raw,
      employee,
      learning: {
        course,
        platform,
        status: status ?? "Not Started",
        progress,
        minutesCompleted,
        hours,
        programCoordinator: (raw.programCoordinator ?? "").trim(),
      },
      employeeUpdates,
      errors,
      outcome,
    };
  });
}
