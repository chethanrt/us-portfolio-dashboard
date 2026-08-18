import { Building2, Layers, Pencil, Trash2, User, Wrench } from "lucide-react";
import { AvatarGroup, ProgressBar, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { usePermission } from "@/security";
import type { Employee, Project } from "@/types";
import { getProjectTeam } from "@/utils/employeeAssignments";

interface ProjectCardProps {
  project: Project;
  employeesById: Map<string, Employee>;
  /** Whether the signed-in user can edit this project. */
  canEdit: boolean;
  /** Whether the signed-in user can delete this project. */
  canDelete: boolean;
  onViewDetails: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({
  project,
  employeesById,
  canEdit,
  canDelete,
  onViewDetails,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const { canViewField } = usePermission();
  // Manager, Tech Lead, Project Manager and Team Members shown as one team.
  const teamNames = getProjectTeam(project, employeesById).map((e) => e.name);

  return (
    <Card className="flex flex-col shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{project.name}</h3>
          {canViewField("projects", "client") && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="size-3.5" aria-hidden="true" />
              {project.client}
            </p>
          )}
        </div>
        <StatusBadge status={project.status} />
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {canViewField("projects", "aiAdoption") && (
          <ProgressBar label="AI Adoption" value={project.aiAdoption} />
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {canViewField("projects", "stage") && (
            <div className="flex items-center gap-1.5">
              <Layers className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="sr-only">Stage</dt>
              <dd className="truncate">{project.stage}</dd>
            </div>
          )}
          {canViewField("projects", "technology") && (
            <div className="flex items-center gap-1.5">
              <Wrench className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="sr-only">Technology</dt>
              <dd className="truncate">{project.technology.join(", ")}</dd>
            </div>
          )}
          {canViewField("projects", "manager") && (
            <div className="flex items-center gap-1.5">
              <User className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="sr-only">Manager</dt>
              <dd className="truncate" title={`Manager: ${project.manager}`}>{project.manager}</dd>
            </div>
          )}
          {canViewField("projects", "techLead") && (
            <div className="flex items-center gap-1.5">
              <User className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="sr-only">Tech Lead</dt>
              <dd className="truncate" title={`Tech Lead: ${project.techLead}`}>{project.techLead}</dd>
            </div>
          )}
          {canViewField("projects", "projectManager") && project.projectManager && (
            <div className="flex items-center gap-1.5">
              <User className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="sr-only">Project Manager</dt>
              <dd className="truncate" title={`Project Manager: ${project.projectManager}`}>
                {project.projectManager}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AvatarGroup names={teamNames} />
          <span className="text-xs text-muted-foreground">
            {teamNames.length} member{teamNames.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(project)}>
            View Details
          </Button>
          {canEdit && (
            <Button variant="ghost" size="icon" aria-label={`Edit ${project.name}`} onClick={() => onEdit(project)}>
              <Pencil className="size-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${project.name}`}
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(project)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
