import { useCallback, useMemo, useState } from "react";
import { KanbanSquare } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmationDialog, DataTable, EmptyState, LoadingSkeleton, PageHeader } from "@/components/common";
import { BoardView } from "@/components/tasks/BoardView";
import { GroupedView } from "@/components/tasks/GroupedView";
import { QuickTaskDialog } from "@/components/tasks/QuickTaskDialog";
import { TaskDetailsDrawer } from "@/components/tasks/TaskDetailsDrawer";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { TaskToolbar } from "@/components/tasks/TaskToolbar";
import type { TaskViewMode } from "@/components/tasks/TaskToolbar";
import { buildTaskListColumns } from "@/components/tasks/taskListColumns";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { usePermission } from "@/security";
import {
  taskBoardService,
  taskExportService,
  taskFilterService,
  taskPermissionService,
  taskSearchService,
  taskWorkflowService,
} from "@/services";
import type { TaskGrouping, TaskGroup } from "@/services/TaskBoardService";
import { ALL, DEFAULT_TASK_FILTERS, SAVED_VIEWS } from "@/services/TaskFilterService";
import type { SavedView, TaskFilters } from "@/services/TaskFilterService";
import type { Task } from "@/types";

type ConfirmAction = { kind: "delete" | "archive" | "restore"; task: Task } | null;

