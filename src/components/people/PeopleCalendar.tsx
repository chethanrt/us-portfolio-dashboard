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
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useSettings } from "@/hooks/useSettings";
import { usePermission } from "@/security";
import type { CalendarEvent, Employee } from "@/types";
import { getEventTypeColor } from "@/utils/calendarColors";
import {
  canCreateCalendarEvent,
  canDeleteCalendarEvent,
  canEditCalendarEvent,
  canViewCalendar,
} from "@/utils/permissions";
import { CalendarEventFormDialog } from "./CalendarEventFormDialog";
import { CalendarEventModal } from "./CalendarEventModal";
import type { CalendarViewOption } from "./CalendarToolbar";
import { CalendarToolbar, ROLLING_WEEK_VIEWS } from "./CalendarToolbar";

interface PeopleCalendarProps {
  employee: Employee;
}

/** Local (non-UTC) ISO datetime, matching the stored event shape. */
function toLocalIso(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

/** FullCalendar tab for a person's profile — Phase 1 runs on local mock data. */
export function PeopleCalendar({ employee }: PeopleCalendarProps) {
  const { currentUser } = useAuth();
  const { role } = usePermission();
  const roleId = role?.id;
  const { events, isLoading, error, createEvent, updateEvent, deleteEvent } = useCalendarEvents(employee);
  const { settings } = useSettings();
  const eventTypes = settings?.eventTypes ?? [];
  const calendarRef = useRef<FullCalendar>(null);

  const [view, setView] = useState<CalendarViewOption>("timeGridRollingWeek");
  const [title, setTitle] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [initialSlot, setInitialSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);

  const canView = canViewCalendar(roleId, employee.id, currentUser?.id);
  const canCreate = canCreateCalendarEvent(roleId, employee.id, currentUser?.id);

  const calendarEvents = useMemo(
    () =>
      events.map((event) => {
        const color = getEventTypeColor(event.eventType);
        const editable = canEditCalendarEvent(roleId, event, currentUser?.id);
        return {
          id: event.id,
          title: event.title,
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
    [events, roleId, currentUser]
  );

  if (!canView) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Calendar Access Restricted"
        description="You don't have permission to view this person's calendar."
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
    if (!canCreate) return;
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
        // Sequential, not Promise.all — each create() reads the just-persisted list to pick the next id.
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

  return (
    <div className="space-y-4">
      <CalendarToolbar
        title={title}
        view={view}
        onViewChange={handleViewChange}
        onPrev={() => getApi()?.prev()}
        onNext={() => getApi()?.next()}
        onToday={() => getApi()?.today()}
        canCreate={canCreate}
        onCreate={() => openCreateDialog(null)}
      />

      {events.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="No Calendar Events Found"
          description={
            canCreate
              ? "Click a time slot below to create the first event."
              : "No events are scheduled on this calendar."
          }
        />
      )}

      <div className="rounded-xl border p-2 [&_.fc]:text-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          views={ROLLING_WEEK_VIEWS}
          initialView={view}
          headerToolbar={false}
          height={600}
          scrollTime="07:00:00"
          selectable={canCreate}
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
        blockableEmployees={[employee]}
        currentEmployeeId={currentUser?.id ?? employee.id}
        currentEmployeeName={currentUser?.name ?? employee.name}
        initialSlot={initialSlot}
        eventTypes={eventTypes}
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
