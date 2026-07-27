import calendarEventsData from "@/data/calendarEvents.json";
import type { CalendarEvent } from "@/types";
import { simulateRequest } from "./BaseService";

const seedCalendarEvents = calendarEventsData as CalendarEvent[];

const STORAGE_KEY = "ai-portfolio-dashboard.calendarEvents";

/**
 * Calendar events support full CRUD, persisted to Local Storage like the
 * other services (docs/04 + PROJECT_RULES); the JSON file remains the seed
 * data. The event shape mirrors a Microsoft Graph calendar event so a future
 * Outlook/Graph integration only needs to replace this class's internals —
 * `outlookEventId`/`refresh()` are the seam for that swap.
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

  async create(input: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    const all = this.load();
    const created: CalendarEvent = { ...input, id: this.nextId(all) };
    this.persist([...all, created]);
    return simulateRequest(created);
  }

  async update(id: string, input: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    const all = this.load();
    const index = all.findIndex((event) => event.id === id);
    if (index === -1) throw new Error(`Calendar event ${id} not found`);
    const updated: CalendarEvent = { ...input, id };
    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  async delete(id: string): Promise<void> {
    const all = this.load();
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
