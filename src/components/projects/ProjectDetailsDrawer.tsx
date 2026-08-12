import { Brain, GraduationCap, KanbanSquare, Lightbulb, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, LoadingSkeleton, ProgressBar, StatusBadge } from "@/components/common";
import { TaskStatusBadge } from "@/components/tasks/TaskBadges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useScopedTasks } from "@/hooks/useScopedTasks";
import { usePermission } from "@/security";
import type { Employee, Project } from "@/types";
import { formatDate, getInitials } from "@/utils/format";

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h4>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

interface ProjectDetailsDrawerProps {
  project: Project | null;
  employeesById: Map<string, Employee>;
  onClose: () => void;
}

export function ProjectDetailsDrawer({ project, employeesById, onClose }: ProjectDetailsDrawerProps) {
  const { details, isLoading } = useProjectDetails(project);
  const navigate = useNavigate();
  // Field-level security: hidden fields are omitted from the drawer.
  const { canViewField, canView } = usePermission();
  const show = (field: string) => canViewField("projects", field);

  // Task Board integration (docs/11): project tasks only, never standalone.
  const showTasks = canView("tasks");
  const { tasks, workflow } = useScopedTasks(showTasks && Boolean(project));
  const projectTasks = project
    ? tasks.filter((task) => task.projectId === project.id && !task.archived)
    : [];

  if (!project) return null;

  const team = project.members
    .map((id) => employeesById.get(id))
    .filter((e): e is Employee => Boolean(e));
  const totalHoursSaved = details?.activities.reduce((sum, a) => sum + a.hoursSaved, 0) ?? 0;

  return (
    <Drawer
      open={Boolean(project)}
      onOpenChange={(open) => !open && onClose()}
      title={
        <span className="flex items-center gap-2">
          {project.name}
          <StatusBadge status={project.status} />
        </span>
      }
      description={show("client") ? `${project.client} · ${project.program}` : project.program}
    >
      {/* Project information — fields respect field-level security */}
      <div className="space-y-2">
        {show("technology") && <InfoRow label="Technology" value={project.technology.join(", ")} />}
        {show("stage") && <InfoRow label="Current Stage" value={project.stage} />}
        {show("manager") && <InfoRow label="Manager" value={project.manager} />}
        {show("techLead") && <InfoRow label="Tech Lead" value={project.techLead} />}
        {show("startDate") && <InfoRow label="Start Date" value={formatDate(project.startDate)} />}
        {show("endDate") && <InfoRow label="End Date" value={formatDate(project.endDate)} />}
      </div>
      {show("aiAdoption") && <ProgressBar label="AI Adoption" value={project.aiAdoption} />}
      <Separator />

      {/* Assigned team */}
      <Section icon={<Users className="size-4 text-primary" />} title={`Team (${team.length})`}>
        <ul className="space-y-2">
          {team.map((member) => (
            <li key={member.id} className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.role}</p>
              </div>
              <Badge variant="secondary" className="text-xs">{member.primarySkill}</Badge>
            </li>
          ))}
        </ul>
      </Section>
      <Separator />

      {/* Tasks (Task Board integration) */}
      {showTasks && (
        <>
          <Section icon={<KanbanSquare className="size-4 text-primary" />} title={`Tasks (${projectTasks.length})`}>
            {projectTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks linked to this project yet.</p>
            ) : (
              <ul className="space-y-2">
                {projectTasks.slice(0, 5).map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.taskNumber} · {employeesById.get(task.assigneeId)?.name ?? "Unknown"}
                      </p>
                    </div>
                    <TaskStatusBadge status={task.status} workflow={workflow} />
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/tasks?project=${project.id}`)}
            >
              View on Task Board
            </Button>
          </Section>
          <Separator />
        </>
      )}

      {isLoading || !details ? (
        <LoadingSkeleton variant="list" count={3} />
      ) : (
        <>
          {/* AI activities */}
          <Section
            icon={<Brain className="size-4 text-primary" />}
            title={`AI Activities (${details.activities.length})`}
          >
            <p className="text-sm text-muted-foreground">
              {totalHoursSaved.toFixed(1)} hours saved on this project.
            </p>
            {details.activities.length > 0 && (
              <ul className="space-y-2">
                {details.activities.slice(0, 5).map((activity) => (
                  <li key={activity.id} className="rounded-lg border p-2.5">
                    <p className="truncate text-sm font-medium">{activity.promptSummary}</p>
                    <p className="text-xs text-muted-foreground">
                      {employeesById.get(activity.employeeId)?.name ?? "Unknown"} · {activity.tool} ·{" "}
                      {formatDate(activity.date)} · {activity.hoursSaved}h saved
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Separator />

          {/* POCs */}
          <Section
            icon={<Lightbulb className="size-4 text-primary" />}
            title={`POCs (${details.pocs.length})`}
          >
            {details.pocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No POCs linked to this project yet.</p>
            ) : (
              <ul className="space-y-2">
                {details.pocs.map((poc) => (
                  <li key={poc.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                    <span className="truncate text-sm font-medium">{poc.title}</span>
                    <StatusBadge status={poc.status} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Separator />

          {/* Learning summary */}
          <Section icon={<GraduationCap className="size-4 text-primary" />} title="Team Learning">
            <ProgressBar label="Average progress" value={details.teamLearningProgress} />
            <p className="text-sm text-muted-foreground">
              {details.teamCoursesCompleted} course{details.teamCoursesCompleted === 1 ? "" : "s"}{" "}
              completed by the team.
            </p>
          </Section>
        </>
      )}
    </Drawer>
  );
}
