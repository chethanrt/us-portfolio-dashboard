import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * "timeGridRollingWeek" is a custom view (registered on the FullCalendar
 * component via its `views` prop) that shows a rolling 7-day window starting
 * on today rather than the stock Sunday–Saturday week.
 */
export type CalendarViewOption = "dayGridMonth" | "timeGridRollingWeek" | "timeGridDay";

const VIEW_OPTIONS: { value: CalendarViewOption; label: string }[] = [
  { value: "dayGridMonth", label: "Month" },
  { value: "timeGridRollingWeek", label: "Week" },
  { value: "timeGridDay", label: "Day" },
];

/**
 * Pass as FullCalendar's `views` prop wherever `timeGridRollingWeek` is used.
 * `dateAlignment: "day"` stops FullCalendar snapping the range to the
 * Sunday-based week start, so it always begins on the current reference day.
 */
export const ROLLING_WEEK_VIEWS = {
  timeGridRollingWeek: {
    type: "timeGrid",
    duration: { days: 7 },
    dateAlignment: "day",
  },
};

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
            <Plus /> Block Calendar
          </Button>
        )}
      </div>
    </div>
  );
}
