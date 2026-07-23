import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ChartCard } from "@/components/common";
import type { EnrichedActivity } from "@/hooks/useDashboardData";

interface RecentActivitiesProps {
  activities: EnrichedActivity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <ChartCard title="Recent AI Activities" description="Latest activity across the portfolio">
      <ul className="divide-y">
        {activities.map((activity) => (
          <li key={activity.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{activity.promptSummary}</p>
              <p className="truncate text-xs text-muted-foreground">
                {activity.employeeName} · {activity.projectName} · {activity.category}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="secondary" className="text-xs">
                {activity.tool}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(parseISO(activity.date), "MMM d")} · {activity.hoursSaved}h saved
              </span>
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
