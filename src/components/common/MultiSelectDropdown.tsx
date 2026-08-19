import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Secondary line shown under the label, e.g. role/team. */
  description?: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Trigger label and menu heading when nothing is selected, e.g. "All People". */
  allLabel: string;
  searchPlaceholder?: string;
  className?: string;
}

/** Dropdown checklist filter. Empty selection means "everyone" — the caller decides how to treat that. */
export function MultiSelectDropdown({
  options,
  selectedIds,
  onChange,
  allLabel,
  searchPlaceholder = "Search…",
  className,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = (value: string) => {
    onChange(selectedIds.includes(value) ? selectedIds.filter((id) => id !== value) : [...selectedIds, value]);
  };

  const filteredOptions = options.filter((option) =>
    [option.label, option.description ?? ""].some((field) => field.toLowerCase().includes(query.trim().toLowerCase()))
  );

  const triggerLabel =
    selectedIds.length === 0
      ? allLabel
      : selectedIds.length === 1
        ? (options.find((o) => o.value === selectedIds[0])?.label ?? "1 selected")
        : `${selectedIds.length} selected`;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-64",
            className
          )}
        >
          <span className={cn("truncate", selectedIds.length === 0 && "text-muted-foreground")}>{triggerLabel}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-0">
        <div className="flex items-center justify-between gap-2 border-b p-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 text-sm"
              autoFocus
            />
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
              onClick={() => onChange([])}
            >
              Clear
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            filteredOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedIds.includes(option.value)}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggle(option.value)}
                className="flex-col items-start gap-0"
              >
                <span className="text-sm">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                )}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
