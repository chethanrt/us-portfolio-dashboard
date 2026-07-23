import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/common";
import type { StatusSlice } from "@/hooks/useDashboardData";
import { PROJECT_STATUS_COLORS } from "@/utils/chartColors";
import { TOOLTIP_STYLE } from "./chartTheme";

interface ProjectStatusChartProps {
  data: StatusSlice[];
}

export function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <ChartCard title="Project Status" description={`${total} projects across the portfolio`}>
      <div className="flex h-64 flex-col items-center gap-2 sm:flex-row">
        <div className="relative h-44 w-full sm:h-full sm:flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                isAnimationActive={false}
                nameKey="status"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {data.map((slice) => (
                  <Cell key={slice.status} fill={PROJECT_STATUS_COLORS[slice.status]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, name) => [`${Number(value ?? 0)} projects`, String(name ?? "")]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{total}</span>
            <span className="text-xs text-muted-foreground">Projects</span>
          </div>
        </div>
        {/* Legend with counts — identity never relies on color alone */}
        <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 sm:w-40 sm:grid-cols-1">
          {data.map((slice) => (
            <li key={slice.status} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PROJECT_STATUS_COLORS[slice.status] }}
              />
              <span className="flex-1 truncate text-muted-foreground">{slice.status}</span>
              <span className="font-medium">{slice.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
