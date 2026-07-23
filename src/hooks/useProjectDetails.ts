import { useEffect, useState } from "react";
import { activityService, learningService, pocService } from "@/services";
import type { Activity, LearningRecord, POC, Project } from "@/types";

export interface ProjectDetails {
  activities: Activity[];
  pocs: POC[];
  /** Average learning progress across the project team (0–100). */
  teamLearningProgress: number;
  teamCoursesCompleted: number;
}

/** Loads activities, POCs and team learning for the project details drawer. */
export function useProjectDetails(project: Project | null) {
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!project) {
      setDetails(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);

    Promise.all([activityService.getByProject(project.id), pocService.getAll(), learningService.getAll()])
      .then(([activities, allPocs, allLearning]) => {
        if (cancelled) return;
        const teamIds = new Set(project.members);
        const teamLearning = allLearning.filter((record: LearningRecord) =>
          teamIds.has(record.employeeId)
        );
        const teamLearningProgress = teamLearning.length
          ? Math.round(teamLearning.reduce((sum, r) => sum + r.progress, 0) / teamLearning.length)
          : 0;

        setDetails({
          activities: [...activities].sort((a, b) => b.date.localeCompare(a.date)),
          pocs: allPocs.filter((poc) => poc.projectId === project.id),
          teamLearningProgress,
          teamCoursesCompleted: teamLearning.filter((r) => r.status === "Completed").length,
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [project]);

  return { details, isLoading };
}
