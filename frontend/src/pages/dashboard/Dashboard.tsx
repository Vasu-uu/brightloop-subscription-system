import { useEffect, useState } from "react";
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

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
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
    { key: "number", header: "Number", render: (r) => r.number },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? r.customerId },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "dueDate", header: "Due", render: (r) => new Date(r.dueDate).toLocaleDateString() },
    { key: "total", header: "Total", render: (r) => Number(r.total).toFixed(2) },
    { key: "balance", header: "Balance", render: (r) => (Number(r.total) - Number(r.amountPaid)).toFixed(2) },
  ];

  const maxRevenue = Math.max(1, ...revenue.map((r) => r.revenue));

  return (
    <div>
      <PageHeader title="Finance Dashboard" />
      {!summary ? (
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          <KpiCard label="Active subscriptions" value={String(summary.activeSubscriptions)} />
          <KpiCard label="Revenue" value={summary.totalRevenue.toFixed(2)} />
          <KpiCard label="Outstanding" value={summary.totalOutstanding.toFixed(2)} />
          <KpiCard label="Overdue count" value={String(summary.overdueCount)} />
          <KpiCard label="Overdue amount" value={summary.overdueAmount.toFixed(2)} />
        </div>
      )}

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Revenue by month</p>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {revenue.map((r) => (
            <div key={r.month} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-indigo-500"
                style={{ height: `${(r.revenue / maxRevenue) * 100}px` }}
                title={`${r.month}: ${r.revenue.toFixed(2)}`}
              />
              <span className="text-xs text-gray-500">{r.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t.key ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-300"
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
