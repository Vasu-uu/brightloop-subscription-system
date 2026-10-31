import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { listMyInvoices } from "../../api/portal";
import { Invoice } from "../../types";
import { daysOverdue, formatDate, formatMoney } from "../../lib/format";

export default function MyInvoices() {
  const navigate = useNavigate();
  const [all, setAll] = useState<Invoice[] | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    listMyInvoices(1, 100).then((r) => setAll(r.data));
  }, []);

  const summary = useMemo(() => {
    const list = all ?? [];
    const open = list.filter((i) => i.status === "CONFIRMED");
    return {
      due: open.reduce((s, i) => s + Number(i.total) - Number(i.amountPaid), 0),
      overdue: open.filter((i) => daysOverdue(i.dueDate) > 0).length,
      paid: list.filter((i) => i.status === "PAID").length,
    };
  }, [all]);

  const rows = (all ?? []).slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Invoice>[] = [
    { key: "number", header: "Invoice", render: (r) => <span className="font-semibold text-brand-700">{r.number}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "issued", header: "Issued", render: (r) => formatDate(r.issueDate) },
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
    {
      key: "balance",
      header: "Balance",
      render: (r) => <span className="font-medium tabular-nums">{formatMoney(Number(r.total) - Number(r.amountPaid))}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="My invoices" description="Review what you have been billed and pay any open balance." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {all === null ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500"><Wallet className="h-4 w-4" /> Amount due</div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{formatMoney(summary.due)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500"><AlertCircle className="h-4 w-4 text-red-500" /> Overdue invoices</div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{summary.overdue}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500"><CheckCircle2 className="h-4 w-4 text-green-500" /> Paid invoices</div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{summary.paid}</p>
            </div>
          </>
        )}
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        page={page}
        pageSize={pageSize}
        total={all?.length ?? 0}
        onPageChange={setPage}
        loading={all === null}
        onRowClick={(r) => navigate(`/portal/invoices/${r.id}`)}
      />
    </div>
  );
}
