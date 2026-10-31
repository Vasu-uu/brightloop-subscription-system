import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { listInvoices } from "../../api/invoices";
import { runBilling } from "../../api/billing";
import { Invoice } from "../../types";
import { INVOICE_STATUSES } from "../../constants/enums";

export default function InvoicesList() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);

  function reload() {
    setLoading(true);
    listInvoices({ page, search: search || undefined, status: status || undefined })
      .then((res) => {
        setRows(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const handle = setTimeout(reload, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status]);

  async function handleRunBilling() {
    setRunningBilling(true);
    try {
      const result = await runBilling();
      push(`Billing run: ${result.created} created, ${result.skipped} skipped`);
      reload();
    } catch (err: any) {
      push(err?.response?.data?.error?.message ?? "Billing run failed", "error");
    } finally {
      setRunningBilling(false);
    }
  }

  const columns: Column<Invoice>[] = [
    { key: "number", header: "Number", render: (r) => r.number },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? r.customerId },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "dueDate", header: "Due", render: (r) => new Date(r.dueDate).toLocaleDateString() },
    { key: "total", header: "Total", render: (r) => Number(r.total).toFixed(2) },
    { key: "amountPaid", header: "Paid", render: (r) => Number(r.amountPaid).toFixed(2) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button variant="ghost" onClick={() => navigate(`/app/invoices/${r.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        actions={
          <Button onClick={handleRunBilling} disabled={runningBilling}>
            Run billing now
          </Button>
        }
      />
      <div className="mb-4 flex gap-3">
        <div className="w-64">
          <Input
            placeholder="Search by number..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <div className="w-48">
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
