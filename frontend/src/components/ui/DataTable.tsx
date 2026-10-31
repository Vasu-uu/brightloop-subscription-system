import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  page,
  pageSize,
  total,
  onPageChange,
  loading,
}: {
  columns: Column<T>[];
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className="animate-fade-in-up transition-colors duration-100 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  style={{ animationDelay: `${Math.min(i, 10) * 20}ms`, animationFillMode: "backwards" }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && <EmptyState title="No records found" description="Try adjusting your filters or search." />}
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
        <span>
          Page <span className="font-medium text-gray-900 dark:text-gray-100">{page}</span> of {totalPages}{" "}
          <span className="text-gray-400">({total} total)</span>
        </span>
        <div className="flex gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
