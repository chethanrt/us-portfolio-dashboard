import calendarEventsData from "@/data/calendarEvents.json";
import type { CalendarEvent } from "@/types";
import { simulateRequest } from "./BaseService";
import { taskService } from "./TaskService";

const seedCalendarEvents = calendarEventsData as CalendarEvent[];

const STORAGE_KEY = "ai-portfolio-dashboard.calendarEvents";

const TASK_BLOCK_TYPE = "Calendar Block for Task";

function estimateHoursFor(event: Pick<CalendarEvent, "start" | "end">): number {
  const hours = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (60 * 60 * 1000);
  return Math.round(hours * 10) / 10;
}

/**
 * Fields an already-linked task keeps in sync with its source event. Deliberately
 * narrow — status, percentComplete, comments, displayOrder, etc. are owned by the
 * Task Board from creation onward and must never be reset back to defaults just
 * because the calendar block moved or was retitled.
 */
function taskSyncPatchFor(event: CalendarEvent) {
  return {
    title: event.title,
    description: event.description,
    estimateHours: estimateHoursFor(event),
    startDate: event.start.slice(0, 10),
    dueDate: event.end.slice(0, 10),
  };
}

/** Builds the Task Board entry mirrored from a "Calendar Block for Task" event. */
function taskInputFor(event: CalendarEvent) {
  return {
    title: event.title,
    description: event.description,
    type: "Standalone" as const,
    category: "General",
    projectId: null,
    assigneeId: event.employeeId,
    reporterId: event.createdBy,
    createdBy: event.createdBy,
    lastModifiedBy: event.createdBy,
    priority: "Medium" as const,
    status: "To Do",
    estimateHours: estimateHoursFor(event),
    actualHours: 0,
    percentComplete: 0,
    startDate: event.start.slice(0, 10),
    dueDate: event.end.slice(0, 10),
    completedDate: "",
    displayOrder: 0,
    labels: ["Calendar Block"],
    aiTool: "",
    linkedActivityId: "",
    linkedPocId: "",
    linkedCalendarEventId: event.id,
    comments: [],
    attachments: [],
    archived: false,
  };
}

/**
 * Calendar events support full CRUD, persisted to Local Storage like the
 * other services (docs/04 + PROJECT_RULES); the JSON file remains the seed
 * data. The event shape mirrors a Microsoft Graph calendar event so a future
 * Outlook/Graph integration only needs to replace this class's internals —
 * `outlookEventId`/`refresh()` are the seam for that swap.
 *
 * "Calendar Block for Task" events are mirrored 1:1 onto the Task Board: the
 * event carries `linkedTaskId`, the task carries `linkedCalendarEventId`, and
 * this class keeps both in sync on create/update/delete.
 */
class CalendarService {
  private load(): CalendarEvent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as CalendarEvent[];
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedCalendarEvents;
  }

  private persist(events: CalendarEvent[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  private nextId(events: CalendarEvent[]): string {
    const maxNumber = events.reduce((max, event) => {
      const number = Number(event.id.replace("CAL", ""));
      return Number.isFinite(number) && number > max ? number : max;
    }, 0);
    return `CAL${String(maxNumber + 1).padStart(3, "0")}`;
  }

  getAll(): Promise<CalendarEvent[]> {
    return simulateRequest(this.load());
  }

  async getByEmployee(employeeId: string): Promise<CalendarEvent[]> {
    const all = await this.getAll();
    return all.filter((event) => event.employeeId === employeeId);
  }

  /** Combined events for a team/portfolio calendar view. */
  async getByEmployees(employeeIds: string[]): Promise<CalendarEvent[]> {
    const all = await this.getAll();
    const ids = new Set(employeeIds);
    return all.filter((event) => ids.has(event.employeeId));
  }

  /** Every sibling event created together for the same block (team calendar "add person" flow). */
  async getByGroup(groupId: string): Promise<CalendarEvent[]> {
    const all = await this.getAll();
    return all.filter((event) => event.blockGroupId === groupId);
  }

  async create(input: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    const all = this.load();
    const created: CalendarEvent = { ...input, id: this.nextId(all) };

    if (created.eventType === TASK_BLOCK_TYPE) {
      const task = await taskService.create(taskInputFor(created));
      created.linkedTaskId = task.id;
    }

    this.persist([...all, created]);
    return simulateRequest(created);
  }

  async update(id: string, input: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    const all = this.load();
    const index = all.findIndex((event) => event.id === id);
    if (index === -1) throw new Error(`Calendar event ${id} not found`);
    const updated: CalendarEvent = { ...input, id };

    if (updated.eventType === TASK_BLOCK_TYPE) {
      if (updated.linkedTaskId) {
        await taskService.update(updated.linkedTaskId, taskSyncPatchFor(updated), updated.createdBy);
      } else {
        const task = await taskService.create(taskInputFor(updated));
        updated.linkedTaskId = task.id;
      }
    } else if (updated.linkedTaskId) {
      // The block no longer represents task work — drop the mirrored task.
      await taskService.delete(updated.linkedTaskId);
      updated.linkedTaskId = null;
    }

    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  async delete(id: string): Promise<void> {
    const all = this.load();
    const existing = all.find((event) => event.id === id);
    if (existing?.linkedTaskId) {
      await taskService.delete(existing.linkedTaskId);
    }
    this.persist(all.filter((event) => event.id !== id));
    await simulateRequest(undefined);
  }

  /**
   * Re-fetches events for an employee. Phase 1 just re-reads local storage;
   * this is the method a live Outlook integration would replace with an
   * actual Graph delta/range fetch.
   */
  refresh(employeeId: string): Promise<CalendarEvent[]> {
    return this.getByEmployee(employeeId);
  }
}

export const calendarService = new CalendarService();
