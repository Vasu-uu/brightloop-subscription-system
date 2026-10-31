import { useEffect, useState } from "react";
import { Users, DollarSign, AlertCircle, Clock, TrendingUp, LucideIcon } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { getSummary, getRevenueByMonth, listDashboardInvoices, DashboardSummary } from "../../api/dashboard";
import { Invoice } from "../../types";

const TABS = [
  { key: "overdue", label: "Overdue" },
  { key: "outstanding", label: "Outstanding" },
  { key: "paid", label: "Paid" },
] as const;

const KPI_CONFIG: { key: keyof DashboardSummary; label: string; icon: LucideIcon; money?: boolean; accent: string }[] = [
  { key: "activeSubscriptions", label: "Active subscriptions", icon: Users, accent: "from-brand-500 to-brand-600" },
  { key: "totalRevenue", label: "Total revenue", icon: DollarSign, money: true, accent: "from-emerald-500 to-emerald-600" },
  { key: "totalOutstanding", label: "Outstanding", icon: Clock, money: true, accent: "from-amber-500 to-amber-600" },
  { key: "overdueCount", label: "Overdue invoices", icon: AlertCircle, accent: "from-red-500 to-red-600" },
  { key: "revenueThisMonth", label: "Revenue this month", icon: TrendingUp, money: true, accent: "from-violet-500 to-violet-600" },
];

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  delay,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover dark:border-gray-800 dark:bg-gray-900"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm`}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-50">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("overdue");
  const [rows, setRows] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSummary().then(setSummary);
    getRevenueByMonth().then(setRevenue);
  }, []);

  useEffect(() => {
    setLoading(true);
    listDashboardInvoices(tab, page)
      .then((res) => {
        setRows(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }, [tab, page]);

  const columns: Column<Invoice>[] = [
    { key: "number", header: "Number", render: (r) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.number}</span> },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? r.customerId },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "dueDate", header: "Due", render: (r) => new Date(r.dueDate).toLocaleDateString() },
    { key: "total", header: "Total", render: (r) => Number(r.total).toFixed(2) },
    {
      key: "balance",
      header: "Balance",
      render: (r) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {(Number(r.total) - Number(r.amountPaid)).toFixed(2)}
        </span>
      ),
    },
  ];

  const maxRevenue = Math.max(1, ...revenue.map((r) => r.revenue));

  return (
    <div>
      <PageHeader title="Finance Dashboard" description="A live view of subscriptions, revenue and collections." />

      {!summary ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {KPI_CONFIG.map((kpi, i) => (
            <KpiCard
              key={kpi.key}
              label={kpi.label}
              icon={kpi.icon}
              accent={kpi.accent}
              delay={i * 50}
              value={kpi.money ? Number(summary[kpi.key]).toFixed(2) : String(summary[kpi.key])}
            />
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue by month</p>
        <div className="flex items-end gap-3" style={{ height: 140 }}>
          {revenue.length === 0 && <Skeleton className="h-full w-full" />}
          {revenue.map((r) => (
            <div key={r.month} className="group flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-400">
                {r.revenue.toFixed(0)}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-500 ease-out dark:from-brand-700 dark:to-brand-500"
                style={{ height: `${Math.max(4, (r.revenue / maxRevenue) * 100)}px` }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">{r.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex gap-1.5 rounded-lg bg-gray-100 p-1 dark:bg-gray-900" style={{ width: "fit-content" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} />
      </div>
    </div>
  );
}
