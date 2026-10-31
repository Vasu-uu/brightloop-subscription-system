import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { listMySubscriptions } from "../../api/portal";
import { Subscription } from "../../types";

export default function MySubscriptions() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listMySubscriptions(page)
      .then((res) => {
        setRows(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const columns: Column<Subscription>[] = [
    {
      key: "number",
      header: "Number",
      render: (r) => (
        <button className="text-indigo-600 hover:underline" onClick={() => navigate(`/portal/subscriptions/${r.id}`)}>
          {r.number}
        </button>
      ),
    },
    { key: "plan", header: "Plan", render: (r) => r.plan?.name ?? r.planId },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "startDate", header: "Start", render: (r) => new Date(r.startDate).toLocaleDateString() },
    { key: "expiryDate", header: "Expires", render: (r) => new Date(r.expiryDate).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="My Subscriptions" />
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} />
    </div>
  );
}
