import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  activityService,
  employeeService,
  pocService,
  projectService,
  settingsService,
  taskService,
  taskWorkflowService,
} from "@/services";
import type { TaskLookups } from "@/services/TaskFilterService";
import type {
  Activity,
  Employee,
  POC,
  Project,
  Task,
  TaskCategory,
  TaskComment,
  TaskWorkflowStatus,
} from "@/types";

/**
 * Loads everything the Task Board needs (tasks + configuration + lookup
 * data) and exposes CRUD, drag-and-drop persistence and comments.
 * The current user's account drives audit fields (createdBy, lastModifiedBy).
 */
export function useTasks() {
  const { currentUser, account } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workflow, setWorkflow] = useState<TaskWorkflowStatus[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pocs, setPOCs] = useState<POC[]>([]);
  const [aiTools, setAITools] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The employee performing changes; Super Admin has no employee link.
  const actorId = currentUser?.id ?? account?.id ?? "system";

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      taskService.getAll(),
      taskWorkflowService.getWorkflow(),
      taskWorkflowService.getCategories(),
      employeeService.getAll(),
      projectService.getAll(),
      activityService.getAll(),
      pocService.getAll(),
      settingsService.getSettings(),
    ])
      .then(([allTasks, flow, cats, emps, projs, acts, allPocs, settings]) => {
        if (cancelled) return;
        setTasks(allTasks);
        setWorkflow(flow);
        setCategories(cats);
        setEmployees(emps);
        setProjects(projs);
        setActivities(acts);
        setPOCs(allPocs);
        setAITools(settings.aiTools);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load the task board.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const lookups = useMemo<TaskLookups>(
    () => ({
      employeesById: new Map(employees.map((e) => [e.id, e])),
      projectsById: new Map(projects.map((p) => [p.id, p])),
    }),
    [employees, projects]
  );

  const addTask = useCallback(
    async (input: Omit<Task, "id" | "taskNumber" | "createdDate" | "updatedDate">) => {
      const created = await taskService.create(input);
      setTasks((current) => [...current, created]);
      return created;
    },
    []
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<Omit<Task, "id" | "taskNumber">>) => {
      const updated = await taskService.update(id, changes, actorId);
      setTasks((current) => current.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    [actorId]
  );

  /** Batch persistence for drag-and-drop (status + displayOrder). */
  const applyChanges = useCallback(
    async (changes: Map<string, Partial<Task>>) => {
      const all = await taskService.updateMany(changes, actorId);
      setTasks(all);
    },
    [actorId]
  );

  const deleteTask = useCallback(async (id: string) => {
    await taskService.delete(id);
    setTasks((current) => current.filter((t) => t.id !== id));
  }, []);

  const duplicateTask = useCallback(
    async (id: string) => {
      const defaultStatus = taskWorkflowService.getDefaultStatus(workflow).name;
      const created = await taskService.duplicate(id, actorId, defaultStatus);
      setTasks((current) => [...current, created]);
      return created;
    },
    [actorId, workflow]
  );

  const setArchived = useCallback(
    async (id: string, archived: boolean) => {
      const updated = await taskService.setArchived(id, archived, actorId);
      setTasks((current) => current.map((t) => (t.id === id ? updated : t)));
    },
    [actorId]
  );

  const addComment = useCallback(
    async (id: string, message: string) => {
      const comment: Omit<TaskComment, "id"> = {
        authorId: actorId,
        date: new Date().toISOString().slice(0, 10),
        message,
      };
      const updated = await taskService.addComment(id, comment, actorId);
      setTasks((current) => current.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    [actorId]
  );

  return {
    tasks,
    workflow,
    categories,
    employees,
    projects,
    activities,
    pocs,
    aiTools,
    lookups,
    isLoading,
    error,
    actorId,
    addTask,
    updateTask,
    applyChanges,
    deleteTask,
    duplicateTask,
    setArchived,
    addComment,
  };
}
