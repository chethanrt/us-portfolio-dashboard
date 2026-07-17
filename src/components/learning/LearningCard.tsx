import { Award, Pencil, Trash2 } from "lucide-react";
import { ProgressBar, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { LearningRow } from "@/hooks/useLearning";
import { formatDate } from "@/utils/format";

interface LearningCardProps {
  record: LearningRow;
  /** Whether the signed-in user can edit this record. */
  canEdit: boolean;
  /** Whether the signed-in user can delete this record. */
  canDelete: boolean;
  onEdit: (record: LearningRow) => void;
  onDelete: (record: LearningRow) => void;
}

export function LearningCard({ record, canEdit, canDelete, onEdit, onDelete }: LearningCardProps) {
  return (
    <Card className="flex flex-col gap-4 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <h3 className="truncate font-semibold" title={record.course}>
            {record.course}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{record.employeeName}</p>
        </div>
        <StatusBadge status={record.status} />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <ProgressBar value={record.progress} />
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{record.platform}</Badge>
          <Badge variant="outline">{record.hours}h</Badge>
          {record.certificate && (
            <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-700">
              <Award className="size-3" /> Certificate
            </Badge>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {record.completionDate ? `Completed ${formatDate(record.completionDate)}` : "Not completed yet"}
          </p>
          {(canEdit || canDelete) && (
            <div className="flex gap-1">
              {canEdit && (
                <Button variant="ghost" size="icon" aria-label={`Edit ${record.course}`} onClick={() => onEdit(record)}>
                  <Pencil className="size-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${record.course}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(record)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
