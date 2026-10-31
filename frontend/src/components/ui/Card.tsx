import { ReactNode } from "react";

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
          <div>
            {title && <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
