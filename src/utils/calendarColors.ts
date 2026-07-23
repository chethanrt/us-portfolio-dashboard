import type { CalendarEventType } from "@/types";

/** Options for the event type select field, in display order. */
export const CALENDAR_EVENT_TYPES: CalendarEventType[] = [
  "Meeting",
  "Focus Time",
  "Training",
  "KT Session",
  "Leave",
  "Workshop",
  "Code Review",
  "Sprint Planning",
  "Retrospective",
  "Calendar Block for Task",
];

interface EventTypeColor {
  /** Hex used for FullCalendar's backgroundColor/borderColor. */
  hex: string;
  /** Tailwind class for the small legend dot. */
  dotClassName: string;
}

/**
 * One distinct hue per event type. Extends past the app's 6 core UI colors
 * (docs/CLAUDE.md palette) with a few extra hues — the same way chart series
 * need more categorical colors than core UI accents — so all 10 types stay
 * visually distinguishable on the same calendar.
 */
const EVENT_TYPE_COLORS: Record<CalendarEventType, EventTypeColor> = {
  Meeting: { hex: "#3b82f6", dotClassName: "bg-blue-500" },
  "Focus Time": { hex: "#6366f1", dotClassName: "bg-indigo-500" },
  Training: { hex: "#a855f7", dotClassName: "bg-purple-500" },
  "KT Session": { hex: "#06b6d4", dotClassName: "bg-cyan-500" },
  Leave: { hex: "#ef4444", dotClassName: "bg-red-500" },
  Workshop: { hex: "#d946ef", dotClassName: "bg-fuchsia-500" },
  "Code Review": { hex: "#22c55e", dotClassName: "bg-green-500" },
  "Sprint Planning": { hex: "#f97316", dotClassName: "bg-orange-500" },
  Retrospective: { hex: "#64748b", dotClassName: "bg-slate-500" },
  "Calendar Block for Task": { hex: "#eab308", dotClassName: "bg-yellow-500" },
};

export function getEventTypeColor(eventType: CalendarEventType): EventTypeColor {
  return EVENT_TYPE_COLORS[eventType];
}
