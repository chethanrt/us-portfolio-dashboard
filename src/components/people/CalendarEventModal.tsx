import { useState } from "react";
import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { Modal, SearchBar } from "@/components/common";
import { Badge } from "@/components/ui/badge";
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

export interface CalendarEventGroupMember {
  eventId: string;
  employeeId: string;
  employeeName: string;
}

interface GroupMembersSectionProps {
  ownerEmployeeId: string;
  members: CalendarEventGroupMember[];
  addableEmployees: { id: string; name: string }[];
  onAdd: (employeeId: string) => void;
  onRemove: (eventId: string) => void;
}

/** Search-and-add UI for growing a block created for multiple people (team calendar). */
function GroupMembersSection({ ownerEmployeeId, members, addableEmployees, onAdd, onRemove }: GroupMembersSectionProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? addableEmployees.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 8)
    : [];

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground">People on this block</p>
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <Badge key={member.eventId} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1.5 text-sm">
            {member.employeeName}
            {member.employeeId !== ownerEmployeeId && (
              <button
                type="button"
                aria-label={`Remove ${member.employeeName} from this block`}
                onClick={() => onRemove(member.eventId)}
                className="rounded-full p-0.5 hover:bg-background/60"
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {addableEmployees.length > 0 && (
        <div className="relative">
          <SearchBar value={query} onChange={setQuery} placeholder="Add another person…" />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-md">
              {results.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => {
                    onAdd(candidate.id);
                    setQuery("");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-medium hover:bg-muted"
                >
                  {candidate.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CalendarEventModalProps {
  event: CalendarEvent | null;
  /** Shown as an extra row when the event is displayed outside its owner's own calendar (team view). */
  employeeName?: string;
  /** Everyone currently sharing this block (team calendar); omit to hide the section entirely. */
  groupMembers?: CalendarEventGroupMember[];
  /** People who could still be added to this block. */
  addableEmployees?: { id: string; name: string }[];
  onAddMember?: (employeeId: string) => void;
  onRemoveMember?: (eventId: string) => void;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

/** Read-only event details with permission-gated Edit/Delete actions. */
export function CalendarEventModal({
  event,
  employeeName,
  groupMembers,
  addableEmployees,
  onAddMember,
  onRemoveMember,
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

  const showGroupSection =
    canEdit && onAddMember && onRemoveMember && ((groupMembers?.length ?? 0) > 0 || (addableEmployees?.length ?? 0) > 0);

  return (
    <Modal open={Boolean(event)} onOpenChange={(open) => !open && onClose()} title={event.title} className="sm:max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${getEventTypeColor(event.eventType).dotClassName}`} />
          <span className="text-sm text-muted-foreground">{event.eventType}</span>
        </div>

        {event.description && <p className="text-sm">{event.description}</p>}

        <div className="space-y-2 rounded-lg border p-3">
          {employeeName && <InfoRow label="Employee" value={employeeName} />}
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

        {showGroupSection && (
          <GroupMembersSection
            ownerEmployeeId={event.employeeId}
            members={groupMembers ?? []}
            addableEmployees={addableEmployees ?? []}
            onAdd={onAddMember!}
            onRemove={onRemoveMember!}
          />
        )}

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
