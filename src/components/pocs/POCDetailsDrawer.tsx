import { ExternalLink, GitBranch } from "lucide-react";
import { Drawer, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { POCRow } from "@/hooks/usePOCs";
import { getInitials } from "@/utils/format";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

interface POCDetailsDrawerProps {
  poc: POCRow | null;
  onClose: () => void;
}

export function POCDetailsDrawer({ poc, onClose }: POCDetailsDrawerProps) {
  if (!poc) return null;

  return (
    <Drawer
      open={Boolean(poc)}
      onOpenChange={(open) => !open && onClose()}
      title={
        <span className="flex items-center gap-2">
          {poc.title}
          <StatusBadge status={poc.status} />
        </span>
      }
      description={`${poc.projectName} · ${poc.category}`}
    >
      {/* Owner */}
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(poc.ownerName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{poc.ownerName}</p>
          <p className="text-xs text-muted-foreground">Owner</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {poc.id}
        </Badge>
      </div>
      <Separator />

      {/* Overview */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Description</h4>
        <p className="text-sm text-muted-foreground">{poc.description}</p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Business Value</h4>
        <p className="text-sm text-muted-foreground">{poc.businessValue}</p>
      </section>
      <Separator />

      <div className="space-y-2">
        <InfoRow label="Project" value={poc.projectName} />
        <InfoRow label="Category" value={poc.category} />
        <InfoRow label="Hours Saved" value={poc.hoursSaved > 0 ? `${poc.hoursSaved}h` : "—"} />
      </div>
      <Separator />

      {/* Links */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Links</h4>
        {!poc.repo && !poc.demo ? (
          <p className="text-sm text-muted-foreground">No links added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {poc.repo && (
              <Button variant="outline" size="sm" asChild>
                <a href={poc.repo} target="_blank" rel="noreferrer">
                  <GitBranch /> Repository
                </a>
              </Button>
            )}
            {poc.demo && (
              <Button variant="outline" size="sm" asChild>
                <a href={poc.demo} target="_blank" rel="noreferrer">
                  <ExternalLink /> Demo
                </a>
              </Button>
            )}
          </div>
        )}
      </section>
    </Drawer>
  );
}
