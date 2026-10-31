import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, CreditCard, Landmark, Smartphone, FileCheck, LucideIcon } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Combobox } from "../../components/ui/Combobox";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { usePagedList } from "../../hooks/usePagedList";
import { listPayments, PaymentRow } from "../../api/payments";
import { searchCustomers } from "../../api/customers";
import { dateToIsoEnd, dateToIsoStart, formatDate, formatMoney } from "../../lib/format";

const METHOD_ICON: Record<string, LucideIcon> = {
  CASH: Banknote,
  CARD: CreditCard,
  UPI: Smartphone,
  BANK_TRANSFER: Landmark,
  CHEQUE: FileCheck,
};

export default function PaymentsList() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerLabel, setCustomerLabel] = useState("");

  const { rows, total, page, setPage, loading } = usePagedList<PaymentRow, { from: string; to: string; customerId: number | "" }>(
    (a) =>
      listPayments({
        page: a.page,
        from: dateToIsoStart(a.from),
        to: dateToIsoEnd(a.to),
        customerId: a.customerId === "" ? undefined : a.customerId,
      }),
    { from, to, customerId }
  );

  const pageTotal = rows.reduce((s, r) => s + Number(r.amount), 0);

  const columns: Column<PaymentRow>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.paymentDate) },
    {
      key: "invoice",
      header: "Invoice",
      render: (r) => <span className="font-semibold text-brand-700">{r.invoice?.number ?? r.invoiceId}</span>,
    },
    {
      key: "method",
      header: "Method",
      render: (r) => {
        const Icon = METHOD_ICON[r.method] ?? CreditCard;
        return (
          <span className="inline-flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-gray-400" />
            {r.method.replace("_", " ")}
          </span>
        );
      },
    },
    { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{formatMoney(r.amount)}</span> },
    { key: "status", header: "Invoice status", render: (r) => (r.invoice ? <StatusBadge status={r.invoice.status} /> : "-") },
    { key: "note", header: "Note", render: (r) => <span className="text-gray-500">{r.note ?? "-"}</span> },
  ];

  return (
    <div>
      <PageHeader title="Payments" description="Every payment recorded against an invoice, with its method, date and note." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[160px_160px_280px_auto]">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Paid from" aria-label="Paid from" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="Paid to" aria-label="Paid to" />
        <Combobox
          value={customerId}
          selectedLabel={customerLabel}
          placeholder="All customers"
          fetchOptions={searchCustomers}
          onChange={(o) => {
            setCustomerId(o.id);
            setCustomerLabel(o.label);
          }}
        />
        {(from || to || customerId !== "") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFrom("");
              setTo("");
              setCustomerId("");
              setCustomerLabel("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={setPage}
        loading={loading}
        onRowClick={(r) => navigate(`/app/invoices/${r.invoiceId}`)}
      />
      {!loading && rows.length > 0 && (
        <p className="mt-2 text-right text-xs text-gray-500">
          Total on this page: <span className="font-semibold text-gray-700">{formatMoney(pageTotal)}</span>
        </p>
      )}
    </div>
  );
}
