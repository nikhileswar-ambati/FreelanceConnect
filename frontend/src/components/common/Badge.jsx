import { cn } from "@/lib/utils";

const variants = {
  default: "bg-muted text-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  destructive: "bg-destructive-soft text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export const Badge = ({
  children,
  variant = "default",
  className,
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
      variants[variant],
      className
    )}
  >
    {children}
  </span>
);