import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Colored status badge shared across modules.
 * Green = done/positive, blue = active, orange = paused/warning,
 * purple = planning, gray = not started / idea.
 */
const STATUS_STYLES: Record<string, string> = {
  Active: "border-blue-200 bg-blue-50 text-blue-700",
  "In Progress": "border-blue-200 bg-blue-50 text-blue-700",
  Completed: "border-green-200 bg-green-50 text-green-700",
  "On Hold": "border-orange-200 bg-orange-50 text-orange-700",
  Planning: "border-purple-200 bg-purple-50 text-purple-700",
  Idea: "border-slate-200 bg-slate-50 text-slate-600",
  "Not Started": "border-slate-200 bg-slate-50 text-slate-600",
  Inactive: "border-slate-200 bg-slate-50 text-slate-600",
  "Ex-Employee": "border-red-200 bg-red-50 text-red-700",
  High: "border-green-200 bg-green-50 text-green-700",
  Medium: "border-orange-200 bg-orange-50 text-orange-700",
  Low: "border-slate-200 bg-slate-50 text-slate-600",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_STYLES[status] ?? "border-slate-200 bg-slate-50 text-slate-600", className)}
    >
      {status}
    </Badge>
  );
}
