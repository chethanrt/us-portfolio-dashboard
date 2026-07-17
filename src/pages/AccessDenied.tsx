import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState, PageHeader } from "@/components/common";

/** Shown when the signed-in user lacks View permission for a route. */
export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Access Denied" />
      <EmptyState
        icon={ShieldAlert}
        title="Access Denied"
        description="Your role does not have permission to view this page. Contact an administrator if you believe this is a mistake."
        actionLabel="Back to Dashboard"
        onAction={() => navigate("/dashboard")}
      />
    </div>
  );
}
