import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarDays, eachDayOfInterval, format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormInputField, FormSelectField, FormTextareaField, Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { CalendarEvent, CalendarEventType } from "@/types";
import { CALENDAR_EVENT_TYPES } from "@/utils/calendarColors";

const REQUIRED = "This field is required.";

/** Range blocks (multi-day) are capped so a fat-fingered end date can't create hundreds of events. */
const MAX_RANGE_DAYS = 31;

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters.").max(100),
    description: z.string().trim().max(500),
    eventType: z.string().min(1, REQUIRED),
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
  eventType: "Meeting",
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
  /** When set, the dialog is in Edit mode. */
  event: CalendarEvent | null;
  /** Whose calendar this event belongs to. */
  targetEmployeeId: string;
  /** Current signed-in user — becomes organizer/createdBy on new events. */
  currentEmployeeId: string;
  currentEmployeeName: string;
  /** Pre-fills date/time when created via a slot click. */
  initialSlot?: { start: Date; end: Date } | null;
  /** Called with one payload per day in the selected range (a single-day event is a 1-element array). */
  onSave: (values: Omit<CalendarEvent, "id">[]) => Promise<void>;
}

export function CalendarEventFormDialog({
  open,
  onOpenChange,
  event,
  targetEmployeeId,
  currentEmployeeId,
  currentEmployeeName,
  initialSlot,
  onSave,
}: CalendarEventFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(event);

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
        date: format(start, "yyyy-MM-dd"),
        endDate: format(start, "yyyy-MM-dd"),
        startTime: format(start, "HH:mm"),
        endTime: format(end, "HH:mm"),
        location: event.location,
        attendees: event.attendees.map((a) => a.email).join(", "),
      });
    } else if (initialSlot) {
      form.reset({
        ...EMPTY_VALUES,
        date: format(initialSlot.start, "yyyy-MM-dd"),
        endDate: format(initialSlot.start, "yyyy-MM-dd"),
        startTime: format(initialSlot.start, "HH:mm"),
        endTime: format(initialSlot.end, "HH:mm"),
      });
    } else {
      form.reset(EMPTY_VALUES);
    }
  }, [open, event, initialSlot, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const days = eachDayOfInterval({ start: parseISO(values.date), end: parseISO(values.endDate) });
      const payloads = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        return {
          employeeId: targetEmployeeId,
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
        };
      });
      await onSave(payloads);
      onOpenChange(false);
    } catch {
      // save failed — the caller shows the error toast; keep the dialog open
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !isSaving && onOpenChange(next)}
      title={isEdit ? "Edit Event" : "Create Event"}
      description={
        isEdit ? undefined : "Pick an End Date past the Start Date to block the same time range across several days."
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
          <FormSelectField control={form.control} name="eventType" label="Event Type" options={CALENDAR_EVENT_TYPES} required />
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
