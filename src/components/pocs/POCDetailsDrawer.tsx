import { format, parseISO } from "date-fns";
import { ExternalLink, GitBranch } from "lucide-react";
import { Drawer, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { POCRow } from "@/hooks/usePOCs";
import { usePermission } from "@/security";
import { formatDate, getInitials } from "@/utils/format";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function formatTime(value: string): string {
  return value ? format(parseISO(`2000-01-01T${value}:00`), "h:mm a") : "—";
}

interface POCDetailsDrawerProps {
  poc: POCRow | null;
  onClose: () => void;
}

export function POCDetailsDrawer({ poc, onClose }: POCDetailsDrawerProps) {
  // Field-level security: hidden fields are omitted from the drawer.
  const { canViewField } = usePermission();
  const show = (field: string) => canViewField("pocs", field);

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

      {/* Team */}
      {show("team") && poc.teamNames.length > 0 && (
        <>
          <section className="space-y-2">
            <h4 className="text-sm font-semibold">Team ({poc.teamNames.length})</h4>
            <div className="flex flex-wrap gap-2">
              {poc.teamNames.map((name) => (
                <div key={name} className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{name}</span>
                </div>
              ))}
            </div>
          </section>
          <Separator />
        </>
      )}

      {/* Overview — fields respect field-level security */}
      {show("description") && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Description</h4>
          <p className="text-sm text-muted-foreground">{poc.description}</p>
        </section>
      )}

      {show("businessValue") && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Business Value</h4>
          <p className="text-sm text-muted-foreground">{poc.businessValue}</p>
        </section>
      )}
      <Separator />

      <div className="space-y-2">
        {show("projectId") && <InfoRow label="Project" value={poc.projectName} />}
        {show("category") && <InfoRow label="Category" value={poc.category} />}
        {show("startDate") && <InfoRow label="Start Date" value={formatDate(poc.startDate)} />}
        {show("endDate") && <InfoRow label="End Date" value={formatDate(poc.endDate)} />}
        {show("startTime") && <InfoRow label="Start Time" value={formatTime(poc.startTime)} />}
        {show("hoursPerDay") && (
          <InfoRow label="Hours per Day" value={poc.hoursPerDay > 0 ? `${poc.hoursPerDay}h` : "—"} />
        )}
        {show("hoursSaved") && (
          <InfoRow label="Hours Saved" value={poc.hoursSaved > 0 ? `${poc.hoursSaved}h` : "—"} />
        )}
      </div>
      <Separator />

      {/* Links */}
      {(show("repo") || show("demo")) && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Links</h4>
          {!poc.repo && !poc.demo ? (
            <p className="text-sm text-muted-foreground">No links added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {poc.repo && show("repo") && (
                <Button variant="outline" size="sm" asChild>
                  <a href={poc.repo} target="_blank" rel="noreferrer">
                    <GitBranch /> Repository
                  </a>
                </Button>
              )}
              {poc.demo && show("demo") && (
                <Button variant="outline" size="sm" asChild>
                  <a href={poc.demo} target="_blank" rel="noreferrer">
                    <ExternalLink /> Demo
                  </a>
                </Button>
              )}
            </div>
          )}
        </section>
      )}
    </Drawer>
  );
}
