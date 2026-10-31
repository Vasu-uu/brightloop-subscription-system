import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CalendarClock, Clock, DollarSign, LucideIcon, Play, Plus, TrendingUp, Users } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CountUp } from "../../components/ui/CountUp";
import { Input } from "../../components/ui/Input";
import { Segmented } from "../../components/ui/Segmented";
import { Select } from "../../components/ui/Select";
import { SearchInput } from "../../components/ui/SearchInput";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useMe } from "../../hooks/useMe";
import { usePagedList } from "../../hooks/usePagedList";
import { DashboardSummary, getRevenueByMonth, getSummary, listDashboardInvoices } from "../../api/dashboard";
import { listSubscriptions } from "../../api/subscriptions";
import { Invoice } from "../../types";
import { dateToIsoEnd, dateToIsoStart, daysOverdue, formatDate, formatMoney, formatMoneyWhole } from "../../lib/format";

const TABS = [
  { key: "overdue", label: "Overdue" },
  { key: "outstanding", label: "Outstanding" },
  { key: "paid", label: "Paid" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Kpi({
  label,
  value,
  format,
  sub,
  icon: Icon,
  accent,
  delay,
  onClick,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  sub?: string;
  icon: LucideIcon;
  accent: string;
  delay: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="group animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 text-left shadow-card transition-all duration-200 enabled:hover:-translate-y-1 enabled:hover:shadow-card-hover disabled:cursor-default"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 truncate text-xl font-bold tracking-tight text-gray-900">
        <CountUp value={value} format={format} />
      </p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const me = useMe();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [renewalsDue, setRenewalsDue] = useState<number | null>(null);
  const [months, setMonths] = useState(6);
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[] | null>(null);
  const [tab, setTab] = useState<Tab>("overdue");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    getSummary().then(setSummary);
    listSubscriptions({ expiringInDays: 30, page: 1 }).then((r) => setRenewalsDue(r.meta.total)).catch(() => setRenewalsDue(0));
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
    { key: "number", header: "Invoice", render: (r) => <span className="font-semibold text-brand-700">{r.number}</span> },
    {
      key: "customer",
      header: "Customer",
      render: (r) => (
        <div className="leading-tight">
          <p className="font-medium text-gray-900">{r.customer?.name ?? r.customerId}</p>
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
          {r.status === "CONFIRMED" && daysOverdue(r.dueDate) > 0 && <p className="text-xs font-medium text-red-600">{daysOverdue(r.dueDate)} days overdue</p>}
        </div>
      ),
    },
    { key: "total", header: "Total", render: (r) => <span className="tabular-nums">{formatMoney(r.total)}</span> },
    { key: "balance", header: "Balance", render: (r) => <span className="font-medium tabular-nums">{formatMoney(Number(r.total) - Number(r.amountPaid))}</span> },
  ];

  const maxRevenue = Math.max(1, ...(revenue ?? []).map((r) => r.revenue));
  const gridLines = [1, 0.75, 0.5, 0.25];
  const firstName = me?.name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <section className="relative animate-gradient-pan overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-violet-600 to-brand-700 bg-[length:200%_200%] p-6 text-white shadow-lg shadow-brand-600/20 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 animate-float rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-white/80">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-white/80">
              {summary
                ? `${summary.activeSubscriptions.toLocaleString("en-IN")} active subscriptions and ${summary.overdueCount.toLocaleString("en-IN")} overdue invoices need your attention.`
                : "Loading your numbers..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate("/app/subscriptions/new")} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <Plus className="h-4 w-4" /> New subscription
            </button>
            <button onClick={() => navigate("/app/invoices?billing=1")} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/25">
              <Play className="h-4 w-4" /> Run billing
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {!summary ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[116px]" />)
        ) : (
          <>
            <Kpi delay={0} label="Active subscriptions" value={summary.activeSubscriptions} format={(n) => Math.round(n).toLocaleString("en-IN")} icon={Users} accent="from-brand-500 to-brand-600" onClick={() => navigate("/app/subscriptions")} />
            <Kpi delay={60} label="Revenue collected" value={summary.totalRevenue} format={formatMoneyWhole} sub="All payments received" icon={DollarSign} accent="from-emerald-500 to-emerald-600" onClick={() => navigate("/app/payments")} />
            <Kpi delay={120} label="This month" value={summary.revenueThisMonth} format={formatMoneyWhole} sub="Collected so far" icon={TrendingUp} accent="from-violet-500 to-violet-600" />
            <Kpi delay={180} label="Outstanding" value={summary.totalOutstanding} format={formatMoneyWhole} sub="Confirmed, not yet paid" icon={Clock} accent="from-amber-500 to-amber-600" onClick={() => setTab("outstanding")} />
            <Kpi delay={240} label="Overdue" value={summary.overdueAmount} format={formatMoneyWhole} sub={`${summary.overdueCount} invoices past due`} icon={AlertCircle} accent="from-red-500 to-red-600" onClick={() => setTab("overdue")} />
            <Kpi delay={300} label="Renewals due" value={renewalsDue ?? 0} format={(n) => Math.round(n).toLocaleString("en-IN")} sub="Expiring in the next 30 days" icon={CalendarClock} accent="from-sky-500 to-sky-600" onClick={() => navigate("/app/subscriptions?expiring=30")} />
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
          <div className="relative h-52" key={months}>
            {gridLines.map((g) => (
              <div key={g} className="absolute inset-x-0 border-t border-dashed border-gray-100" style={{ bottom: `calc(${g * 100}% * 0.8 + 24px)` }}>
                <span className="absolute -top-2 left-0 bg-white pr-1 text-[10px] text-gray-400">{formatMoneyWhole(maxRevenue * g)}</span>
              </div>
            ))}
            <div className="absolute inset-0 flex items-end gap-4 pl-20">
              {revenue.map((r, i) => (
                <div key={r.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white opacity-0 shadow transition-all duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100">
                    {formatMoney(r.revenue)}
                  </span>
                  <div
                    className="w-full max-w-[72px] origin-bottom animate-bar-grow rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-[filter] duration-200 group-hover:brightness-110"
                    style={{ height: `${Math.max(3, (r.revenue / maxRevenue) * 80)}%`, animationDelay: `${i * 90}ms` }}
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
          <Segmented options={TABS} value={tab} onChange={setTab} />
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
        <button onClick={() => navigate("/app/invoices")} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-all hover:gap-2">
          View all invoices <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
