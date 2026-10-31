import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }
>(({ label, error, className = "", id, children, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={`w-full appearance-none rounded-lg border px-3 py-2 pr-9 text-sm text-gray-900 shadow-sm outline-none transition-colors duration-150 dark:bg-gray-800 dark:text-gray-100 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
      {error && <span className="text-xs font-medium text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
});
Select.displayName = "Select";
