import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { listMyInvoices } from "../../api/portal";
import { Invoice } from "../../types";

export default function MyInvoices() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listMyInvoices(page)
      .then((res) => {
        setRows(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const columns: Column<Invoice>[] = [
    {
      key: "number",
      header: "Number",
      render: (r) => (
        <button className="text-indigo-600 hover:underline" onClick={() => navigate(`/portal/invoices/${r.id}`)}>
          {r.number}
        </button>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "dueDate", header: "Due", render: (r) => new Date(r.dueDate).toLocaleDateString() },
    { key: "total", header: "Total", render: (r) => Number(r.total).toFixed(2) },
    { key: "balance", header: "Balance", render: (r) => (Number(r.total) - Number(r.amountPaid)).toFixed(2) },
  ];

  return (
    <div>
      <PageHeader title="My Invoices" />
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} />
    </div>
  );
}
