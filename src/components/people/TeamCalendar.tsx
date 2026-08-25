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
import { ConfirmationDialog, EmptyState, LoadingSkeleton, MultiSelectDropdown } from "@/components/common";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTeamCalendarEvents } from "@/hooks/useCalendarEvents";
import { useSettings } from "@/hooks/useSettings";
import { usePermission } from "@/security";
import { calendarService } from "@/services";
import type { CalendarEvent, Employee } from "@/types";
import { getPersonColor } from "@/utils/calendarColors";
import { generateGroupId } from "@/utils/id";
import { canCreateCalendarEvent, canDeleteCalendarEvent, canEditCalendarEvent, canViewCalendar } from "@/utils/permissions";
import { Badge } from "@/components/ui/badge";
import { CalendarEventFormDialog } from "./CalendarEventFormDialog";
import { CalendarEventModal } from "./CalendarEventModal";
import type { CalendarViewOption } from "./CalendarToolbar";
import { CalendarToolbar, ROLLING_WEEK_VIEWS } from "./CalendarToolbar";

interface TeamCalendarProps {
  /** Every employee in the current user's data scope, to search and pick from. */
  employees: Employee[];
}

/** Local (non-UTC) ISO datetime, matching the stored event shape. */
function toLocalIso(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Merged calendar (docs: calendar v2). Shows everyone's blocked time by
 * default; the filter dropdown narrows it down to specific people.
 */
export function TeamCalendar({ employees }: TeamCalendarProps) {
  const { currentUser } = useAuth();
  const { role } = usePermission();
  const roleId = role?.id;
  const calendarRef = useRef<FullCalendar>(null);

  // Empty means "everyone" — the dropdown only ever holds an explicit subset.
  const [filterIds, setFilterIds] = useState<string[]>([]);

  const viewableEmployees = useMemo(
    () => employees.filter((e) => canViewCalendar(roleId, e.id, currentUser?.id)),
    [employees, roleId, currentUser]
  );
  const employeeById = useMemo(() => new Map(viewableEmployees.map((e) => [e.id, e])), [viewableEmployees]);
  const selectedIds = useMemo(
    () => (filterIds.length > 0 ? filterIds : viewableEmployees.map((e) => e.id)),
    [filterIds, viewableEmployees]
  );
  const selectedEmployees = useMemo(
    () => selectedIds.map((id) => employeeById.get(id)).filter((e): e is Employee => Boolean(e)),
    [selectedIds, employeeById]
  );
  /** One color per selected person (fixed order = selection order), so any two selected together stay distinct. */
  const colorByEmployeeId = useMemo(
    () => new Map(selectedEmployees.map((e, index) => [e.id, getPersonColor(index)])),
    [selectedEmployees]
  );

  // Who can be blocked, independent of the view filter above — the Block Calendar
  // form has its own people-picker rather than targeting whoever is currently shown.
  const blockableEmployees = useMemo(
    () => viewableEmployees.filter((e) => canCreateCalendarEvent(roleId, e.id, currentUser?.id)),
    [viewableEmployees, roleId, currentUser]
  );

  const { events, isLoading, error, createEvent, updateEvent, deleteEvent } = useTeamCalendarEvents(selectedIds);
  const { settings } = useSettings();
  const eventTypes = settings?.eventTypes ?? [];

  const [view, setView] = useState<CalendarViewOption>("timeGridRollingWeek");
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
        groupId = generateGroupId();
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
      // Only needs to touch the filter when one is active — "everyone" already includes the new member.
      setFilterIds((current) => (current.length === 0 || current.includes(employeeId) ? current : [...current, employeeId]));
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
    if (blockableEmployees.length === 0) return;
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
        <MultiSelectDropdown
          options={viewableEmployees.map((e) => ({ value: e.id, label: e.name, description: `${e.role} · ${e.team}` }))}
          selectedIds={filterIds}
          onChange={setFilterIds}
          allLabel="All People"
          searchPlaceholder="Search people…"
        />

        {filterIds.length > 0 && (
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
                  onClick={() => setFilterIds((current) => current.filter((id) => id !== employee.id))}
                  className="rounded-full p-0.5 hover:bg-background/60"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {viewableEmployees.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Calendar Access Restricted"
          description="You don't have permission to view anyone's calendar."
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
            canCreate={blockableEmployees.length > 0}
            onCreate={() => openCreateDialog(null)}
          />

          {events.length === 0 && (
            <EmptyState
              icon={CalendarClock}
              title="No Calendar Events Found"
              description={
                blockableEmployees.length > 0
                  ? "Use Block Calendar above to block time."
                  : "No events are scheduled for the people selected."
              }
            />
          )}

          {/* Stays mounted (just visually hidden) when empty, so Today/Prev/Next and the
              date-range title keep working — only the grid itself is hidden per the ask. */}
          <div className={cn("rounded-xl border p-2 [&_.fc]:text-sm", events.length === 0 && "hidden")}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              views={ROLLING_WEEK_VIEWS}
              initialView={view}
              headerToolbar={false}
              height={720}
              scrollTime="07:00:00"
              selectable={blockableEmployees.length > 0}
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
        blockableEmployees={blockableEmployees}
        currentEmployeeId={currentUser?.id ?? ""}
        currentEmployeeName={currentUser?.name ?? ""}
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
