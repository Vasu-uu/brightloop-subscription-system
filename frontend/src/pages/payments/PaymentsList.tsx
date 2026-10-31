import { useEffect, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable, Column } from "../../components/ui/DataTable";
import { listPayments } from "../../api/payments";
import { Payment } from "../../types";

export default function PaymentsList() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayments(page)
      .then((res) => {
        setRows(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const columns: Column<Payment & { invoice?: { number: string } }>[] = [
    { key: "invoice", header: "Invoice", render: (r: any) => r.invoice?.number ?? r.invoiceId },
    { key: "method", header: "Method", render: (r) => r.method },
    { key: "amount", header: "Amount", render: (r) => Number(r.amount).toFixed(2) },
    { key: "paymentDate", header: "Date", render: (r) => new Date(r.paymentDate).toLocaleDateString() },
    { key: "note", header: "Note", render: (r) => r.note ?? "" },
  ];

  return (
    <div>
      <PageHeader title="Payments" />
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} />
    </div>
  );
}
