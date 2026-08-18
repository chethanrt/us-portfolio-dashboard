import { Brain, Clock, FolderKanban, GraduationCap, Lightbulb, Plus, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState, KPICard, LoadingSkeleton, PageHeader } from "@/components/common";
import { ActivityTrendChart } from "@/components/dashboard/ActivityTrendChart";
import { LearningProgressWidget } from "@/components/dashboard/LearningProgressWidget";
import { ProjectStatusChart } from "@/components/dashboard/ProjectStatusChart";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { MyTasksWidget, TasksByStatusChart } from "@/components/dashboard/TaskWidgets";
import { ToolUsageChart } from "@/components/dashboard/ToolUsageChart";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { DashboardData } from "@/hooks/useDashboardData";
import { useTaskStats } from "@/hooks/useTaskStats";
import { usePermission } from "@/security";

/** Permission-aware quick actions: hidden without Create permission. */
function QuickActions() {
  const { canCreate } = usePermission();
  const navigate = useNavigate();

  return (
    <>
      {canCreate("activities") && (
        <Button variant="outline" size="sm" onClick={() => navigate("/activities")}>
          <Plus /> Activity
        </Button>
      )}
      {canCreate("projects") && (
        <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
          <Plus /> Project
        </Button>
      )}
      {canCreate("pocs") && (
        <Button variant="outline" size="sm" onClick={() => navigate("/pocs")}>
          <Plus /> POC
        </Button>
      )}
    </>
  );
}

/** KPI row varies by role scope (docs/05 Dashboard Personalization). */
function KPIRow({ data }: { data: DashboardData }) {
  const { scope, kpis } = data;

  if (scope === "personal") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="My Activities" value={kpis.totalActivities} icon={Brain} hint={`${kpis.activitiesThisMonth} this month`} />
        <KPICard title="Hours Saved" value={kpis.hoursSaved.toLocaleString()} icon={Clock} hint="Using AI tools" />
        <KPICard title="Learning" value={`${kpis.learningCompletion}%`} icon={GraduationCap} hint="Average progress" />
        <KPICard title="My POCs" value={kpis.pocCount} icon={Lightbulb} hint="Owned innovations" />
      </div>
    );
  }

  if (scope === "team") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Team Members" value={kpis.totalEmployees} icon={Users} hint="In your scope" />
        <KPICard title="Team Activities" value={kpis.totalActivities} icon={Brain} hint={`${kpis.activitiesThisMonth} this month`} />
        <KPICard title="Learning" value={`${kpis.learningCompletion}%`} icon={GraduationCap} hint="Team average" />
        <KPICard title="Hours Saved" value={kpis.hoursSaved.toLocaleString()} icon={Clock} hint="By your team" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard title="Employees" value={kpis.totalEmployees} icon={Users} hint="Active team members" />
      <KPICard title="Active Projects" value={kpis.activeProjects} icon={FolderKanban} hint={`of ${kpis.totalProjects} total projects`} />
      <KPICard title="AI Adoption" value={`${kpis.aiAdoption}%`} icon={TrendingUp} hint="Portfolio average" />
      <KPICard title="Hours Saved" value={kpis.hoursSaved.toLocaleString()} icon={Clock} hint={`${kpis.activitiesThisMonth} activities this month`} />
    </div>
  );
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { canView } = usePermission();
  const { data, isLoading, error } = useDashboardData();
  const { data: taskStats } = useTaskStats();
  const firstName = currentUser?.name.split(" ")[0] ?? "there";

  if (isLoading || (!data && !error)) {
    return <LoadingSkeleton variant="page" />;
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <EmptyState title="Unable to load dashboard" description={error ?? "No data is available yet."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}`}
        actions={<QuickActions />}
      />

      <KPIRow data={data} />

      {/* Task Board widgets (docs/11 Dashboard Integration) */}
      {canView("tasks") && taskStats && (
        <div className="grid gap-4 lg:grid-cols-2">
          <MyTasksWidget data={taskStats} />
          <TasksByStatusChart data={taskStats} />
        </div>
      )}

      {/* Charts row 1 — widgets respect module View permissions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {canView("activities") && <ActivityTrendChart data={data.trend} />}
        {canView("projects") && <ProjectStatusChart data={data.projectStatus} />}
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {canView("activities") && <ToolUsageChart data={data.toolUsage} />}
        {canView("learning") && <LearningProgressWidget learning={data.learning} />}
      </div>

      {/* Recent activities */}
      {canView("activities") &&
        (data.recentActivities.length > 0 ? (
          <RecentActivities activities={data.recentActivities} />
        ) : (
          <EmptyState
            icon={Brain}
            title="No AI Activities Found"
            description="Logged activities will appear here."
          />
        ))}
    </div>
  );
}
