import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const SearchableSelect = ({
  label,
  value,
  onChange,
  options,
  getValue,
  getLabel,
  placeholder,
  disabled,
  required,
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => String(getValue(option)) === String(value));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;

    return options.filter((option) =>
      getLabel(option).toLowerCase().includes(needle)
    );
  }, [getLabel, options, query]);

  const displayValue = open ? query : selected ? getLabel(selected) : "";

  return (
    <div className="relative space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (e.target.value === "") onChange("");
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        disabled={disabled}
        required={required && !value}
        placeholder={placeholder}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        )}
      />

      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-card shadow-elevated">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No options
            </div>
          ) : (
            filtered.map((option) => (
              <button
                key={getValue(option)}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(String(getValue(option)));
                  setQuery("");
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-muted",
                  String(getValue(option)) === String(value) &&
                    "bg-primary-soft text-primary"
                )}
              >
                {getLabel(option)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
