import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SkillLevel } from "@/types";

/**
 * Skill level badge — colors per docs/03 wireframes:
 * Beginner yellow, Intermediate blue, Advanced green, Expert purple.
 */
const LEVEL_STYLES: Record<SkillLevel, string> = {
  Beginner: "border-yellow-200 bg-yellow-50 text-yellow-700",
  Intermediate: "border-blue-200 bg-blue-50 text-blue-700",
  Advanced: "border-green-200 bg-green-50 text-green-700",
  Expert: "border-purple-200 bg-purple-50 text-purple-700",
};

interface SkillBadgeProps {
  level: SkillLevel;
  className?: string;
}

export function SkillBadge({ level, className }: SkillBadgeProps) {
  return (
    <Badge variant="outline" className={cn(LEVEL_STYLES[level], className)}>
      {level}
    </Badge>
  );
}
