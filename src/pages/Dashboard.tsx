import { Brain, Clock, FolderKanban, GraduationCap, Lightbulb, Plus, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState, KPICard, LoadingSkeleton, PageHeader } from "@/components/common";
import { ActivityTrendChart } from "@/components/dashboard/ActivityTrendChart";
import { LearningProgressWidget } from "@/components/dashboard/LearningProgressWidget";
import { ProjectStatusChart } from "@/components/dashboard/ProjectStatusChart";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { ToolUsageChart } from "@/components/dashboard/ToolUsageChart";
import { TopContributors } from "@/components/dashboard/TopContributors";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { DashboardData } from "@/hooks/useDashboardData";
import { canAddOwnRecords, canCreatePOC, canManageProjects } from "@/utils/permissions";

/** Role-aware quick actions (docs/05): disabled actions are hidden here. */
function QuickActions() {
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {canAddOwnRecords(role) && (
        <Button variant="outline" size="sm" onClick={() => navigate("/activities")}>
          <Plus /> Activity
        </Button>
      )}
      {canManageProjects(role) && (
        <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
          <Plus /> Project
        </Button>
      )}
      {canCreatePOC(role) && (
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
  const { currentUser, role } = useAuth();
  const { data, isLoading, error } = useDashboardData();
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

  const scopeLabel =
    data.scope === "portfolio" ? "Portfolio overview" : data.scope === "team" ? "Team overview" : "Your personal overview";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName} — ${scopeLabel} (${role})`}
        actions={<QuickActions />}
      />

      <KPIRow data={data} />

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityTrendChart data={data.trend} />
        <ProjectStatusChart data={data.projectStatus} />
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ToolUsageChart data={data.toolUsage} />
        <LearningProgressWidget learning={data.learning} />
      </div>

      {/* Lists row — Top Contributors is hidden for the personal scope */}
      <div className="grid gap-4 lg:grid-cols-2">
        {data.recentActivities.length > 0 ? (
          <RecentActivities activities={data.recentActivities} />
        ) : (
          <EmptyState
            icon={Brain}
            title="No AI Activities Found"
            description="Logged activities will appear here."
          />
        )}
        {data.scope !== "personal" && <TopContributors contributors={data.topContributors} />}
      </div>
    </div>
  );
}
