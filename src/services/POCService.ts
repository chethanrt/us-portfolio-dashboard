import { addHours, eachDayOfInterval, format, parseISO } from "date-fns";
import type { CalendarEvent, Employee, POC } from "@/types";
import { apiRequest } from "./BaseService";
import { calendarService } from "./CalendarService";
import { employeeService } from "./EmployeeService";

const POC_EVENT_TYPE = "POC";

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

/** True when any field that changes what the calendar should block was touched. */
function scheduleChanged(previous: POC, next: POC): boolean {
  return (
    previous.startDate !== next.startDate ||
    previous.endDate !== next.endDate ||
    previous.startTime !== next.startTime ||
    previous.hoursPerDay !== next.hoursPerDay ||
    previous.ownerId !== next.ownerId ||
    !sameIds(previous.team, next.team)
  );
}

interface Schedule {
  startDate: string;
  endDate: string;
  startTime: string;
  hoursPerDay: number;
}

/** Every calendar day × [start,end) window a POC's schedule occupies. */
function scheduleWindows(schedule: Schedule): { date: string; start: Date; end: Date }[] {
  const days = eachDayOfInterval({ start: parseISO(schedule.startDate), end: parseISO(schedule.endDate) });
  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const start = parseISO(`${dateStr}T${schedule.startTime}:00`);
    return { date: dateStr, start, end: addHours(start, schedule.hoursPerDay) };
  });
}

export interface ScheduleConflict {
  employeeId: string;
  /** yyyy-MM-dd */
  date: string;
  existingEvent: Pick<CalendarEvent, "id" | "title" | "start" | "end">;
}

/**
 * Checks whether the given employees are free for a proposed POC schedule.
 * `excludeBlockGroupId` skips a POC's own existing blocks when re-checking on edit.
 * This is the sole gate — POCService.create/update trust the caller already ran
 * this and do not re-check, so any future second entry point (bulk import, API)
 * must call this itself before saving.
 */
export async function checkPOCScheduleConflicts(params: {
  employeeIds: string[];
  schedule: Schedule;
  excludeBlockGroupId?: string | null;
}): Promise<ScheduleConflict[]> {
  const uniqueIds = [...new Set(params.employeeIds)];
  if (uniqueIds.length === 0) return [];

  const existingEvents = await calendarService.getByEmployees(uniqueIds);
  const windows = scheduleWindows(params.schedule);
  const conflicts: ScheduleConflict[] = [];

  for (const employeeId of uniqueIds) {
    const employeeEvents = existingEvents.filter(
      (event) => event.employeeId === employeeId && event.blockGroupId !== params.excludeBlockGroupId
    );
    for (const window of windows) {
      const conflicting = employeeEvents.find((event) => {
        const eventStart = parseISO(event.start);
        const eventEnd = parseISO(event.end);
        return window.start < eventEnd && eventStart < window.end;
      });
      if (conflicting) {
        conflicts.push({
          employeeId,
          date: window.date,
          existingEvent: { id: conflicting.id, title: conflicting.title, start: conflicting.start, end: conflicting.end },
        });
      }
    }
  }

  return conflicts;
}

/** One calendar-block event per (day × target employee) for a POC's owner + team. */
function buildCalendarEventsFor(poc: POC, employees: Employee[]): Omit<CalendarEvent, "id">[] {
  const targetIds = [...new Set([poc.ownerId, ...poc.team])];
  const employeeById = new Map(employees.map((e) => [e.id, e]));
  const windows = scheduleWindows(poc);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const organizer = employeeById.get(poc.ownerId)?.name ?? "";
  const attendees = targetIds
    .map((id) => employeeById.get(id))
    .filter((e): e is Employee => Boolean(e))
    .map((e) => ({ name: e.name, email: e.email }));

  return windows.flatMap((window) =>
    targetIds.map((employeeId) => ({
      employeeId,
      title: `POC: ${poc.title}`,
      description: poc.description,
      eventType: POC_EVENT_TYPE as CalendarEvent["eventType"],
      start: format(window.start, "yyyy-MM-dd'T'HH:mm:ss"),
      end: format(window.end, "yyyy-MM-dd'T'HH:mm:ss"),
      timeZone,
      organizer,
      attendees,
      location: "",
      outlookEventId: null,
      createdBy: poc.ownerId,
      linkedPocId: poc.id,
      blockGroupId: poc.blockGroupId,
    }))
  );
}

/**
 * POCs support full CRUD. Owner + team calendars are blocked automatically:
 * every POC's schedule is mirrored onto the Team Calendar as "POC" events
 * sharing one `blockGroupId`, kept in sync on update (re-synced whenever
 * team/schedule fields change) and removed on delete — mirroring how
 * "Calendar Block for Task" events mirror onto the Task Board, but inverted
 * (POC is the "one", events are the "many").
 */
class POCService {
  getAll(): Promise<POC[]> {
    return apiRequest<POC[]>("/api/pocs");
  }

  async getById(id: string): Promise<POC | undefined> {
    const all = await this.getAll();
    return all.find((poc) => poc.id === id);
  }

  async getByOwner(ownerId: string): Promise<POC[]> {
    const all = await this.getAll();
    return all.filter((poc) => poc.ownerId === ownerId);
  }

  async create(input: Omit<POC, "id">): Promise<POC> {
    const created = await apiRequest<POC>("/api/pocs", {
      method: "POST",
      body: JSON.stringify({ ...input, blockGroupId: crypto.randomUUID() }),
    });

    const employees = await employeeService.getAll();
    for (const event of buildCalendarEventsFor(created, employees)) {
      await calendarService.create(event);
    }

    return created;
  }

  async update(id: string, input: Omit<POC, "id">): Promise<POC> {
    const previous = await this.getById(id);
    if (!previous) throw new Error(`POC ${id} not found`);
    // Legacy POCs saved before this feature existed may have no group yet.
    const blockGroupId = previous.blockGroupId ?? crypto.randomUUID();

    const updated = await apiRequest<POC>(`/api/pocs/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...input, blockGroupId }),
    });

    if (scheduleChanged(previous, updated)) {
      if (previous.blockGroupId) {
        await calendarService.deleteByGroup(previous.blockGroupId);
      }
      const employees = await employeeService.getAll();
      for (const event of buildCalendarEventsFor(updated, employees)) {
        await calendarService.create(event);
      }
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (existing?.blockGroupId) {
      await calendarService.deleteByGroup(existing.blockGroupId);
    }
    await apiRequest<void>(`/api/pocs/${id}`, { method: "DELETE" });
  }
}

export const pocService = new POCService();
