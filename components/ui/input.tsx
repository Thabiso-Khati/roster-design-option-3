"use client";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:        string;
  error?:        string;
  hint?:         string;
  leadingIcon?:  ReactNode;
  trailingIcon?: ReactNode;
  /** Wraps the input with a container — set false to use as bare input */
  withWrapper?:  boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leadingIcon,
      trailingIcon,
      withWrapper = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 8)}`;

    const inputEl = (
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={cn(
          // Base
          "w-full rounded-lg bg-surface-2 border text-text-primary text-sm",
          "placeholder:text-text-muted/50 transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Padding (adjust when icons present)
          leadingIcon  ? "pl-9"  : "pl-3.5",
          trailingIcon ? "pr-9"  : "pr-3.5",
          "py-2.5",
          // State
          error ? "border-error/60 focus-visible:ring-error" : "border-border hover:border-brand/40",
          !withWrapper && className
        )}
        {...props}
      />
    );

    if (!withWrapper) return inputEl;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted pointer-events-none input-icon-left"
            >
              {leadingIcon}
            </span>
          )}
          {inputEl}
          {trailingIcon && (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted pointer-events-none input-icon-right"
            >
              {trailingIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
