const COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  QUOTATION: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-200 text-gray-600",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = COLORS[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>{status}</span>
  );
}
