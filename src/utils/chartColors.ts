/**
 * Chart palette — validated for lightness, chroma, CVD separation and
 * contrast on the light card surface (dataviz six-checks validator).
 */
export const CHART_COLORS = {
  blue: "#2563eb",
  indigo: "#4f46e5",
  purple: "#9333ea",
  green: "#16a34a",
  orange: "#ea580c",
} as const;

/** Project status → color. Order in donuts: Active, Completed, On Hold. */
export const PROJECT_STATUS_COLORS: Record<string, string> = {
  Active: CHART_COLORS.blue,
  Completed: CHART_COLORS.green,
  "On Hold": CHART_COLORS.orange,
};
