"use client";
import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:     string;
  error?:     string;
  hint?:      string;
  placeholder?: string;
  children:   ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, placeholder, children, className, id, ...props }, ref) => {
    const selectId = id ?? `select-${Math.random().toString(36).slice(2, 8)}`;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            className={cn(
              "w-full appearance-none rounded-lg bg-surface-2 border text-text-primary text-sm",
              "pl-3.5 pr-9 py-2.5 transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-error/60 focus-visible:ring-error"
                : "border-border hover:border-brand/40",
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <ChevronDown
            size={15}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select };
