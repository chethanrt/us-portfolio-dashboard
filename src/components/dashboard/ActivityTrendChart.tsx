import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/common";
import type { TrendPoint } from "@/hooks/useDashboardData";
import { CHART_COLORS } from "@/utils/chartColors";
import { AXIS_TICK, GRID_STROKE, TOOLTIP_STYLE } from "./chartTheme";

interface ActivityTrendChartProps {
  data: TrendPoint[];
}

export function ActivityTrendChart({ data }: ActivityTrendChartProps) {
  return (
    <ChartCard title="AI Activities Trend" description="Activities logged per week, last 90 days">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="week" tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ fontWeight: 600 }}
              formatter={(value) => [Number(value ?? 0), "Activities"]}
              labelFormatter={(label) => `Week of ${String(label ?? "")}`}
            />
            <Line
              type="monotone"
              dataKey="count"
              isAnimationActive={false}
              stroke={CHART_COLORS.blue}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
