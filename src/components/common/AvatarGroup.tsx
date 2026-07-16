import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils/format";

interface AvatarGroupProps {
  names: string[];
  /** Max avatars before collapsing into a "+n" chip. */
  max?: number;
  className?: string;
}

export function AvatarGroup({ names, max = 4, className }: AvatarGroupProps) {
  const visible = names.slice(0, max);
  const overflow = names.length - visible.length;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visible.map((name) => (
        <Avatar key={name} className="size-7 ring-2 ring-card" title={name}>
          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <Avatar className="size-7 ring-2 ring-card">
          <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
            +{overflow}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
