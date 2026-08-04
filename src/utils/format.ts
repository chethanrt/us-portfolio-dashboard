import { format, parseISO } from "date-fns";

/** e.g. "Nov 3, 2025" — used for entity dates stored as yyyy-MM-dd. */
export function formatDate(isoDate: string): string {
  if (!isoDate) return "—";
  return format(parseISO(isoDate), "MMM d, yyyy");
}

/** e.g. "Tue, Jul 14, 2026" — shown in the top navigation. */
export function formatNavbarDate(date: Date = new Date()): string {
  return format(date, "EEE, MMM d, yyyy");
}

/** Initials for avatar fallbacks, e.g. "Priya Sharma" -> "PS". */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
