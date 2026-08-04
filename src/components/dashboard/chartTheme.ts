import type { CSSProperties } from "react";

/** Shared Recharts styling — recessive grid/axes, card-styled tooltip. */

export const AXIS_TICK = { fontSize: 12, fill: "#64748b" } as const;

export const GRID_STROKE = "#e2e8f0";

export const TOOLTIP_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
  fontSize: 12,
  padding: "8px 12px",
};
