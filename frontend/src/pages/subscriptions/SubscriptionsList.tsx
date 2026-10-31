import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, Column } from "../../components/ui/DataTable";
import { listSubscriptions } from "../../api/subscriptions";
import { listCustomers } from "../../api/customers";
import { Subscription, User } from "../../types";
import { SUBSCRIPTION_STATUSES } from "../../constants/enums";

export default function SubscriptionsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCustomers().then((r) => setCustomers(r.data)).catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      listSubscriptions({
        page,
        search: search || undefined,
        status: status || undefined,
        customerId: customerId ? Number(customerId) : undefined,
      })
        .then((res) => {
          setRows(res.data);
          setTotal(res.meta.total);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [page, search, status, customerId]);

  const columns: Column<Subscription>[] = [
    { key: "number", header: "Number", render: (r) => r.number },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? r.customerId },
    { key: "plan", header: "Plan", render: (r) => r.plan?.name ?? r.planId },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "startDate", header: "Start", render: (r) => new Date(r.startDate).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button variant="ghost" onClick={() => navigate(`/app/subscriptions/${r.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        actions={<Button onClick={() => navigate("/app/subscriptions/new")}>New Subscription</Button>}
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
            {SUBSCRIPTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <Select
            value={customerId}
            onChange={(e) => {
              setPage(1);
              setCustomerId(e.target.value);
            }}
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
