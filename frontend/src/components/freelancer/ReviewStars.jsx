import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const ReviewStars = ({
  rating,
  size = 16,
  showValue,
  count,
  interactive,
  onChange,
}) => {
  const value = Number(rating);
  const safeRating = Number.isFinite(value) ? value : 0;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= Math.round(safeRating);

          return (
            <button
              key={n}
              type="button"
              disabled={!interactive}
              onClick={() => onChange?.(n)}
              className={cn(
                "transition-transform",
                interactive && "cursor-pointer hover:scale-110",
                !interactive && "cursor-default"
              )}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                style={{ width: size, height: size }}
                className={
                  filled
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/40"
                }
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-semibold text-foreground">
          {safeRating.toFixed(1)}
        </span>
      )}

      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
};
