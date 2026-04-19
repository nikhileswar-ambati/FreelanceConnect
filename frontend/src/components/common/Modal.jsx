import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}) => {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose();

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative mx-auto my-4 flex w-full max-h-[calc(100svh-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-elevated animate-scale-in",
          sizes[size]
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {(title || description) && (
          <div className="shrink-0 border-b border-border/60 px-6 pt-6 pb-4 pr-14">
            {title && (
              <h2 className="text-xl font-semibold text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="min-h-0 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
};
