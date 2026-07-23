import { useState } from "react";
import { Archive, ArchiveRestore, Bot, Copy, Loader2, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Drawer, ProgressBar } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { usePermission } from "@/security";
import type { TaskLookups } from "@/services/TaskFilterService";
import type { Activity, POC, Task, TaskWorkflowStatus } from "@/types";
import { formatDate, getInitials } from "@/utils/format";
import { TaskPriorityBadge, TaskProjectBadge, TaskStatusBadge } from "./TaskBadges";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

interface TaskDetailsDrawerProps {
  task: Task | null;
  lookups: TaskLookups;
  workflow: TaskWorkflowStatus[];
  activities: Activity[];
  pocs: POC[];
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  canComment: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onArchive: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: string) => void;
  onAddComment: (task: Task, message: string) => Promise<void>;
}

/** Right-side task drawer (docs/11): overview, assignment, scheduling, AI info, comments. */
export function TaskDetailsDrawer(props: TaskDetailsDrawerProps) {
  const { task, lookups, workflow } = props;
  const { canViewField } = usePermission();
  const [comment, setComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  if (!task) return null;
  const show = (field: string) => canViewField("tasks", field);
  const name = (id: string) => lookups.employeesById.get(id)?.name ?? "Unknown";
  const projectName = task.projectId ? lookups.projectsById.get(task.projectId)?.name ?? null : null;
  const linkedActivity = task.linkedActivityId
    ? props.activities.find((a) => a.id === task.linkedActivityId)
    : undefined;
  const linkedPoc = task.linkedPocId ? props.pocs.find((p) => p.id === task.linkedPocId) : undefined;

  const postComment = async () => {
    const message = comment.trim();
    if (!message) return;
    setIsPosting(true);
    try {
      await props.onAddComment(task, message);
      setComment("");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Drawer
      open={Boolean(task)}
      onOpenChange={(open) => !open && props.onClose()}
      title={
        <span className="flex items-center gap-2">
          {task.taskNumber}
          <TaskPriorityBadge priority={task.priority} />
          {task.archived && (
            <Badge variant="outline" className="border-dashed text-muted-foreground">
              Archived
            </Badge>
          )}
        </span>
      }
      description={task.title}
    >
      {/* Actions + inline status change */}
      <div className="flex flex-wrap items-center gap-2">
        {props.canEdit ? (
          <Select value={task.status} onValueChange={(status) => props.onStatusChange(task, status)}>
            <SelectTrigger size="sm" className="w-40" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workflow.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <TaskStatusBadge status={task.status} workflow={workflow} />
        )}
        <div className="ml-auto flex gap-1">
          {props.canEdit && (
            <Button variant="outline" size="sm" onClick={() => props.onEdit(task)}>
              <Pencil /> Edit
            </Button>
          )}
          {props.canDuplicate && (
            <Button variant="outline" size="icon" aria-label="Duplicate task" onClick={() => props.onDuplicate(task)}>
              <Copy className="size-4" />
            </Button>
          )}
          {props.canEdit && (
            <Button
              variant="outline"
              size="icon"
              aria-label={task.archived ? "Restore task" : "Archive task"}
              onClick={() => props.onArchive(task)}
            >
              {task.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
            </Button>
          )}
          {props.canDelete && (
            <Button
              variant="outline"
              size="icon"
              aria-label="Delete task"
              className="text-destructive hover:text-destructive"
              onClick={() => props.onDelete(task)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {show("description") && task.description && (
        <p className="text-sm text-muted-foreground">{task.description}</p>
      )}
      <ProgressBar label="Completion" value={task.percentComplete} />
      <Separator />

      {/* Project & type */}
      <div className="space-y-2">
        {show("type") && <InfoRow label="Task Type" value={task.type} />}
        {show("projectId") && (
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Project</span>
            <TaskProjectBadge projectName={projectName} />
          </div>
        )}
        {show("category") && <InfoRow label="Category" value={task.category} />}
      </div>
      <Separator />

      {/* Assignment */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Assignment</h4>
        {show("assigneeId") && <InfoRow label="Assignee" value={name(task.assigneeId)} />}
        {show("reporterId") && <InfoRow label="Reporter" value={name(task.reporterId)} />}
        <InfoRow label="Created By" value={name(task.createdBy)} />
        <InfoRow label="Last Modified By" value={name(task.lastModifiedBy)} />
      </section>
      <Separator />

      {/* Scheduling */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Scheduling</h4>
        {show("estimateHours") && <InfoRow label="Estimate" value={task.estimateHours ? `${task.estimateHours}h` : "—"} />}
        {show("actualHours") && <InfoRow label="Actual Hours" value={task.actualHours ? `${task.actualHours}h` : "—"} />}
        {show("startDate") && <InfoRow label="Start Date" value={task.startDate ? formatDate(task.startDate) : "—"} />}
        {show("dueDate") && <InfoRow label="Due Date" value={task.dueDate ? formatDate(task.dueDate) : "—"} />}
        {show("completedDate") && (
          <InfoRow label="Completed Date" value={task.completedDate ? formatDate(task.completedDate) : "—"} />
        )}
      </section>
      <Separator />

      {/* AI information */}
      {(show("aiTool") || show("linkedActivityId") || show("linkedPocId")) && (
        <>
          <section className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="size-4 text-primary" /> AI Information
            </h4>
            {show("aiTool") && <InfoRow label="AI Tool" value={task.aiTool || "—"} />}
            {show("linkedActivityId") &&
              (linkedActivity ? (
                <div className="rounded-lg border p-2.5">
                  <p className="truncate text-sm font-medium" title={linkedActivity.promptSummary}>
                    {linkedActivity.promptSummary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {linkedActivity.tool} · {formatDate(linkedActivity.date)} · {linkedActivity.hoursSaved}h saved
                  </p>
                </div>
              ) : (
                <InfoRow label="Linked AI Activity" value="—" />
              ))}
            {show("linkedPocId") && <InfoRow label="Linked POC" value={linkedPoc ? linkedPoc.title : "—"} />}
          </section>
          <Separator />
        </>
      )}

      {/* Labels */}
      {show("labels") && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <Badge key={label} variant="secondary">
              {label}
            </Badge>
          ))}
        </div>
      )}

      {/* Attachments */}
      <section className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Paperclip className="size-4 text-primary" /> Attachments ({task.attachments.length})
        </h4>
        {task.attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attachments.</p>
        ) : (
          task.attachments.map((file) => (
            <div key={file.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
              <span className="truncate font-medium">{file.fileName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {file.fileSize} · {name(file.uploadedBy)} · {formatDate(file.uploadDate)}
              </span>
            </div>
          ))
        )}
      </section>
      <Separator />

      {/* Comments — newest first */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Comments ({task.comments.length})</h4>
        {props.canComment && (
          <div className="space-y-2">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add a comment…"
              rows={2}
              maxLength={1000}
            />
            <div className="flex justify-end">
              <Button size="sm" disabled={isPosting || !comment.trim()} onClick={postComment}>
                {isPosting && <Loader2 className="animate-spin" />}
                Comment
              </Button>
            </div>
          </div>
        )}
        {task.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          [...task.comments].reverse().map((entry) => (
            <div key={entry.id} className="flex gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                  {getInitials(name(entry.authorId))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-lg border p-2.5">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{name(entry.authorId)}</span> · {formatDate(entry.date)}
                </p>
                <p className="mt-1 text-sm">{entry.message}</p>
              </div>
            </div>
          ))
        )}
      </section>

      {/* History */}
      <Separator />
      <div className="space-y-2">
        <InfoRow label="Created" value={formatDate(task.createdDate)} />
        <InfoRow label="Updated" value={formatDate(task.updatedDate)} />
      </div>
    </Drawer>
  );
}
