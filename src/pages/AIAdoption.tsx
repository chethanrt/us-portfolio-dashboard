import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  ALL_FILTER,
  AvatarGroup,
  DataTable,
  EmptyState,
  FilterBar,
  FilterSelect,
  KPICard,
  LoadingSkeleton,
  PageHeader,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAIAdoption } from "@/hooks/useAIAdoption";
import type { CategoryBreakdown } from "@/hooks/useAIAdoption";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/security";
import type { Project } from "@/types";

export default function AIAdoption() {
  const { currentUser } = useAuth();
  const { canExport, isOwnDataScope } = usePermission();
  const ownDataOnly = isOwnDataScope("aiAdoption");

  const projectScope = useMemo(() => {
    if (!ownDataOnly) return undefined;
    return (projects: Project[]) => projects.filter((p) => currentUser && p.members.includes(currentUser.id));
  }, [ownDataOnly, currentUser]);

  const { breakdown, totalProjects, projectsUsingAI, categoriesTracked, topCategory, isLoading, error } =
    useAIAdoption(projectScope);

  const [categoryFilter, setCategoryFilter] = useState(ALL_FILTER);
  const selected = breakdown.find((b) => b.category === categoryFilter);

  const columns = useMemo<ColumnDef<CategoryBreakdown>[]>(
    () => [
      { accessorKey: "category", header: "AI Adoption Category" },
      { accessorKey: "projectCount", header: "Projects" },
      {
        id: "percentOfProjects",
        header: "% of Projects",
        cell: ({ row }) => `${row.original.percentOfProjects}%`,
      },
    ],
    []
  );

  const exportCSV = () => {
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const header = ["AI Adoption Category", "Projects", "% of Projects"].map(escape).join(",");
    const lines = breakdown.map((b) => [b.category, b.projectCount, `${b.percentOfProjects}%`].map(escape).join(","));
    const csv = [header, ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ai-adoption-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("AI Adoption report exported as CSV.");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Adoption" description="Track how AI is being adopted across projects and teams" />
        <LoadingSkeleton variant="page" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Adoption" />
        <EmptyState icon={Sparkles} title="Unable to load AI Adoption data" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Adoption"
        description={
          ownDataOnly
            ? "AI adoption across your projects"
            : "Track how AI is being adopted across projects and teams"
        }
        actions={
          canExport("aiAdoption") ? (
            <Button variant="outline" onClick={exportCSV}>
              <Download /> Export
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Projects" value={totalProjects} icon={Sparkles} />
        <KPICard title="Projects Using AI" value={projectsUsingAI} icon={Sparkles} hint={`of ${totalProjects} projects`} />
        <KPICard title="Categories Tracked" value={categoriesTracked} icon={Sparkles} />
        <KPICard title="Top Category" value={topCategory} icon={Sparkles} />
      </div>

      {breakdown.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No AI Adoption Categories"
          description="Add categories in Settings > AI Adoption Categories to start tracking."
        />
      ) : (
        <DataTable columns={columns} data={breakdown} pageSize={10} />
      )}

      {breakdown.length > 0 && (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <FilterBar>
            <FilterSelect
              placeholder="View projects using…"
              options={breakdown.map((b) => b.category)}
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="sm:w-64"
            />
          </FilterBar>

          {!selected ? (
            <p className="text-sm text-muted-foreground">
              Select a category above to see which projects and people use it.
            </p>
          ) : selected.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects use "{selected.category}" yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Projects using {selected.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.projects.map((project) => (
                    <Badge key={project.id} variant="secondary">
                      {project.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">People</p>
                {selected.people.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
                ) : (
                  <AvatarGroup names={selected.people} max={8} />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
