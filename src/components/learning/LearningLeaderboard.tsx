import { Trophy } from "lucide-react";
import { ChartCard } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Learner } from "@/hooks/useLearning";
import { getInitials } from "@/utils/format";

interface LearningLeaderboardProps {
  learners: Learner[];
}

export function LearningLeaderboard({ learners }: LearningLeaderboardProps) {
  return (
    <ChartCard
      title="Leaderboard"
      description="Top learners by completed courses"
      headerRight={<Trophy className="size-5 text-warning" aria-hidden="true" />}
    >
      <ul className="space-y-3">
        {learners.map((learner, index) => (
          <li key={learner.employee.id} className="flex items-center gap-3">
            <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{index + 1}</span>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(learner.employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{learner.employee.name}</p>
              <p className="truncate text-xs text-muted-foreground">{learner.employee.role}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{learner.completed} done</p>
              <p className="text-xs text-muted-foreground">{learner.hours}h</p>
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
