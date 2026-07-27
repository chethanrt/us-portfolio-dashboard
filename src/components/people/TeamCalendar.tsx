import { useMemo, useRef, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationDialog, EmptyState, LoadingSkeleton } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { useTeamCalendarEvents } from "@/hooks/useCalendarEvents";
import { usePermission } from "@/security";
import type { CalendarEvent, Employee } from "@/types";
import { getEventTypeColor } from "@/utils/calendarColors";
import { canCreateCalendarEvent, canDeleteCalendarEvent, canEditCalendarEvent, canViewCalendar } from "@/utils/permissions";
import { CalendarEventFormDialog } from "./CalendarEventFormDialog";
import { CalendarEventModal } from "./CalendarEventModal";
import type { CalendarViewOption } from "./CalendarToolbar";
import { CalendarToolbar } from "./CalendarToolbar";

interface TeamCalendarProps {
  /** Employees currently visible on the People page (already search/filtered). */
  employees: Employee[];
}

/** Local (non-UTC) ISO datetime, matching the stored event shape. */
function toLocalIso(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

/** Combined calendar for the People page — one merged view across every visible employee's events. */
export function TeamCalendar({ employees }: TeamCalendarProps) {
  const { currentUser } = useAuth();
  const { role } = usePermission();
  const roleId = role?.id;
  const calendarRef = useRef<FullCalendar>(null);

  const viewableEmployees = useMemo(
    () => employees.filter((e) => canViewCalendar(roleId, e.id, currentUser?.id)),
    [employees, roleId, currentUser]
  );
  const employeeById = useMemo(() => new Map(viewableEmployees.map((e) => [e.id, e])), [viewableEmployees]);
  const employeeIds = useMemo(() => viewableEmployees.map((e) => e.id), [viewableEmployees]);
  const createEmployees = useMemo(
    () => viewableEmployees.filter((e) => canCreateCalendarEvent(roleId, e.id, currentUser?.id)),
    [viewableEmployees, roleId, currentUser]
  );

  const { events, isLoading, error, createEvent, updateEvent, deleteEvent } = useTeamCalendarEvents(employeeIds);

  const [view, setView] = useState<CalendarViewOption>("timeGridWeek");
  const [title, setTitle] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [initialSlot, setInitialSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);

  const calendarEvents = useMemo(
    () =>
      events.map((event) => {
        const color = getEventTypeColor(event.eventType);
        const editable = canEditCalendarEvent(roleId, event, currentUser?.id);
        const employeeName = employeeById.get(event.employeeId)?.name ?? "Unknown";
        return {
          id: event.id,
          title: `${employeeName.split(" ")[0]} • ${event.title}`,
          start: event.start,
          end: event.end,
          backgroundColor: color.hex,
          borderColor: color.hex,
          textColor: "#ffffff",
          editable,
          startEditable: editable,
          durationEditable: editable,
          extendedProps: { event },
        };
      }),
    [events, roleId, currentUser, employeeById]
  );

  if (viewableEmployees.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Calendar Access Restricted"
        description="You don't have permission to view any calendars in the current selection."
      />
    );
  }

  if (isLoading) {
    return <LoadingSkeleton variant="list" count={4} />;
  }

  if (error) {
    return <EmptyState icon={CalendarClock} title="Unable to load calendar" description={error} />;
  }

  const getApi = () => calendarRef.current?.getApi();

  const handleViewChange = (nextView: CalendarViewOption) => {
    setView(nextView);
    getApi()?.changeView(nextView);
  };

  const openCreateDialog = (slot: { start: Date; end: Date } | null) => {
    setEditingEvent(null);
    setInitialSlot(slot);
    setFormOpen(true);
  };

  const handleDateClick = (arg: DateClickArg) => {
    if (createEmployees.length === 0) return;
    const start = arg.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    openCreateDialog({ start, end });
  };

  const handleEventClick = (arg: EventClickArg) => {
    setSelectedEvent(arg.event.extendedProps.event as CalendarEvent);
  };

  const handleEventDrop = async (arg: EventDropArg) => {
    const original = arg.event.extendedProps.event as CalendarEvent;
    if (!canEditCalendarEvent(roleId, original, currentUser?.id) || !arg.event.start || !arg.event.end) {
      arg.revert();
      return;
    }
    try {
      await updateEvent(original.id, {
        ...original,
        start: toLocalIso(arg.event.start),
        end: toLocalIso(arg.event.end),
      });
      toast.success("Event moved.");
    } catch {
      toast.error("Unable to move event. Please try again.");
      arg.revert();
    }
  };

  const handleEventResize = async (arg: EventResizeDoneArg) => {
    const original = arg.event.extendedProps.event as CalendarEvent;
    if (!canEditCalendarEvent(roleId, original, currentUser?.id) || !arg.event.start || !arg.event.end) {
      arg.revert();
      return;
    }
    try {
      await updateEvent(original.id, {
        ...original,
        start: toLocalIso(arg.event.start),
        end: toLocalIso(arg.event.end),
      });
      toast.success("Event duration updated.");
    } catch {
      toast.error("Unable to resize event. Please try again.");
      arg.revert();
    }
  };

  const handleSave = async (payloads: Omit<CalendarEvent, "id">[]) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, payloads[0]);
        toast.success("Event updated.");
      } else if (payloads.length > 1) {
        for (const payload of payloads) {
          await createEvent(payload);
        }
        toast.success(`${payloads.length} calendar blocks created.`);
      } else {
        await createEvent(payloads[0]);
        toast.success("Event created.");
      }
    } catch {
      toast.error("Unable to save event. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    try {
      await deleteEvent(deletingEvent.id);
      toast.success("Event deleted.");
    } catch {
      toast.error("Unable to delete event. Please try again.");
    } finally {
      setDeletingEvent(null);
    }
  };

  const selectedCanEdit = selectedEvent ? canEditCalendarEvent(roleId, selectedEvent, currentUser?.id) : false;
  const selectedCanDelete = selectedEvent ? canDeleteCalendarEvent(roleId, selectedEvent, currentUser?.id) : false;
  const selectedEmployeeName = selectedEvent ? employeeById.get(selectedEvent.employeeId)?.name : undefined;

  return (
    <div className="space-y-4">
      <CalendarToolbar
        title={title}
        view={view}
        onViewChange={handleViewChange}
        onPrev={() => getApi()?.prev()}
        onNext={() => getApi()?.next()}
        onToday={() => getApi()?.today()}
        canCreate={createEmployees.length > 0}
        onCreate={() => openCreateDialog(null)}
      />

      {events.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="No Calendar Events Found"
          description={
            createEmployees.length > 0
              ? "Click a time slot below to create the first event."
              : "No events are scheduled for the people in this view."
          }
        />
      )}

      <div className="rounded-xl border p-2 [&_.fc]:text-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={false}
          height={720}
          scrollTime="07:00:00"
          selectable={createEmployees.length > 0}
          editable
          dayMaxEvents
          events={calendarEvents}
          datesSet={(arg) => setTitle(arg.view.title)}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
        />
      </div>

      <CalendarEventModal
        event={selectedEvent}
        employeeName={selectedEmployeeName}
        onClose={() => setSelectedEvent(null)}
        canEdit={selectedCanEdit}
        canDelete={selectedCanDelete}
        onEdit={(event) => {
          setSelectedEvent(null);
          setEditingEvent(event);
          setInitialSlot(null);
          setFormOpen(true);
        }}
        onDelete={(event) => {
          setSelectedEvent(null);
          setDeletingEvent(event);
        }}
      />

      <CalendarEventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        targetEmployeeId={editingEvent?.employeeId ?? createEmployees[0]?.id ?? ""}
        employeeOptions={createEmployees.map((e) => ({ id: e.id, name: e.name }))}
        currentEmployeeId={currentUser?.id ?? ""}
        currentEmployeeName={currentUser?.name ?? ""}
        initialSlot={initialSlot}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(deletingEvent)}
        onOpenChange={(open) => !open && setDeletingEvent(null)}
        onConfirm={handleDelete}
        message={
          deletingEvent
            ? `Are you sure you want to delete "${deletingEvent.title}"? This cannot be undone.`
            : "Are you sure you want to delete this event?"
        }
      />
    </div>
  );
}
