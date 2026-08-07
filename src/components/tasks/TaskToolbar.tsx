import { Fragment } from "react";
import type { ReactNode } from "react";
import { Download, LayoutGrid, List, Plus, Settings2, Zap } from "lucide-react";
import { FilterBar, FilterSelect, SearchBar } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TASK_FILTER_LABELS, TASK_FILTER_KEYS, useTaskFilterVisibility } from "@/hooks/useTaskFilterVisibility";
import {
  TASK_TOOLBAR_LABELS,
  TASK_TOOLBAR_KEYS,
  useTaskToolbarVisibility,
} from "@/hooks/useTaskToolbarVisibility";
import type { TaskToolbarKey } from "@/hooks/useTaskToolbarVisibility";
import { SAVED_VIEWS } from "@/services/TaskFilterService";
import type { SavedView, TaskFilters } from "@/services/TaskFilterService";
import { TASK_GROUPINGS } from "@/services/TaskBoardService";
import type { TaskGrouping } from "@/services/TaskBoardService";
import type { Employee, Project, TaskCategory, TaskWorkflowStatus } from "@/types";

export type TaskViewMode = "board" | "list";

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const TYPES = ["Project", "Standalone"];
const DUE_OPTIONS = ["Overdue", "Due Today", "Due This Week"];

interface TaskToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  savedView: SavedView;
  onSavedViewChange: (view: SavedView) => void;
  grouping: TaskGrouping;
  onGroupingChange: (grouping: TaskGrouping) => void;
  view: TaskViewMode;
  onViewChange: (view: TaskViewMode) => void;
  projects: Project[];
  categories: TaskCategory[];
  workflow: TaskWorkflowStatus[];
  employees: Employee[];
  aiTools: string[];
  labels: string[];
  canCreate: boolean;
  canExport: boolean;
  onQuickTask: () => void;
  onNewTask: () => void;
  onExport: () => void;
}

