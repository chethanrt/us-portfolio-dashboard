import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarDays, eachDayOfInterval, format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormCheckboxGroupField, FormInputField, FormSelectField, FormTextareaField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { CalendarEvent, CalendarEventType, Employee } from "@/types";
import { generateGroupId } from "@/utils/id";

const REQUIRED = "This field is required.";

/** Range blocks (multi-day) are capped so a fat-fingered end date can't create hundreds of events. */
const MAX_RANGE_DAYS = 31;

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters.").max(100),
    description: z.string().trim().max(500),
    eventType: z.string().min(1, REQUIRED),
    memberIds: z.array(z.string()).min(1, "Select at least one person to block."),
    date: z.string().min(1, REQUIRED),
    endDate: z.string().min(1, REQUIRED),
    startTime: z.string().min(1, REQUIRED),
    endTime: z.string().min(1, REQUIRED),
    location: z.string().trim().max(120),
    attendees: z.string().trim(),
  })
  .refine((values) => values.endTime > values.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  })
  .refine((values) => values.endDate >= values.date, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  })
  .refine((values) => differenceInCalendarDays(parseISO(values.endDate), parseISO(values.date)) < MAX_RANGE_DAYS, {
    message: `Date range cannot exceed ${MAX_RANGE_DAYS} days.`,
    path: ["endDate"],
  });

type EventFormValues = z.infer<typeof eventSchema>;

const EMPTY_VALUES: EventFormValues = {
  title: "",
  description: "",
  eventType: "",
  memberIds: [],
  date: format(new Date(), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  attendees: "",
};

function parseAttendees(raw: string): CalendarEvent["attendees"] {
  return raw
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((email) => ({ name: email.split("@")[0], email }));
}

interface CalendarEventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog is in Edit mode — always applies to that one event's own owner. */
  event: CalendarEvent | null;
  /**
   * Everyone this dialog is allowed to block time for — independent of whatever the
   * page is currently filtered/searched to. Exactly one candidate (e.g. a single
   * person's own calendar tab) skips the picker and blocks them directly.
   */
  blockableEmployees: Employee[];
  /** Current signed-in user — becomes organizer/createdBy on new events. */
  currentEmployeeId: string;
  currentEmployeeName: string;
  /** Pre-fills date/time when created via a slot click. */
  initialSlot?: { start: Date; end: Date } | null;
  /** Settings-managed event type list (Settings > Calendar Event Types). */
  eventTypes: string[];
  /** Called with one payload per (day × blocked person) combination. */
  onSave: (values: Omit<CalendarEvent, "id">[]) => Promise<void>;
}

export function CalendarEventFormDialog({
  open,
  onOpenChange,
  event,
  blockableEmployees,
  currentEmployeeId,
  currentEmployeeName,
  initialSlot,
  eventTypes,
  onSave,
}: CalendarEventFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(event);
  // A real choice only exists in create mode with more than one blockable person —
  // otherwise there's nothing to pick, so the field is skipped entirely.
  const showMemberPicker = !isEdit && blockableEmployees.length > 1;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (event) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      form.reset({
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        memberIds: [event.employeeId],
        date: format(start, "yyyy-MM-dd"),
        endDate: format(start, "yyyy-MM-dd"),
        startTime: format(start, "HH:mm"),
        endTime: format(end, "HH:mm"),
        location: event.location,
        attendees: event.attendees.map((a) => a.email).join(", "),
      });
    } else {
      // Start empty when there's a real choice to make; auto-pick the only candidate otherwise.
      const memberIds = blockableEmployees.length === 1 ? [blockableEmployees[0].id] : [];
      form.reset({
        ...EMPTY_VALUES,
        memberIds,
        ...(initialSlot
          ? {
              date: format(initialSlot.start, "yyyy-MM-dd"),
              endDate: format(initialSlot.start, "yyyy-MM-dd"),
              startTime: format(initialSlot.start, "HH:mm"),
              endTime: format(initialSlot.end, "HH:mm"),
            }
          : {}),
      });
    }
  }, [open, event, initialSlot, blockableEmployees, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const days = eachDayOfInterval({ start: parseISO(values.date), end: parseISO(values.endDate) });
      const targets = isEdit && event ? [event.employeeId] : values.memberIds;
      // Multiple people blocked together share one group id, so they can be found and
      // grown later (the team calendar's "add person to this block" flow).
      const blockGroupId = isEdit ? (event?.blockGroupId ?? null) : targets.length > 1 ? generateGroupId() : null;
      const payloads = days.flatMap((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        return targets.map((employeeId) => ({
          employeeId,
          title: values.title.trim(),
          description: values.description.trim(),
          eventType: values.eventType as CalendarEventType,
          start: `${dayStr}T${values.startTime}:00`,
          end: `${dayStr}T${values.endTime}:00`,
          timeZone: event?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          organizer: event?.organizer ?? currentEmployeeName,
          attendees: parseAttendees(values.attendees),
          location: values.location.trim(),
          outlookEventId: event?.outlookEventId ?? null,
          createdBy: event?.createdBy ?? currentEmployeeId,
          linkedTaskId: event?.linkedTaskId ?? null,
          blockGroupId,
        }));
      });
      await onSave(payloads);
      onOpenChange(false);
    } catch {
      // save failed — the caller shows the error toast; keep the dialog open
    } finally {
      setIsSaving(false);
    }
  });

  const isTaskBlock = form.watch("eventType") === "Calendar Block for Task";

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !isSaving && onOpenChange(next)}
      title={isEdit ? "Edit Blocked Time" : "Block Calendar"}
      description={
        isEdit
          ? undefined
          : "Choose who to block, then pick an End Date past the Start Date to block the same range across several days."
      }
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <FormInputField control={form.control} name="title" label="Title" placeholder="e.g. Knowledge Transfer" required />
          </div>
          <FormTextareaField
            control={form.control}
            name="description"
            label="Description"
            placeholder="e.g. Magento Architecture Walkthrough"
          />
          <FormSelectField control={form.control} name="eventType" label="Event Type" options={eventTypes} required />
          {isTaskBlock && (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              This will also create a matching task on the Task Board (status: To Do).
            </p>
          )}
          {showMemberPicker && (
            <FormCheckboxGroupField
              control={form.control}
              name="memberIds"
              label="Block For"
              required
              options={blockableEmployees.map((e) => ({ value: e.id, label: `${e.name} (${e.role})` }))}
            />
          )}
          <FormInputField
            control={form.control}
            name="date"
            label={isEdit ? "Date" : "Start Date"}
            type="date"
            required
          />
          {!isEdit && (
            <FormInputField control={form.control} name="endDate" label="End Date" type="date" required />
          )}
          <FormInputField control={form.control} name="location" label="Location" placeholder="e.g. Conference Room 2" />
          <FormInputField control={form.control} name="startTime" label="Start Time" type="time" required />
          <FormInputField control={form.control} name="endTime" label="End Time" type="time" required />
          <FormTextareaField
            control={form.control}
            name="attendees"
            label="Attendees"
            placeholder="Comma-separated email addresses"
            rows={2}
          />

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" disabled={isSaving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
