import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  label?: string;
  /** Show the numeric percentage on the right. */
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({ value, label, showValue = true, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 text-sm">
          {label && <span className="truncate font-medium">{label}</span>}
          {showValue && <span className="text-muted-foreground">{clamped}%</span>}
        </div>
      )}
      <Progress value={clamped} aria-label={label} />
    </div>
  );
}