export default function TaskBoard() {
  const data = useTasks();
  const permission = usePermission();
  const { currentUser } = useAuth();
  const [params] = useSearchParams();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TaskFilters>({
    ...DEFAULT_TASK_FILTERS,
    project: params.get("project") ?? ALL,
    assignee: params.get("assignee") ?? ALL,
  });
  const [savedView, setSavedView] = useState<SavedView>(() => {
    const requested = params.get("view");
    return SAVED_VIEWS.find((v) => v === requested) ?? "All Tasks";
  });
  const [grouping, setGrouping] = useState<TaskGrouping>("Status");
  // Mobile defaults to List View (docs/11 responsive behaviour).
  const [view, setView] = useState<TaskViewMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "list" : "board"
  );

  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formDefaultStatus, setFormDefaultStatus] = useState<string | undefined>(undefined);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);

  // Permission-scoped, searched and filtered tasks (docs/11 data scope).
  const visibleTasks = useMemo(() => {
    const scoped = taskPermissionService.scopeTasks(data.tasks, permission, currentUser?.id);
    const viewed = taskFilterService.applySavedView(scoped, savedView, currentUser?.id);
    const filtered = taskFilterService.apply(viewed, {
      ...filters,
      // The Completed/Overdue views must still show archived-flagged tasks they match.
      showArchived: filters.showArchived || savedView === "Completed",
    });
    return taskSearchService.search(filtered, search, data.lookups);
  }, [data.tasks, data.lookups, permission, currentUser, savedView, filters, search]);

  const canEditTask = useCallback(
    (task: Task) => taskPermissionService.canEditTask(task, permission, currentUser?.id),
    [permission, currentUser]
  );
  const canDeleteTask = useCallback(
    (task: Task) => taskPermissionService.canDeleteTask(task, permission, currentUser?.id),
    [permission, currentUser]
  );
  const cardPermissions = useMemo(
    () => ({ canEditTask, canDeleteTask, canDuplicate: permission.canCreate("tasks") }),
    [canEditTask, canDeleteTask, permission]
  );

  const assignableEmployees = useMemo(
    () => taskPermissionService.assigneeOptions(data.employees, permission, currentUser),
    [data.employees, permission, currentUser]
  );
  const activityOptions = useMemo(
    () =>
      data.activities
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 60)
        .map((a) => ({ value: a.id, label: `${a.tool} · ${a.promptSummary.slice(0, 50)}` })),
    [data.activities]
  );
  const labelOptions = useMemo(
    () => [...new Set(data.tasks.flatMap((t) => t.labels))].sort(),
    [data.tasks]
  );

  const drawerTask = drawerTaskId ? data.tasks.find((t) => t.id === drawerTaskId) ?? null : null;
  const defaultStatus = data.workflow.length
    ? taskWorkflowService.getDefaultStatus(data.workflow).name
    : "To Do";

  const cardActions = useMemo(
    () => ({
      onOpen: (task: Task) => setDrawerTaskId(task.id),
      onEdit: (task: Task) => {
        setEditing(task);
        setFormOpen(true);
      },
      onDuplicate: (task: Task) => {
        data.duplicateTask(task.id).then(
          () => toast.success("Task duplicated into " + defaultStatus + "."),
          () => toast.error("Unable to duplicate. Please try again.")
        );
      },
      onArchive: (task: Task) => setConfirm({ kind: task.archived ? "restore" : "archive", task }),
      onDelete: (task: Task) => setConfirm({ kind: "delete", task }),
    }),
    [data, defaultStatus]
  );

  const handleDrop = async (movedTaskId: string, targetStatus: string, columns: TaskGroup[]) => {
    try {
      const transition = taskWorkflowService.getTransitionChanges(data.workflow, targetStatus);
      const changes = taskBoardService.computeDropChanges(columns, movedTaskId, transition);
      await data.applyChanges(changes);
      toast.success(`Task moved to ${targetStatus}.`);
    } catch {
      toast.error("Unable to move the task. Please try again.");
    }
  };

  const handleSave = async (values: Omit<Task, "id" | "taskNumber" | "createdDate" | "updatedDate">) => {
    try {
      if (editing) {
        await data.updateTask(editing.id, values);
        toast.success("Task updated successfully.");
      } else {
        const created = await data.addTask(values);
        toast.success(`${created.taskNumber} created successfully.`);
      }
    } catch {
      toast.error("Unable to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { kind, task } = confirm;
    try {
      if (kind === "delete") {
        await data.deleteTask(task.id);
        if (drawerTaskId === task.id) setDrawerTaskId(null);
        toast.success("Task deleted successfully.");
      } else {
        await data.setArchived(task.id, kind === "archive");
        toast.success(kind === "archive" ? "Task archived." : "Task restored.");
      }
    } catch {
      toast.error("Unable to complete the action. Please try again.");
    } finally {
      setConfirm(null);
    }
  };

  const handleStatusChange = async (task: Task, status: string) => {
    try {
      await data.updateTask(task.id, taskWorkflowService.getTransitionChanges(data.workflow, status));
      toast.success(`Task moved to ${status}.`);
    } catch {
      toast.error("Unable to update the status. Please try again.");
    }
  };

  const listColumns = useMemo(
    () =>
      buildTaskListColumns({
        lookups: data.lookups,
        workflow: data.workflow,
        onOpen: cardActions.onOpen,
        onEdit: cardActions.onEdit,
        onDelete: cardActions.onDelete,
        canEdit: canEditTask,
        canDelete: canDeleteTask,
        isFieldVisible: (field) => permission.canViewField("tasks", field),
      }),
    [data.lookups, data.workflow, cardActions, canEditTask, canDeleteTask, permission]
  );

  if (data.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Task Board" description="Plan, assign and track engineering work" />
        <LoadingSkeleton variant="cards" count={6} className="lg:grid-cols-3" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Task Board" />
        <EmptyState icon={KanbanSquare} title="Unable to load the task board" description={data.error} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Task Board"
        description={`${visibleTasks.length} tasks in view · project and standalone work`}
      />

      <TaskToolbar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        savedView={savedView}
        onSavedViewChange={setSavedView}
        grouping={grouping}
        onGroupingChange={setGrouping}
        view={view}
        onViewChange={setView}
        projects={data.projects}
        categories={data.categories}
        workflow={data.workflow}
        employees={data.employees}
        aiTools={data.aiTools}
        labels={labelOptions}
        canCreate={permission.canCreate("tasks")}
        canExport={permission.canExport("tasks")}
        onQuickTask={() => setQuickOpen(true)}
        onNewTask={() => {
          setEditing(null);
          setFormDefaultStatus(undefined);
          setFormOpen(true);
        }}
        onExport={() => {
          taskExportService.download(visibleTasks, data.lookups);
          toast.success("Tasks exported as CSV.");
        }}
      />

      {visibleTasks.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="No Tasks Found"
          description="No tasks match the current view, search and filters."
          actionLabel={permission.canCreate("tasks") ? "Add Task" : undefined}
          onAction={permission.canCreate("tasks") ? () => setQuickOpen(true) : undefined}
        />
      ) : view === "list" ? (
        <DataTable columns={listColumns} data={visibleTasks} pageSize={12} />
      ) : grouping === "Status" ? (
        <BoardView
          tasks={visibleTasks}
          workflow={data.workflow}
          lookups={data.lookups}
          actions={cardActions}
          permissions={cardPermissions}
          canCreate={permission.canCreate("tasks")}
          onAddTask={(status) => {
            setEditing(null);
            setFormDefaultStatus(status);
            setFormOpen(true);
          }}
          onDrop={handleDrop}
          dragDisabled={!permission.canEdit("tasks")}
        />
      ) : (
        <GroupedView
          groups={taskBoardService.group(visibleTasks, grouping, data.workflow, data.lookups)}
          workflow={data.workflow}
          lookups={data.lookups}
          actions={cardActions}
          permissions={cardPermissions}
        />
      )}

      <TaskDetailsDrawer
        task={drawerTask}
        lookups={data.lookups}
        workflow={data.workflow}
        activities={data.activities}
        pocs={data.pocs}
        canEdit={drawerTask ? canEditTask(drawerTask) : false}
        canDelete={drawerTask ? canDeleteTask(drawerTask) : false}
        canDuplicate={permission.canCreate("tasks")}
        canComment={taskPermissionService.canComment(permission)}
        onClose={() => setDrawerTaskId(null)}
        onEdit={(task) => {
          setDrawerTaskId(null);
          cardActions.onEdit(task);
        }}
        onDuplicate={cardActions.onDuplicate}
        onArchive={cardActions.onArchive}
        onDelete={cardActions.onDelete}
        onStatusChange={handleStatusChange}
        onAddComment={async (task, message) => {
          await data.addComment(task.id, message);
          toast.success("Comment added.");
        }}
      />

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        employees={assignableEmployees}
        projects={data.projects}
        categories={data.categories}
        workflow={data.workflow}
        pocs={data.pocs}
        activityOptions={activityOptions}
        aiTools={data.aiTools}
        defaultProjectId={filters.project !== ALL && filters.project !== "standalone" ? filters.project : null}
        defaultStatus={formDefaultStatus ?? defaultStatus}
        reporterId={data.actorId}
        onSave={handleSave}
      />

      <QuickTaskDialog
        open={quickOpen}
        onOpenChange={setQuickOpen}
        employees={assignableEmployees}
        projects={data.projects}
        categories={data.categories}
        defaultStatus={defaultStatus}
        reporterId={data.actorId}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        onConfirm={handleConfirm}
        message={
          confirm
            ? confirm.kind === "delete"
              ? `Are you sure you want to delete ${confirm.task.taskNumber}? This cannot be undone.`
              : confirm.kind === "archive"
                ? `Archive ${confirm.task.taskNumber}? It will disappear from the board but stays searchable.`
                : `Restore ${confirm.task.taskNumber} to the board?`
            : "Are you sure?"
        }
      />
    </div>
  );
}
