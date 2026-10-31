import { Circle, CheckCircle2, Clock, FileText, XCircle, PauseCircle } from "lucide-react";

const CONFIG: Record<string, { classes: string; icon: typeof Circle; dot?: boolean }> = {
  DRAFT: { classes: "bg-gray-100 text-gray-600", icon: FileText },
  QUOTATION: { classes: "bg-blue-50 text-blue-700", icon: Clock },
  CONFIRMED: { classes: "bg-amber-50 text-amber-700", icon: Clock },
  ACTIVE: { classes: "bg-green-50 text-green-700", icon: CheckCircle2 },
  CLOSED: { classes: "bg-gray-100 text-gray-500", icon: XCircle },
  PAID: { classes: "bg-green-50 text-green-700", icon: CheckCircle2 },
  CANCELLED: { classes: "bg-red-50 text-red-700", icon: XCircle },
  PAUSED: { classes: "bg-orange-50 text-orange-700", icon: PauseCircle },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? { classes: "bg-gray-100 text-gray-600", icon: Circle };
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-black/5 ${cfg.classes}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}
