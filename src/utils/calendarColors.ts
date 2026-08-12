import type { CalendarEventType } from "@/types";

interface EventTypeColor {
  /** Hex used for FullCalendar's backgroundColor/borderColor. */
  hex: string;
  /** Tailwind class for the small legend dot. */
  dotClassName: string;
}

/**
 * One distinct hue per default event type. Extends past the app's 6 core UI
 * colors (docs/CLAUDE.md palette) with a few extra hues — the same way chart
 * series need more categorical colors than core UI accents — so all default
 * types stay visually distinguishable on the same calendar. Event types added
 * later via Settings fall back to a color picked from EXTRA_TYPE_COLORS below.
 */
const EVENT_TYPE_COLORS: Partial<Record<CalendarEventType, EventTypeColor>> = {
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
  POC: { hex: "#10b981", dotClassName: "bg-emerald-500" },
};

/** Colors assigned by name hash to any event type added via Settings that isn't in the map above. */
const EXTRA_TYPE_COLORS: EventTypeColor[] = [
  { hex: "#0ea5e9", dotClassName: "bg-sky-500" },
  { hex: "#84cc16", dotClassName: "bg-lime-500" },
  { hex: "#f43f5e", dotClassName: "bg-rose-500" },
  { hex: "#14b8a6", dotClassName: "bg-teal-500" },
];

export function getEventTypeColor(eventType: string): EventTypeColor {
  const known = EVENT_TYPE_COLORS[eventType as CalendarEventType];
  if (known) return known;
  const hash = eventType.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return EXTRA_TYPE_COLORS[hash % EXTRA_TYPE_COLORS.length];
}

interface PersonColor {
  /** Fill for that person's calendar blocks. */
  hex: string;
  /** Whichever of black/white reads best on `hex`, computed for contrast — not eyeballed. */
  textColor: string;
}

/**
 * Fixed-order categorical palette (docs/dataviz skill): eight hues, each
 * validated for adjacent CVD separation and chroma floor, no white/light
 * steps. Assign by a person's index within the current selection so any two
 * people selected together always get visibly distinct colors.
 */
const PERSON_COLORS: PersonColor[] = [
  { hex: "#2a78d6", textColor: "#ffffff" }, // blue
  { hex: "#eb6834", textColor: "#0b0b0b" }, // orange
  { hex: "#1baf7a", textColor: "#0b0b0b" }, // aqua
  { hex: "#eda100", textColor: "#0b0b0b" }, // yellow
  { hex: "#e87ba4", textColor: "#0b0b0b" }, // magenta
  { hex: "#008300", textColor: "#ffffff" }, // green
  { hex: "#4a3aa7", textColor: "#ffffff" }, // violet
  { hex: "#e34948", textColor: "#ffffff" }, // red
];

export function getPersonColor(index: number): PersonColor {
  return PERSON_COLORS[index % PERSON_COLORS.length];
}
