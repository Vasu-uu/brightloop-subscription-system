import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-colors duration-150 placeholder:text-gray-400 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs font-medium text-red-600">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
