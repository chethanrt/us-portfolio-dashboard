import { memo } from "react";
import { format, parseISO } from "date-fns";
import { Archive, ArchiveRestore, Bot, CalendarDays, Clock, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task, TaskWorkflowStatus } from "@/types";
import { getInitials } from "@/utils/format";
import { TaskPriorityBadge, TaskProjectBadge, TaskStatusBadge } from "./TaskBadges";

const MAX_VISIBLE_LABELS = 3;

export interface TaskCardActions {
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onArchive: (task: Task) => void;
  onDelete: (task: Task) => void;
}

interface TaskCardProps {
  task: Task;
  assigneeName: string;
  projectName: string | null;
  actions: TaskCardActions;
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  /** Shown in list-like groupings where the column no longer implies status. */
  showStatus?: boolean;
  workflow?: TaskWorkflowStatus[];
  /** Set while the card is the drag source (renders a placeholder look). */
  isDragging?: boolean;
}

function formatDue(date: string): string {
  return format(parseISO(date), "d MMM");
}

function TaskCardInner({
  task,
  assigneeName,
  projectName,
  actions,
  canEdit,
  canDelete,
  canDuplicate,
  showStatus,
  workflow,
  isDragging,
}: TaskCardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = Boolean(task.dueDate) && task.dueDate < today && task.percentComplete < 100;
  const hasMenu = canEdit || canDelete || canDuplicate;

  return (
    <Card
      className={cn(
        "cursor-pointer gap-2 rounded-lg p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-40",
        task.archived && "border-dashed opacity-70"
      )}
      onClick={() => actions.onOpen(task)}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs font-medium text-muted-foreground">{task.taskNumber}</span>
        <div className="flex items-center gap-1">
          {task.archived && (
            <Badge variant="outline" className="border-dashed text-muted-foreground">
              Archived
            </Badge>
          )}
          <TaskPriorityBadge priority={task.priority} />
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-1 size-6"
                  aria-label={`Actions for ${task.taskNumber}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                {canEdit && (
                  <DropdownMenuItem onClick={() => actions.onEdit(task)}>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                )}
                {canDuplicate && (
                  <DropdownMenuItem onClick={() => actions.onDuplicate(task)}>
                    <Copy /> Duplicate
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={() => actions.onArchive(task)}>
                    {task.archived ? (
                      <>
                        <ArchiveRestore /> Restore
                      </>
                    ) : (
                      <>
                        <Archive /> Archive
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => actions.onDelete(task)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <p className="text-sm font-medium leading-snug">{task.title}</p>

      <div className="flex flex-wrap items-center gap-1">
        <TaskProjectBadge projectName={projectName} />
        <Badge variant="outline" className="text-muted-foreground">
          {task.category}
        </Badge>
        {showStatus && workflow && <TaskStatusBadge status={task.status} workflow={workflow} />}
      </div>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {task.labels.slice(0, MAX_VISIBLE_LABELS).map((label) => (
            <Badge key={label} variant="secondary" className="px-1.5 text-[10px]">
              {label}
            </Badge>
          ))}
          {task.labels.length > MAX_VISIBLE_LABELS && (
            <span className="text-[10px] text-muted-foreground">+{task.labels.length - MAX_VISIBLE_LABELS}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Avatar className="size-5" title={assigneeName}>
          <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
            {getInitials(assigneeName)}
          </AvatarFallback>
        </Avatar>
        {task.dueDate && (
          <span
            className={cn("flex items-center gap-1 whitespace-nowrap", isOverdue && "font-medium text-destructive")}
            title={isOverdue ? "Overdue" : "Due date"}
          >
            <CalendarDays className="size-3" /> {formatDue(task.dueDate)}
          </span>
        )}
        {task.estimateHours > 0 && (
          <span className="flex items-center gap-1 whitespace-nowrap" title="Estimate">
            <Clock className="size-3" /> {task.estimateHours}h
          </span>
        )}
        {task.aiTool && (
          <span className="ml-auto flex min-w-0 items-center gap-1" title={`AI tool: ${task.aiTool}`}>
            <Bot className="size-3 shrink-0" />
            <span className="truncate">{task.aiTool}</span>
          </span>
        )}
      </div>
    </Card>
  );
}

/** Memoized — the board re-renders often while dragging (docs/11 performance). */
export const TaskCard = memo(TaskCardInner);
