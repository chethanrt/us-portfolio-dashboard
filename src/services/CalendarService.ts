import type { CalendarEvent } from "@/types";
import { apiRequest } from "./BaseService";
import { taskService } from "./TaskService";

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
    labels: [event.linkedProjectId ? "Project" : "Calendar Block"],
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
 * Calendar events support full CRUD. The event shape mirrors a Microsoft
 * Graph calendar event so a future Outlook/Graph integration only needs to
 * replace this class's internals — `outlookEventId`/`refresh()` are the
 * seam for that swap.
 *
 * "Calendar Block for Task" events are mirrored 1:1 onto the Task Board: the
 * event carries `linkedTaskId`, the task carries `linkedCalendarEventId`,
 * and this class keeps both in sync on create/update/delete. Because the
 * event's own id is now minted server-side (not known up front the way the
 * old client-side max+1 id was), create() does an extra round trip: create
 * the event, then the mirrored task (which needs the event's real id), then
 * patch the event with the task's id — same end state as before, just one
 * more request to get there.
 */
class CalendarService {
  getAll(): Promise<CalendarEvent[]> {
    return apiRequest<CalendarEvent[]>("/api/calendar-events");
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
    let created = await apiRequest<CalendarEvent>("/api/calendar-events", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (created.eventType === TASK_BLOCK_TYPE) {
      const task = await taskService.create(taskInputFor(created));
      created = await apiRequest<CalendarEvent>(`/api/calendar-events/${created.id}`, {
        method: "PUT",
        body: JSON.stringify({ linkedTaskId: task.id }),
      });
    }

    return created;
  }

  async update(id: string, input: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
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

    return apiRequest<CalendarEvent>(`/api/calendar-events/${id}`, {
      method: "PUT",
      body: JSON.stringify(updated),
    });
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    const existing = all.find((event) => event.id === id);
    if (existing?.linkedTaskId) {
      await taskService.delete(existing.linkedTaskId);
    }
    await apiRequest<void>(`/api/calendar-events/${id}`, { method: "DELETE" });
  }

  /** Deletes every sibling event sharing a blockGroupId (e.g. a POC's calendar blocks). */
  async deleteByGroup(groupId: string): Promise<void> {
    const toDelete = await this.getByGroup(groupId);
    await Promise.all(
      toDelete.filter((event) => event.linkedTaskId).map((event) => taskService.delete(event.linkedTaskId as string))
    );
    await apiRequest<void>(`/api/calendar-events/by-group/${groupId}`, { method: "DELETE" });
  }

  /**
   * Re-fetches events for an employee. This is the method a live Outlook
   * integration would replace with an actual Graph delta/range fetch.
   */
  refresh(employeeId: string): Promise<CalendarEvent[]> {
    return this.getByEmployee(employeeId);
  }
}

export const calendarService = new CalendarService();
