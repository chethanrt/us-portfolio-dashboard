import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/security";
import { taskService, taskStatisticsService, taskWorkflowService, taskPermissionService } from "@/services";
import type { MyTaskStats, TaskOverviewStats } from "@/services/TaskStatisticsService";
import type { Task, TaskWorkflowStatus } from "@/types";

export interface TaskDashboardData {
  overview: TaskOverviewStats;
  my: MyTaskStats;
  recent: Task[];
  workflow: TaskWorkflowStatus[];
}

/** Task statistics for dashboard widgets, respecting the tasks view scope. */
export function useTaskStats() {
  const { currentUser } = useAuth();
  const permission = usePermission();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workflow, setWorkflow] = useState<TaskWorkflowStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([taskService.getAll(), taskWorkflowService.getWorkflow()])
      .then(([allTasks, flow]) => {
        if (cancelled) return;
        setTasks(allTasks);
        setWorkflow(flow);
      })
      .catch(() => {
        // widgets simply stay empty when tasks fail to load
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo<TaskDashboardData | null>(() => {
    if (!workflow.length) return null;
    const scoped = taskPermissionService.scopeTasks(tasks, permission, currentUser?.id);
    return {
      overview: taskStatisticsService.overview(scoped, workflow),
      my: taskStatisticsService.myTasks(tasks, currentUser?.id),
      recent: taskStatisticsService.recent(scoped, 4),
      workflow,
    };
  }, [tasks, workflow, permission, currentUser]);

  return { data, isLoading };
}
