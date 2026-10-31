import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Play } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Combobox } from "../../components/ui/Combobox";
import { SearchInput } from "../../components/ui/SearchInput";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { usePagedList } from "../../hooks/usePagedList";
import { listInvoices } from "../../api/invoices";
import { BillingRunResult, BillingStatus, getBillingStatus, runBilling } from "../../api/billing";
import { searchCustomers } from "../../api/customers";
import { Invoice } from "../../types";
import { INVOICE_STATUSES } from "../../constants/enums";
import { dateToIsoEnd, daysOverdue, errorMessage, formatDate, formatMoney } from "../../lib/format";

export default function InvoicesList() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerLabel, setCustomerLabel] = useState("");

  const { rows, total, page, setPage, search, setSearch, loading, reload } = usePagedList<
    Invoice,
    { status: string; from: string; to: string; customerId: number | "" }
  >(
    (a) =>
      listInvoices({
        page: a.page,
        search: a.search,
        status: a.status || undefined,
        from: a.from || undefined,
        to: a.to || undefined,
        customerId: a.customerId === "" ? undefined : a.customerId,
      }),
    { status, from, to, customerId }
  );

  const [params, setParams] = useSearchParams();
  const [billingOpen, setBillingOpen] = useState(false);
  useEffect(() => {
    if (params.get("billing")) {
      setBillingOpen(true);
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [running, setRunning] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  useEffect(() => {
    if (billingOpen) getBillingStatus().then(setBillingStatus).catch(() => setBillingStatus(null));
  }, [billingOpen]);
  const [result, setResult] = useState<BillingRunResult | null>(null);

  async function run() {
    setRunning(true);
    try {
      const r = await runBilling(dateToIsoEnd(asOf));
      setResult(r);
      reload();
    } catch (err) {
      push(errorMessage(err, "Billing run failed"), "error");
    } finally {
      setRunning(false);
    }
  }

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
    { key: "issued", header: "Issued", render: (r) => formatDate(r.issueDate) },
    {
      key: "due",
      header: "Due",
      render: (r) => {
        const late = r.status === "CONFIRMED" && daysOverdue(r.dueDate) > 0;
        return (
          <div className="leading-tight">
            <p>{formatDate(r.dueDate)}</p>
            {late && <p className="text-xs font-medium text-red-600">{daysOverdue(r.dueDate)} days overdue</p>}
          </div>
        );
      },
    },
    { key: "total", header: "Total", render: (r) => <span className="tabular-nums">{formatMoney(r.total)}</span> },
    {
      key: "balance",
      header: "Balance",
      render: (r) => {
        const b = Number(r.total) - Number(r.amountPaid);
        return <span className={`tabular-nums font-medium ${b > 0 && r.status === "CONFIRMED" ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}>{formatMoney(b)}</span>;
      },
    },
  ];

  const hasFilters = status || from || to || customerId !== "" || search;

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Generated automatically from subscriptions. Confirm, send, print and track payment."
        actions={
          <Button
            onClick={() => {
              setResult(null);
              setBillingOpen(true);
            }}
          >
            <Play className="h-4 w-4" /> Run billing
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_150px_150px_260px]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice number" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Issued from" title="Issued from" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Issued to" title="Issued to" />
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
      </div>
      {hasFilters && (
        <div className="mb-3">
          <Button
            variant="ghost"
            onClick={() => {
              setStatus("");
              setFrom("");
              setTo("");
              setCustomerId("");
              setCustomerLabel("");
              setSearch("");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} onRowClick={(r) => navigate(`/app/invoices/${r.id}`)} />

      <Modal open={billingOpen} onClose={() => setBillingOpen(false)} title="Run billing">
        {result ? (
          <div className="animate-fade-in text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">Billing run complete</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-50">{result.created}</p>
                <p className="text-xs text-gray-500">Invoices created</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-50">{result.skipped}</p>
                <p className="text-xs text-gray-500">Already billed (skipped)</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">Running it again is safe: nothing is ever billed twice.</p>
            <Button className="mt-5" onClick={() => setBillingOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              Creates a draft invoice for every active, unpaused subscription that is due on or before the date below,
              including any missed periods. Eligible discounts and taxes are applied automatically.
            </p>
            <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {billingStatus?.enabled
                ? `Billing also runs automatically (${billingStatus.schedule}, server time).`
                : "Automatic billing is off. Run it here as needed."}
              {billingStatus?.lastRun &&
                ` Last run ${new Date(billingStatus.lastRun.at).toLocaleString("en-IN")} (${billingStatus.lastRun.trigger}): ${billingStatus.lastRun.created} created.`}
            </p>
            <Input label="Bill as of" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setBillingOpen(false)}>
                Cancel
              </Button>
              <Button onClick={run} loading={running}>
                Run billing
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
