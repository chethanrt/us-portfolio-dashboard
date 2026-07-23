import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  ALL_FILTER,
  ConfirmationDialog,
  EmptyState,
  FilterBar,
  FilterSelect,
  LoadingSkeleton,
  PageHeader,
  SearchBar,
} from "@/components/common";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectDetailsDrawer } from "@/components/projects/ProjectDetailsDrawer";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { usePermission } from "@/security";
import { settingsService } from "@/services";
import type { Project } from "@/types";

export default function Projects() {
  const { projects, employees, employeesById, isLoading, error, addProject, updateProject, deleteProject } =
    useProjects();
  const { currentUser } = useAuth();
  const { canCreate, canEdit, canDelete, getEditScope } = usePermission();

  // Projects have no employee owner — "own" edit scope means "I manage it".
  const canEditProject = (project: Project) =>
    canEdit("projects") && (getEditScope("projects") !== "own" || project.manager === currentUser?.name);
  const canDeleteProject = (project: Project) =>
    canDelete("projects") && (getEditScope("projects") !== "own" || project.manager === currentUser?.name);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [stageFilter, setStageFilter] = useState(ALL_FILTER);
  const [technologyFilter, setTechnologyFilter] = useState(ALL_FILTER);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [stageOptions, setStageOptions] = useState<string[]>([]);

  useEffect(() => {
    settingsService.getSettings().then((settings) => {
      setStatusOptions(settings.statusValues.project);
      setStageOptions(settings.projectStages);
    });
  }, []);

  const technologyOptions = useMemo(
    () => [...new Set(projects.map((p) => p.technology))].sort(),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (statusFilter !== ALL_FILTER && project.status !== statusFilter) return false;
      if (stageFilter !== ALL_FILTER && project.stage !== stageFilter) return false;
      if (technologyFilter !== ALL_FILTER && project.technology !== technologyFilter) return false;
      if (!query) return true;
      return [project.name, project.client, project.technology, project.manager, project.techLead]
        .some((field) => field.toLowerCase().includes(query));
    });
  }, [projects, search, statusFilter, stageFilter, technologyFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(ALL_FILTER);
    setStageFilter(ALL_FILTER);
    setTechnologyFilter(ALL_FILTER);
  };

  const handleSave = async (values: Omit<Project, "id">) => {
    try {
      if (editing) {
        await updateProject(editing.id, values);
        toast.success("Project updated successfully.");
      } else {
        await addProject(values);
        toast.success("Project created successfully.");
      }
    } catch {
      toast.error("Unable to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProject(deleting.id);
      toast.success("Project deleted successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message === "REFERENCED"
          ? "Cannot delete — this project has linked activities or POCs."
          : "Unable to delete. Please try again."
      );
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Projects" description="Portfolio projects with AI adoption, stages and teams" />
        <LoadingSkeleton variant="cards" count={6} className="lg:grid-cols-3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Projects" />
        <EmptyState icon={FolderKanban} title="Unable to load projects" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={`${projects.length} portfolio projects`}
        actions={
          canCreate("projects") ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Add Project
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search projects…"
          className="w-full sm:w-64"
        />
        <FilterSelect placeholder="Status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <FilterSelect placeholder="Stage" options={stageOptions} value={stageFilter} onChange={setStageFilter} />
        <FilterSelect placeholder="Technology" options={technologyOptions} value={technologyFilter} onChange={setTechnologyFilter} />
      </FilterBar>

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Projects Available"
          description="No projects match the current search and filters."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              employeesById={employeesById}
              canEdit={canEditProject(project)}
              canDelete={canDeleteProject(project)}
              onViewDetails={setSelectedProject}
              onEdit={(p) => {
                setEditing(p);
                setFormOpen(true);
              }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <ProjectDetailsDrawer
        project={selectedProject}
        employeesById={employeesById}
        onClose={() => setSelectedProject(null)}
      />

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editing}
        projects={projects}
        employees={employees}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
        message={
          deleting
            ? `Are you sure you want to delete "${deleting.name}"? This cannot be undone.`
            : "Are you sure you want to delete this record?"
        }
      />
    </div>
  );
}