/** Task Board toolbar: search, saved views, filters, grouping, view toggle. */
export function TaskToolbar(props: TaskToolbarProps) {
  const { filters, onFiltersChange } = props;
  const set = (changes: Partial<TaskFilters>) => onFiltersChange({ ...filters, ...changes });
  const { isVisible: isFilterVisible, toggle: toggleFilter } = useTaskFilterVisibility();
  const { isVisible: isToolbarVisible, toggle: toggleToolbar } = useTaskToolbarVisibility();

  // Export/Quick Task only make sense — and only appear as customize options — when permitted.
  const availableToolbarKeys = TASK_TOOLBAR_KEYS.filter((key) => {
    if (key === "export") return props.canExport;
    if (key === "quickTask") return props.canCreate;
    return true;
  });
  const visibleToolbarKeys = availableToolbarKeys.filter(isToolbarVisible);

  const toolbarFields: Record<TaskToolbarKey, ReactNode> = {
    savedView: (
      <Select value={props.savedView} onValueChange={(v) => props.onSavedViewChange(v as SavedView)}>
        <SelectTrigger className="w-full bg-card sm:w-40" aria-label="Saved view">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SAVED_VIEWS.map((view) => (
            <SelectItem key={view} value={view}>
              {view}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
    grouping: (
      <Select value={props.grouping} onValueChange={(v) => props.onGroupingChange(v as TaskGrouping)}>
        <SelectTrigger className="w-full bg-card sm:w-40" aria-label="Group by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TASK_GROUPINGS.map((grouping) => (
            <SelectItem key={grouping} value={grouping}>
              Group: {grouping}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
    viewToggle: (
      <div className="flex rounded-lg border bg-card p-0.5" role="group" aria-label="View mode">
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 px-2.5", props.view === "board" && "bg-muted")}
          aria-pressed={props.view === "board"}
          onClick={() => props.onViewChange("board")}
        >
          <LayoutGrid className="size-4" /> Board
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 px-2.5", props.view === "list" && "bg-muted")}
          aria-pressed={props.view === "list"}
          onClick={() => props.onViewChange("list")}
        >
          <List className="size-4" /> List
        </Button>
      </div>
    ),
    export: (
      <Button variant="outline" size="sm" onClick={props.onExport}>
        <Download /> Export
      </Button>
    ),
    quickTask: (
      <Button variant="outline" size="sm" onClick={props.onQuickTask}>
        <Zap /> Quick Task
      </Button>
    ),
  };

  const filterFields: Record<(typeof TASK_FILTER_KEYS)[number], ReactNode> = {
    project: (
      <FilterSelect
        placeholder="Projects"
        options={[
          { value: "standalone", label: "Standalone only" },
          ...props.projects.map((p) => ({ value: p.id, label: p.name })),
        ]}
        value={filters.project}
        onChange={(project) => set({ project })}
      />
    ),
    type: (
      <FilterSelect
        placeholder="Types"
        options={TYPES}
        value={filters.type}
        onChange={(type) => set({ type })}
      />
    ),
    category: (
      <FilterSelect
        placeholder="Categories"
        options={props.categories.map((c) => c.name)}
        value={filters.category}
        onChange={(category) => set({ category })}
      />
    ),
    status: (
      <FilterSelect
        placeholder="Statuses"
        options={props.workflow.map((s) => s.name)}
        value={filters.status}
        onChange={(status) => set({ status })}
      />
    ),
    priority: (
      <FilterSelect
        placeholder="Priorities"
        options={PRIORITIES}
        value={filters.priority}
        onChange={(priority) => set({ priority })}
      />
    ),
    assignee: (
      <FilterSelect
        placeholder="Assignees"
        options={props.employees.map((e) => ({ value: e.id, label: e.name }))}
        value={filters.assignee}
        onChange={(assignee) => set({ assignee })}
      />
    ),
    reporter: (
      <FilterSelect
        placeholder="Reporters"
        options={props.employees.map((e) => ({ value: e.id, label: e.name }))}
        value={filters.reporter}
        onChange={(reporter) => set({ reporter })}
      />
    ),
    aiTool: (
      <FilterSelect
        placeholder="AI Tools"
        options={props.aiTools}
        value={filters.aiTool}
        onChange={(aiTool) => set({ aiTool })}
      />
    ),
    label: (
      <FilterSelect
        placeholder="Labels"
        options={props.labels}
        value={filters.label}
        onChange={(label) => set({ label })}
      />
    ),
    due: (
      <FilterSelect
        placeholder="Due Dates"
        options={DUE_OPTIONS}
        value={filters.due}
        onChange={(due) => set({ due })}
      />
    ),
  };
  const visibleFilterKeys = TASK_FILTER_KEYS.filter(isFilterVisible);

  return (
    <div className="space-y-2">
      {/* Row 1 — search, whatever secondary controls the user opted into, Customize, New Task.
          Everything flows left to right in a single row; nothing is pushed off to its own line. */}
      <FilterBar>
        <SearchBar
          value={props.search}
          onChange={props.onSearchChange}
          placeholder="Search tasks…"
          className="w-full sm:w-56"
        />

        {visibleToolbarKeys.map((key) => <Fragment key={key}>{toolbarFields[key]}</Fragment>)}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Customize toolbar">
              <Settings2 /> Customize
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Toolbar</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableToolbarKeys.map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={isToolbarVisible(key)}
                onCheckedChange={() => toggleToolbar(key)}
                onSelect={(event) => event.preventDefault()}
              >
                {TASK_TOOLBAR_LABELS[key]}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TASK_FILTER_KEYS.map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={isFilterVisible(key)}
                onCheckedChange={() => toggleFilter(key)}
                onSelect={(event) => event.preventDefault()}
              >
                {TASK_FILTER_LABELS[key]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {props.canCreate && (
          <Button size="sm" onClick={props.onNewTask}>
            <Plus /> New Task
          </Button>
        )}
      </FilterBar>

      {/* Row 2 — filters (docs/11: multiple filters combine). Only the filters a user has
          chosen to see (via Customize) render, each the same width so the row stays tidy
          whether one or all ten are visible. */}
      {visibleFilterKeys.length > 0 && (
        <FilterBar>{visibleFilterKeys.map((key) => <Fragment key={key}>{filterFields[key]}</Fragment>)}</FilterBar>
      )}
      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="size-3.5 accent-primary"
          checked={filters.showArchived}
          onChange={(event) => set({ showArchived: event.target.checked })}
        />
        Show archived tasks
      </label>
    </div>
  );
}
