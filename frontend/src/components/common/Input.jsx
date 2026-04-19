import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(
  ({ label, error, hint, icon, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              icon && "pl-10",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
        </div>

        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export const Select = forwardRef(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-destructive",
            className
          )}
          {...props}
        >
          {children}
        </select>

        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

export const Textarea = forwardRef(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-destructive",
            className
          )}
          {...props}
        />

        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";