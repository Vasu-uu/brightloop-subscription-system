import { Check } from "lucide-react";

export function Stepper({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? "bg-brand-600 text-white"
                    : active
                      ? "bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-500/20"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={`text-[11px] font-medium capitalize ${
                  active ? "text-brand-700 dark:text-brand-300" : done ? "text-gray-700 dark:text-gray-300" : "text-gray-400"
                }`}
              >
                {step.toLowerCase()}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 mb-4 h-0.5 flex-1 rounded ${done ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-800"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
