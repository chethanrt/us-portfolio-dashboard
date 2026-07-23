import { Download, LayoutGrid, List, Plus, Zap } from "lucide-react";
import { FilterBar, FilterSelect, SearchBar } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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

  return (
    <div className="space-y-2">
      {/* Row 1 — search, saved view, grouping, view toggle, actions */}
      <FilterBar>
        <SearchBar
          value={props.search}
          onChange={props.onSearchChange}
          placeholder="Search tasks…"
          className="w-full sm:w-56"
        />

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

        {/* View toggle */}
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

        <div className="flex gap-2 sm:ml-auto">
          {props.canExport && (
            <Button variant="outline" size="sm" onClick={props.onExport}>
              <Download /> Export
            </Button>
          )}
          {props.canCreate && (
            <>
              <Button variant="outline" size="sm" onClick={props.onQuickTask}>
                <Zap /> Quick Task
              </Button>
              <Button size="sm" onClick={props.onNewTask}>
                <Plus /> New Task
              </Button>
            </>
          )}
        </div>
      </FilterBar>

      {/* Row 2 — filters (docs/11: multiple filters combine) */}
      <FilterBar>
        <FilterSelect
          placeholder="Projects"
          options={[
            { value: "standalone", label: "Standalone only" },
            ...props.projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
          value={filters.project}
          onChange={(project) => set({ project })}
          className="sm:w-44"
        />
        <FilterSelect
          placeholder="Types"
          options={TYPES}
          value={filters.type}
          onChange={(type) => set({ type })}
          className="sm:w-32"
        />
        <FilterSelect
          placeholder="Categories"
          options={props.categories.map((c) => c.name)}
          value={filters.category}
          onChange={(category) => set({ category })}
          className="sm:w-40"
        />
        <FilterSelect
          placeholder="Statuses"
          options={props.workflow.map((s) => s.name)}
          value={filters.status}
          onChange={(status) => set({ status })}
          className="sm:w-36"
        />
        <FilterSelect
          placeholder="Priorities"
          options={PRIORITIES}
          value={filters.priority}
          onChange={(priority) => set({ priority })}
          className="sm:w-36"
        />
        <FilterSelect
          placeholder="Assignees"
          options={props.employees.map((e) => ({ value: e.id, label: e.name }))}
          value={filters.assignee}
          onChange={(assignee) => set({ assignee })}
          className="sm:w-44"
        />
        <FilterSelect
          placeholder="Reporters"
          options={props.employees.map((e) => ({ value: e.id, label: e.name }))}
          value={filters.reporter}
          onChange={(reporter) => set({ reporter })}
          className="sm:w-44"
        />
        <FilterSelect
          placeholder="AI Tools"
          options={props.aiTools}
          value={filters.aiTool}
          onChange={(aiTool) => set({ aiTool })}
          className="sm:w-36"
        />
        <FilterSelect
          placeholder="Labels"
          options={props.labels}
          value={filters.label}
          onChange={(label) => set({ label })}
          className="sm:w-36"
        />
        <FilterSelect
          placeholder="Due Dates"
          options={DUE_OPTIONS}
          value={filters.due}
          onChange={(due) => set({ due })}
          className="sm:w-40"
        />
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-3.5 accent-primary"
            checked={filters.showArchived}
            onChange={(event) => set({ showArchived: event.target.checked })}
          />
          Archived
        </label>
      </FilterBar>
    </div>
  );
}
