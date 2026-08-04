import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/common";
import type { ToolUsage } from "@/hooks/useDashboardData";
import { CHART_COLORS } from "@/utils/chartColors";
import { AXIS_TICK, GRID_STROKE, TOOLTIP_STYLE } from "./chartTheme";

interface ToolUsageChartProps {
  data: ToolUsage[];
}

export function ToolUsageChart({ data }: ToolUsageChartProps) {
  return (
    <ChartCard title="AI Tool Usage" description="Activities logged per tool">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="tool" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgb(37 99 235 / 0.06)" }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${Number(value ?? 0)} activities`, "Usage"]}
            />
            <Bar
              dataKey="count"
              fill={CHART_COLORS.blue}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            >
              <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: "#64748b" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
