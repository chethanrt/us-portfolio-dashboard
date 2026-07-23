import { ChartCard, ProgressBar } from "@/components/common";
import type { DashboardData } from "@/hooks/useDashboardData";

interface LearningProgressWidgetProps {
  learning: DashboardData["learning"];
}

export function LearningProgressWidget({ learning }: LearningProgressWidgetProps) {
  return (
    <ChartCard
      title="Learning Progress"
      description="Udemy AI Lab and internal training"
      headerRight={
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{learning.completion}%</p>
          <p className="text-xs text-muted-foreground">overall</p>
        </div>
      }
    >
      <div className="flex h-64 flex-col">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted px-3 py-2">
            <p className="text-lg font-semibold">{learning.completedCourses}</p>
            <p className="text-xs text-muted-foreground">Courses completed</p>
          </div>
          <div className="rounded-lg bg-muted px-3 py-2">
            <p className="text-lg font-semibold">{learning.inProgressCourses}</p>
            <p className="text-xs text-muted-foreground">In progress</p>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {learning.topCourses.map((course) => (
            <ProgressBar
              key={course.course}
              label={course.course}
              value={course.avgProgress}
            />
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
