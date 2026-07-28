import { useEffect, useMemo, useRef, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { format } from "date-fns";
import { CalendarClock, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationDialog, EmptyState, LoadingSkeleton, SearchBar } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { useTeamCalendarEvents } from "@/hooks/useCalendarEvents";
import { usePermission } from "@/security";
import { calendarService } from "@/services";
import type { CalendarEvent, Employee } from "@/types";
import { getPersonColor } from "@/utils/calendarColors";
import { canCreateCalendarEvent, canDeleteCalendarEvent, canEditCalendarEvent, canViewCalendar } from "@/utils/permissions";
import { Badge } from "@/components/ui/badge";
import { CalendarEventFormDialog } from "./CalendarEventFormDialog";
import { CalendarEventModal } from "./CalendarEventModal";
import type { CalendarViewOption } from "./CalendarToolbar";
import { CalendarToolbar } from "./CalendarToolbar";

interface TeamCalendarProps {
  /** Every employee in the current user's data scope, to search and pick from. */
  employees: Employee[];
}

/** Local (non-UTC) ISO datetime, matching the stored event shape. */
function toLocalIso(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

const MAX_SEARCH_RESULTS = 8;

/**
 * People-picker + merged calendar (docs: calendar v2). Search and select a
 * handful of people, see their events on one shared timeline, and block time
 * on all of their calendars at once.
 */
export function TeamCalendar({ employees }: TeamCalendarProps) {
  const { currentUser } = useAuth();
  const { role } = usePermission();
  const roleId = role?.id;
  const calendarRef = useRef<FullCalendar>(null);

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const viewableEmployees = useMemo(
    () => employees.filter((e) => canViewCalendar(roleId, e.id, currentUser?.id)),
    [employees, roleId, currentUser]
  );
  const employeeById = useMemo(() => new Map(viewableEmployees.map((e) => [e.id, e])), [viewableEmployees]);
  const selectedEmployees = useMemo(
    () => selectedIds.map((id) => employeeById.get(id)).filter((e): e is Employee => Boolean(e)),
    [selectedIds, employeeById]
  );
  /** One color per selected person (fixed order = selection order), so any two selected together stay distinct. */
  const colorByEmployeeId = useMemo(
    () => new Map(selectedEmployees.map((e, index) => [e.id, getPersonColor(index)])),
    [selectedEmployees]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return viewableEmployees
      .filter((e) => !selectedIds.includes(e.id))
      .filter((e) => [e.name, e.role, e.team].some((field) => field.toLowerCase().includes(q)))
      .slice(0, MAX_SEARCH_RESULTS);
  }, [viewableEmployees, selectedIds, query]);

  const selectEmployee = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current : [...current, id]));
    setQuery("");
  };
  const removeEmployee = (id: string) => {
    setSelectedIds((current) => current.filter((existing) => existing !== id));
  };

  const createEmployees = useMemo(
    () => selectedEmployees.filter((e) => canCreateCalendarEvent(roleId, e.id, currentUser?.id)),
    [selectedEmployees, roleId, currentUser]
  );

  const { events, isLoading, error, createEvent, updateEvent, deleteEvent } = useTeamCalendarEvents(selectedIds);

  const [view, setView] = useState<CalendarViewOption>("timeGridWeek");
  const [title, setTitle] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [initialSlot, setInitialSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [groupEvents, setGroupEvents] = useState<CalendarEvent[]>([]);

  // Sibling events sharing the open event's block, fetched fresh so membership is
  // correct even for people not currently in the top picker (docs: calendar v2).
  useEffect(() => {
    if (!selectedEvent) {
      setGroupEvents([]);
      return;
    }
    if (!selectedEvent.blockGroupId) {
      setGroupEvents([selectedEvent]);
      return;
    }
    let cancelled = false;
    calendarService.getByGroup(selectedEvent.blockGroupId).then((list) => {
      if (!cancelled) setGroupEvents(list);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedEvent]);

  const groupMembers = useMemo(
    () =>
      groupEvents.map((e) => ({
        eventId: e.id,
        employeeId: e.employeeId,
        employeeName: employeeById.get(e.employeeId)?.name ?? "Unknown",
      })),
    [groupEvents, employeeById]
  );
  const addableToGroup = useMemo(() => {
    const memberIds = new Set(groupEvents.map((e) => e.employeeId));
    return viewableEmployees.filter(
      (e) => !memberIds.has(e.id) && canCreateCalendarEvent(roleId, e.id, currentUser?.id)
    );
  }, [viewableEmployees, groupEvents, roleId, currentUser]);

  const handleAddMember = async (employeeId: string) => {
    if (!selectedEvent) return;
    const addedName = employeeById.get(employeeId)?.name ?? "Person";
    try {
      let groupId = selectedEvent.blockGroupId ?? null;
      if (!groupId) {
        groupId = crypto.randomUUID();
        const withGroup = { ...selectedEvent, blockGroupId: groupId };
        await updateEvent(selectedEvent.id, withGroup);
        setSelectedEvent(withGroup);
      }
      const created = await createEvent({
        employeeId,
        title: selectedEvent.title,
        description: selectedEvent.description,
        eventType: selectedEvent.eventType,
        start: selectedEvent.start,
        end: selectedEvent.end,
        timeZone: selectedEvent.timeZone,
        organizer: selectedEvent.organizer,
        attendees: selectedEvent.attendees,
        location: selectedEvent.location,
        outlookEventId: null,
        createdBy: selectedEvent.createdBy,
        linkedTaskId: null,
        blockGroupId: groupId,
      });
      setGroupEvents((current) => [...current, created]);
      setSelectedIds((current) => (current.includes(employeeId) ? current : [...current, employeeId]));
      toast.success(`Added ${addedName} to this block.`);
    } catch {
      toast.error("Unable to add that person. Please try again.");
    }
  };

  const handleRemoveMember = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setGroupEvents((current) => current.filter((e) => e.id !== eventId));
      toast.success("Removed from this block.");
    } catch {
      toast.error("Unable to remove. Please try again.");
    }
  };

  const calendarEvents = useMemo(
    () =>
      events.map((event) => {
        const color = colorByEmployeeId.get(event.employeeId) ?? getPersonColor(0);
        const editable = canEditCalendarEvent(roleId, event, currentUser?.id);
        const employeeName = employeeById.get(event.employeeId)?.name ?? "Unknown";
        return {
          id: event.id,
          title: `${employeeName.split(" ")[0]} • ${event.title}`,
          start: event.start,
          end: event.end,
          backgroundColor: color.hex,
          borderColor: color.hex,
          textColor: color.textColor,
          editable,
          startEditable: editable,
          durationEditable: editable,
          extendedProps: { event },
        };
      }),
    [events, roleId, currentUser, employeeById, colorByEmployeeId]
  );

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
  const selectedEventEmployeeName = selectedEvent ? employeeById.get(selectedEvent.employeeId)?.name : undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative max-w-sm">
          <SearchBar value={query} onChange={setQuery} placeholder="Search people to add…" />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-md">
              {searchResults.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => selectEmployee(candidate.id)}
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-medium">{candidate.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {candidate.role} · {candidate.team}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedEmployees.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedEmployees.map((employee) => (
              <Badge key={employee.id} variant="secondary" className="gap-1.5 py-1.5 pl-2.5 pr-1.5 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorByEmployeeId.get(employee.id)?.hex }}
                  aria-hidden="true"
                />
                {employee.name}
                <button
                  type="button"
                  aria-label={`Remove ${employee.name}`}
                  onClick={() => removeEmployee(employee.id)}
                  className="rounded-full p-0.5 hover:bg-background/60"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {selectedEmployees.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No People Selected"
          description="Search for people above and select a few to see their calendars together."
        />
      ) : isLoading ? (
        <LoadingSkeleton variant="list" count={4} />
      ) : error ? (
        <EmptyState icon={CalendarClock} title="Unable to load calendar" description={error} />
      ) : (
        <>
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
                  ? "Click a time slot below to block that time on everyone selected."
                  : "No events are scheduled for the people selected."
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
        </>
      )}

      <CalendarEventModal
        event={selectedEvent}
        employeeName={selectedEventEmployeeName}
        groupMembers={groupMembers}
        addableEmployees={addableToGroup}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
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
        targetEmployeeIds={createEmployees.map((e) => e.id)}
        targetEmployeeNames={createEmployees.map((e) => e.name)}
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
