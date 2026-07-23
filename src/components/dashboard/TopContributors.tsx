import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChartCard } from "@/components/common";
import type { Contributor } from "@/hooks/useDashboardData";
import { getInitials } from "@/utils/format";

interface TopContributorsProps {
  contributors: Contributor[];
}

export function TopContributors({ contributors }: TopContributorsProps) {
  return (
    <ChartCard title="Top Contributors" description="By hours saved with AI">
      <ul className="space-y-3">
        {contributors.map((contributor, index) => (
          <li key={contributor.employee.id} className="flex items-center gap-3">
            <span className="w-5 text-center text-sm font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(contributor.employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{contributor.employee.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {contributor.employee.role} · {contributor.activities} activities
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{contributor.hoursSaved.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">saved</p>
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
