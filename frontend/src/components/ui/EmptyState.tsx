import { Inbox, LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center animate-fade-in">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {description && <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  );
}
