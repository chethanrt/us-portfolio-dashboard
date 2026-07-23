import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarViewOption = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

const VIEW_OPTIONS: { value: CalendarViewOption; label: string }[] = [
  { value: "dayGridMonth", label: "Month" },
  { value: "timeGridWeek", label: "Week" },
  { value: "timeGridDay", label: "Day" },
];

interface CalendarToolbarProps {
  title: string;
  view: CalendarViewOption;
  onViewChange: (view: CalendarViewOption) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  canCreate: boolean;
  onCreate: () => void;
}

export function CalendarToolbar({
  title,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  canCreate,
  onCreate,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" onClick={onPrev} aria-label="Previous">
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onNext} aria-label="Next">
            <ChevronRight />
          </Button>
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border p-0.5">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewChange(option.value)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                view === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {canCreate && (
          <Button size="sm" onClick={onCreate}>
            <Plus /> Create Event
          </Button>
        )}
      </div>
    </div>
  );
}
