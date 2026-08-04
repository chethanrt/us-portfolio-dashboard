import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const ALL_FILTER = "all";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  /** Placeholder shown when "All" is selected, e.g. "Status". */
  placeholder: string;
  options: (FilterOption | string)[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Dropdown filter with a built-in "All" option (value: ALL_FILTER). */
export function FilterSelect({ placeholder, options, value, onChange, className }: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full bg-card sm:w-40", className)} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_FILTER}>All {placeholder}</SelectItem>
        {options.map((option) => {
          const { value: optionValue, label } =
            typeof option === "string" ? { value: option, label: option } : option;
          return (
            <SelectItem key={optionValue} value={optionValue}>
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

/** Layout row for a SearchBar + FilterSelects + action buttons. */
export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      {children}
    </div>
  );
}
