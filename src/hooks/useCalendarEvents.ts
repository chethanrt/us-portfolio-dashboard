import { useCallback, useEffect, useState } from "react";
import { calendarService } from "@/services";
import type { CalendarEvent, Employee } from "@/types";

/** Loads calendar events for an employee and exposes CRUD. */
export function useCalendarEvents(employee: Employee | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employee) {
      setEvents([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await calendarService.getByEmployee(employee.id);
      setEvents(data);
    } catch {
      setError("Unable to load calendar events.");
    } finally {
      setIsLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    load();
  }, [load]);

  const createEvent = useCallback(async (input: Omit<CalendarEvent, "id">) => {
    const created = await calendarService.create(input);
    setEvents((current) => [...current, created]);
    return created;
  }, []);

  const updateEvent = useCallback(async (id: string, input: Omit<CalendarEvent, "id">) => {
    const updated = await calendarService.update(id, input);
    setEvents((current) => current.map((event) => (event.id === id ? updated : event)));
    return updated;
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await calendarService.delete(id);
    setEvents((current) => current.filter((event) => event.id !== id));
  }, []);

  return { events, isLoading, error, createEvent, updateEvent, deleteEvent, refresh: load };
}
