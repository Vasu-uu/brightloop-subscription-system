import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, DollarSign, LucideIcon, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { SearchInput } from "../../components/ui/SearchInput";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { usePagedList } from "../../hooks/usePagedList";
import { DashboardSummary, getRevenueByMonth, getSummary, listDashboardInvoices } from "../../api/dashboard";
import { Invoice } from "../../types";
import { dateToIsoEnd, dateToIsoStart, daysOverdue, formatDate, formatMoney, formatMoneyWhole } from "../../lib/format";

const TABS = [
  { key: "overdue", label: "Overdue" },
  { key: "outstanding", label: "Outstanding" },
  { key: "paid", label: "Paid" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent: string;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover dark:border-gray-800 dark:bg-gray-900"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 truncate text-xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-gray-50">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [months, setMonths] = useState(6);
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[] | null>(null);
  const [tab, setTab] = useState<Tab>("overdue");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    getSummary().then(setSummary);
  }, []);
  useEffect(() => {
    setRevenue(null);
    getRevenueByMonth(months).then(setRevenue);
  }, [months]);

  const { rows, total, page, setPage, search, setSearch, loading } = usePagedList<Invoice, { tab: Tab; from: string; to: string }>(
    (a) =>
      listDashboardInvoices(a.tab, {
        page: a.page,
        search: a.search,
        from: dateToIsoStart(a.from),
        to: dateToIsoEnd(a.to),
      }),
    { tab, from, to }
  );

  const columns: Column<Invoice>[] = [
    { key: "number", header: "Invoice", render: (r) => <span className="font-semibold text-brand-700 dark:text-brand-300">{r.number}</span> },
    {
      key: "customer",
      header: "Customer",
      render: (r) => (
        <div className="leading-tight">
          <p className="font-medium text-gray-900 dark:text-gray-100">{r.customer?.name ?? r.customerId}</p>
          <p className="text-xs text-gray-500">{r.subscription?.number}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "due",
      header: "Due",
      render: (r) => (
        <div className="leading-tight">
          <p>{formatDate(r.dueDate)}</p>
          {r.status === "CONFIRMED" && daysOverdue(r.dueDate) > 0 && (
            <p className="text-xs font-medium text-red-600">{daysOverdue(r.dueDate)} days overdue</p>
          )}
        </div>
      ),
    },
    { key: "total", header: "Total", render: (r) => <span className="tabular-nums">{formatMoney(r.total)}</span> },
    {
      key: "balance",
      header: "Balance",
      render: (r) => <span className="font-medium tabular-nums">{formatMoney(Number(r.total) - Number(r.amountPaid))}</span>,
    },
  ];

  const maxRevenue = Math.max(1, ...(revenue ?? []).map((r) => r.revenue));
  const gridLines = [1, 0.75, 0.5, 0.25];

  return (
    <div className="space-y-6">
      <PageHeader title="Finance dashboard" description="Active subscriptions, revenue collected, what is still owed and what is overdue." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {!summary ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[116px]" />)
        ) : (
          <>
            <Kpi delay={0} label="Active subscriptions" value={String(summary.activeSubscriptions)} icon={Users} accent="from-brand-500 to-brand-600" />
            <Kpi delay={50} label="Revenue collected" value={formatMoneyWhole(summary.totalRevenue)} sub="All payments received" icon={DollarSign} accent="from-emerald-500 to-emerald-600" />
            <Kpi delay={100} label="Revenue this month" value={formatMoneyWhole(summary.revenueThisMonth)} icon={TrendingUp} accent="from-violet-500 to-violet-600" />
            <Kpi delay={150} label="Outstanding" value={formatMoneyWhole(summary.totalOutstanding)} sub="Confirmed invoices still owed" icon={Clock} accent="from-amber-500 to-amber-600" />
            <Kpi delay={200} label="Overdue" value={formatMoneyWhole(summary.overdueAmount)} sub={`${summary.overdueCount} invoices past due`} icon={AlertCircle} accent="from-red-500 to-red-600" />
          </>
        )}
      </div>

      <Card
        title="Revenue by month"
        description="Payments received per month"
        actions={
          <div className="w-44">
            <Select value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Range">
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </Select>
          </div>
        }
      >
        {revenue === null ? (
          <Skeleton className="h-48 w-full" />
        ) : revenue.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No payments in this period.</p>
        ) : (
          <div className="relative h-48">
            {gridLines.map((g) => (
              <div key={g} className="absolute inset-x-0 border-t border-dashed border-gray-100 dark:border-gray-800" style={{ bottom: `calc(${g * 100}% * 0.82 + 22px)` }}>
                <span className="absolute -top-2 left-0 bg-white pr-1 text-[10px] text-gray-400 dark:bg-gray-900">
                  {formatMoney(maxRevenue * g).replace(/\.00$/, "")}
                </span>
              </div>
            ))}
            <div className="absolute inset-0 flex items-end gap-4 pl-16">
              {revenue.map((r) => (
                <div key={r.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[11px] font-medium tabular-nums text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-300">
                    {formatMoney(r.revenue)}
                  </span>
                  <div
                    className="w-full max-w-[72px] rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-500 group-hover:from-brand-700 group-hover:to-brand-500"
                    style={{ height: `${Math.max(3, (r.revenue / maxRevenue) * 82)}%` }}
                  />
                  <span className="text-xs text-gray-500">{r.month}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${
                  tab === t.key
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-52">
              <SearchInput value={search} onChange={setSearch} placeholder="Invoice or customer" />
            </div>
            <div className="w-36">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Issued from" aria-label="Issued from" />
            </div>
            <div className="w-36">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="Issued to" aria-label="Issued to" />
            </div>
            {(from || to) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} onRowClick={(r) => navigate(`/app/invoices/${r.id}`)} />
      </div>
    </div>
  );
}
