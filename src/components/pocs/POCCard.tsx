import { Clock, ExternalLink, FolderKanban, GitBranch, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { POCRow } from "@/hooks/usePOCs";
import { getInitials } from "@/utils/format";

interface POCCardProps {
  poc: POCRow;
  /** Whether the active role can edit/delete this POC (docs/05). */
  canEdit: boolean;
  onViewDetails: (poc: POCRow) => void;
  onEdit: (poc: POCRow) => void;
  onDelete: (poc: POCRow) => void;
}

export function POCCard({ poc, canEdit, onViewDetails, onEdit, onDelete }: POCCardProps) {
  return (
    <Card className="flex flex-col shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <h3 className="truncate font-semibold" title={poc.title}>
            {poc.title}
          </h3>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <FolderKanban className="size-3.5 shrink-0" aria-hidden="true" />
            {poc.projectName}
          </p>
        </div>
        <StatusBadge status={poc.status} />
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p className="line-clamp-2 text-sm text-muted-foreground" title={poc.businessValue}>
          {poc.businessValue}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{poc.category}</Badge>
          {poc.hoursSaved > 0 && (
            <Badge variant="outline" className="gap-1">
              <Clock className="size-3" /> {poc.hoursSaved}h saved
            </Badge>
          )}
          {poc.repo && (
            <Badge variant="outline" className="gap-1">
              <GitBranch className="size-3" /> Repo
            </Badge>
          )}
          {poc.demo && (
            <Badge variant="outline" className="gap-1">
              <ExternalLink className="size-3" /> Demo
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
              {getInitials(poc.ownerName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm">{poc.ownerName}</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(poc)}>
          View Details
        </Button>
        {canEdit && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" aria-label={`Edit ${poc.title}`} onClick={() => onEdit(poc)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${poc.title}`}
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(poc)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
