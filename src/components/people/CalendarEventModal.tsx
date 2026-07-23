import { format, parseISO } from "date-fns";
import { Modal } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/types";
import { getEventTypeColor } from "@/utils/calendarColors";

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

interface CalendarEventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

/** Read-only event details with permission-gated Edit/Delete actions. */
export function CalendarEventModal({
  event,
  onClose,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: CalendarEventModalProps) {
  if (!event) return null;

  const start = parseISO(event.start);
  const end = parseISO(event.end);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const durationLabel =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ""}`
      : `${durationMinutes}m`;

  return (
    <Modal open={Boolean(event)} onOpenChange={(open) => !open && onClose()} title={event.title} className="sm:max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${getEventTypeColor(event.eventType).dotClassName}`} />
          <span className="text-sm text-muted-foreground">{event.eventType}</span>
        </div>

        {event.description && <p className="text-sm">{event.description}</p>}

        <div className="space-y-2 rounded-lg border p-3">
          <InfoRow label="Organizer" value={event.organizer} />
          <InfoRow label="Date" value={format(start, "MMM d, yyyy")} />
          <InfoRow label="Time" value={`${format(start, "h:mm a")} – ${format(end, "h:mm a")}`} />
          <InfoRow label="Duration" value={durationLabel} />
          <InfoRow label="Location" value={event.location || "—"} />
          <InfoRow
            label="Attendees"
            value={event.attendees.length ? event.attendees.map((a) => a.name).join(", ") : "—"}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {canDelete && (
            <Button variant="destructive" onClick={() => onDelete(event)}>
              Delete
            </Button>
          )}
          {canEdit && <Button onClick={() => onEdit(event)}>Edit</Button>}
        </div>
      </div>
    </Modal>
  );
}
