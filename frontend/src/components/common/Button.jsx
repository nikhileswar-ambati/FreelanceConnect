import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  success: "bg-success text-success-foreground hover:bg-success/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizes = {
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";