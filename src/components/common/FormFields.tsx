import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

/**
 * Reusable React Hook Form fields (docs/07: "use reusable form components").
 * Required fields display a "*" per docs/08.
 */

export interface SelectOption {
  value: string;
  label: string;
}

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  /** Renders the field read-only (field-level security: editable = false). */
  disabled?: boolean;
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <FormLabel>
      {label}
      {required && <span className="text-destructive"> *</span>}
    </FormLabel>
  );
}

interface FormSelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: (SelectOption | string)[];
  placeholder?: string;
}

export function FormSelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select…",
  required,
  disabled,
}: FormSelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel label={label} required={required} />
          <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={disabled}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => {
                const { value, label: optionLabel } =
                  typeof option === "string" ? { value: option, label: option } : option;
                return (
                  <SelectItem key={value} value={value}>
                    {optionLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FormInputFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: string;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
}

export function FormInputField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  step,
  min,
  max,
  required,
  disabled,
}: FormInputFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel label={label} required={required} />
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              step={step}
              min={min}
              max={max}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FormSliderFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  min?: number;
  max?: number;
  step?: number;
}

/** Slider bound to a numeric form value (e.g. AI Adoption %). */
export function FormSliderField<T extends FieldValues>({
  control,
  name,
  label,
  min = 0,
  max = 100,
  step = 1,
  required,
  disabled,
}: FormSliderFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel label={label} required={required} />
            <span className="text-sm text-muted-foreground">{Number(field.value ?? 0)}%</span>
          </div>
          <FormControl>
            <Slider
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              value={[Number(field.value ?? 0)]}
              onValueChange={([value]) => field.onChange(value)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FormCheckboxGroupFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: SelectOption[];
}

/** Scrollable multi-select checkbox list bound to a string[] form value. */
export function FormCheckboxGroupField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
  disabled,
}: FormCheckboxGroupFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected: string[] = Array.isArray(field.value) ? field.value : [];
        const toggle = (value: string, checked: boolean) => {
          field.onChange(checked ? [...selected, value] : selected.filter((v) => v !== value));
        };
        return (
          <FormItem className="sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <FieldLabel label={label} required={required} />
              <span className="text-xs text-muted-foreground">{selected.length} selected</span>
            </div>
            <div className="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    disabled={disabled}
                    onCheckedChange={(checked) => toggle(option.value, checked === true)}
                  />
                  <span className="truncate">{option.label}</span>
                </label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

interface FormTextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

export function FormTextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  rows = 3,
  maxLength,
  required,
  disabled,
}: FormTextareaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FieldLabel label={label} required={required} />
          <FormControl>
            <Textarea placeholder={placeholder} rows={rows} maxLength={maxLength} disabled={disabled} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
