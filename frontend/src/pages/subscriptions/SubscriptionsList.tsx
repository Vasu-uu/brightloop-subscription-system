import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
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
import { createFromTemplate, listSubscriptions } from "../../api/subscriptions";
import { searchCustomers } from "../../api/customers";
import { listTemplates } from "../../api/templates";
import { QuotationTemplate, Subscription } from "../../types";
import { SUBSCRIPTION_STATUSES } from "../../constants/enums";
import { errorMessage, formatDate } from "../../lib/format";

export default function SubscriptionsList() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerLabel, setCustomerLabel] = useState("");

  const { rows, total, page, setPage, search, setSearch, loading } = usePagedList<
    Subscription,
    { status: string; customerId: number | "" }
  >((a) =>
    listSubscriptions({
      page: a.page,
      search: a.search,
      status: a.status || undefined,
      customerId: a.customerId === "" ? undefined : a.customerId,
    }),
    { status, customerId }
  );

  const [tplOpen, setTplOpen] = useState(false);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [tplId, setTplId] = useState<number | "">("");
  const [tplCustomer, setTplCustomer] = useState<number | "">("");
  const [tplCustomerLabel, setTplCustomerLabel] = useState("");
  const [tplStart, setTplStart] = useState(new Date().toISOString().slice(0, 10));
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (tplOpen) listTemplates({ pageSize: 100 }).then((r) => setTemplates(r.data));
  }, [tplOpen]);

  async function createFromTpl() {
    if (!tplId || !tplCustomer) return push("Choose a template and a customer", "error");
    setCreating(true);
    try {
      const sub = await createFromTemplate({ templateId: Number(tplId), customerId: Number(tplCustomer), startDate: tplStart });
      push(`${sub.number} created as a draft quotation`);
      navigate(`/app/subscriptions/${sub.id}`);
    } catch (err) {
      push(errorMessage(err, "Could not create from template"), "error");
    } finally {
      setCreating(false);
    }
  }

  const columns: Column<Subscription>[] = [
    { key: "number", header: "Number", render: (r) => <span className="font-semibold text-brand-700 dark:text-brand-300">{r.number}</span> },
    {
      key: "customer",
      header: "Customer",
      render: (r) => (
        <div className="leading-tight">
          <p className="font-medium text-gray-900 dark:text-gray-100">{r.customer?.name ?? r.customerId}</p>
          <p className="text-xs text-gray-500">{r.customer?.email}</p>
        </div>
      ),
    },
    { key: "plan", header: "Plan", render: (r) => r.plan?.name ?? r.planId },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.isPaused ? "PAUSED" : r.status} /> },
    { key: "period", header: "Term", render: (r) => `${formatDate(r.startDate)} - ${formatDate(r.expiryDate)}` },
    { key: "next", header: "Next billing", render: (r) => formatDate(r.nextBillingDate) },
  ];

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Every customer subscription and where it stands in its lifecycle."
        actions={
          <>
            <Button variant="secondary" onClick={() => setTplOpen(true)}>
              <FileText className="h-4 w-4" /> From template
            </Button>
            <Button onClick={() => navigate("/app/subscriptions/new")}>
              <Plus className="h-4 w-4" /> New subscription
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_280px]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by number, e.g. SUB-00012" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {SUBSCRIPTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <div className="flex-1">
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
          {customerId !== "" && (
            <Button
              variant="ghost"
              onClick={() => {
                setCustomerId("");
                setCustomerLabel("");
              }}
            >
              Clear
            </Button>
          )}
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
        onRowClick={(r) => navigate(`/app/subscriptions/${r.id}`)}
      />

      <Modal open={tplOpen} onClose={() => setTplOpen(false)} title="Create from quotation template">
        <p className="mb-4 text-sm text-gray-500">
          Copies the template's plan and lines into a new draft and sets how long the quotation stays valid.
        </p>
        <div className="space-y-4">
          <Select label="Template" value={tplId} onChange={(e) => setTplId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Select a template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} - {t.plan?.name} - valid {t.validityDays} days
              </option>
            ))}
          </Select>
          <Combobox
            label="Customer"
            value={tplCustomer}
            selectedLabel={tplCustomerLabel}
            placeholder="Search customers"
            fetchOptions={searchCustomers}
            onChange={(o) => {
              setTplCustomer(o.id);
              setTplCustomerLabel(o.label);
            }}
          />
          <Input label="Start date" type="date" value={tplStart} onChange={(e) => setTplStart(e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setTplOpen(false)}>
            Cancel
          </Button>
          <Button onClick={createFromTpl} loading={creating}>
            Create quotation
          </Button>
        </div>
      </Modal>
    </div>
  );
}
