import { useMemo } from "react";
import { Users } from "lucide-react";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common";
import { TeamCalendar } from "@/components/people/TeamCalendar";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/useEmployees";
import { usePermission } from "@/security";

/** Team calendar as its own top-level page (moved out of People > Calendar). */
export default function CalendarPage() {
  const { employees, isLoading, error } = useEmployees();
  const { currentUser } = useAuth();
  const { isOwnDataScope } = usePermission();
  const ownDataOnly = isOwnDataScope("people");

  // Own-data view scope: see only your own calendar.
  const visibleEmployees = useMemo(
    () => (ownDataOnly ? employees.filter((e) => e.id === currentUser?.id) : employees),
    [employees, ownDataOnly, currentUser]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Calendar" description="Team schedules and blocked time" />
        <LoadingSkeleton variant="list" count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Calendar" />
        <EmptyState icon={Users} title="Unable to load the calendar" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description={
          ownDataOnly ? "Your schedule and blocked time" : "Team schedules and blocked time across the portfolio"
        }
      />
      <TeamCalendar employees={visibleEmployees} />
    </div>
  );
}
