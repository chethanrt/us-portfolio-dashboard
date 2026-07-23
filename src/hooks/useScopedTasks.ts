import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/security";
import { taskPermissionService, taskService, taskWorkflowService } from "@/services";
import type { Task, TaskWorkflowStatus } from "@/types";

/**
 * Tasks visible to the signed-in user (permission view scope applied),
 * used by the Projects and People drawer integrations.
 */
export function useScopedTasks(enabled: boolean) {
  const { currentUser } = useAuth();
  const permission = usePermission();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workflow, setWorkflow] = useState<TaskWorkflowStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    Promise.all([taskService.getAll(), taskWorkflowService.getWorkflow()])
      .then(([allTasks, flow]) => {
        if (cancelled) return;
        setTasks(allTasks);
        setWorkflow(flow);
      })
      .catch(() => {
        // sections simply render empty when tasks fail to load
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const scopedTasks = useMemo(
    () => taskPermissionService.scopeTasks(tasks, permission, currentUser?.id),
    [tasks, permission, currentUser]
  );

  return { tasks: scopedTasks, workflow, isLoading };
}
