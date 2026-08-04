import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  /** Optional secondary line, e.g. "+12% vs last month". */
  hint?: string;
  className?: string;
}

/**
 * Dashboard KPI card (placeholder implementation for phase 1 —
 * trends/deltas will be wired up in the Dashboard phase).
 */
export function KPICard({ title, value, icon: Icon, hint, className }: KPICardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
