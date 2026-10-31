import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Toggle } from "../../components/ui/Toggle";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SearchInput } from "../../components/ui/SearchInput";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { usePagedList } from "../../hooks/usePagedList";
import { createPlan, deletePlan, listPlans, PlanInput, updatePlan } from "../../api/plans";
import { BillingPeriod, Plan } from "../../types";
import { BILLING_PERIODS } from "../../constants/enums";
import { errorMessage, formatDate, formatMoney, toDateInput } from "../../lib/format";

type Draft = Omit<PlanInput, "availableTo"> & { availableTo: string };
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = (): Draft => ({
  name: "",
  price: 0,
  billingPeriod: "MONTHLY",
  minQuantity: 1,
  availableFrom: today(),
  availableTo: "",
  autoClose: false,
  allowEarlyClose: false,
  allowPause: false,
  allowRenew: false,
});

const RULES: { key: keyof Plan; label: string }[] = [
  { key: "autoClose", label: "Auto-close" },
  { key: "allowEarlyClose", label: "Early close" },
  { key: "allowPause", label: "Pause" },
  { key: "allowRenew", label: "Renew" },
];

export default function PlansList() {
  const { role } = useAuth();
  const canWrite = role === "ADMIN";
  const { push } = useToast();
  const { rows, total, page, setPage, search, setSearch, loading, reload } = usePagedList<Plan>((a) =>
    listPlans({ page: a.page, pageSize: 20, search: a.search })
  );
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY());
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Plan | null>(null);

  function openEdit(p: Plan) {
    setDraft({
      name: p.name,
      price: p.price,
      billingPeriod: p.billingPeriod,
      minQuantity: p.minQuantity,
      availableFrom: toDateInput(p.availableFrom),
      availableTo: toDateInput(p.availableTo),
      autoClose: p.autoClose,
      allowEarlyClose: p.allowEarlyClose,
      allowPause: p.allowPause,
      allowRenew: p.allowRenew,
    });
    setEditing(p);
  }

  async function save() {
    if (!draft.name.trim()) return push("Name is required", "error");
    setSaving(true);
    try {
      const payload: PlanInput = {
        ...draft,
        price: Number(draft.price),
        minQuantity: Number(draft.minQuantity),
        availableTo: draft.availableTo || null,
      };
      if (editing === "new") await createPlan(payload);
      else if (editing) await updatePlan(editing.id, payload);
      push("Plan saved");
      setEditing(null);
      reload();
    } catch (err) {
      push(errorMessage(err, "Failed to save plan"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deletePlan(toDelete.id);
      push("Plan deleted");
      reload();
    } catch (err) {
      push(errorMessage(err, "Could not delete plan"), "error");
    } finally {
      setToDelete(null);
    }
  }

  const columns: Column<Plan>[] = [
    { key: "name", header: "Plan", render: (r) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.name}</span> },
    { key: "price", header: "Price", render: (r) => <span className="tabular-nums">{formatMoney(r.price)}</span> },
    {
      key: "period",
      header: "Billing",
      render: (r) => <span className="capitalize">{r.billingPeriod.toLowerCase()}</span>,
    },
    { key: "min", header: "Min qty", render: (r) => r.minQuantity },
    {
      key: "avail",
      header: "Available",
      render: (r) => (
        <span className="text-gray-600 dark:text-gray-400">
          {formatDate(r.availableFrom)} - {r.availableTo ? formatDate(r.availableTo) : "open-ended"}
        </span>
      ),
    },
    {
      key: "rules",
      header: "Rules",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {RULES.filter((x) => r[x.key]).map((x) => (
            <span key={x.key} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-500/10 dark:text-green-300">
              {x.label}
            </span>
          ))}
          {!RULES.some((x) => r[x.key]) && <span className="text-gray-400">None</span>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        canWrite ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" onClick={() => openEdit(r)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => setToDelete(r)} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Billing period, availability and what customers may do with a subscription."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setDraft(EMPTY());
                setEditing("new");
              }}
            >
              <Plus className="h-4 w-4" /> New plan
            </Button>
          )
        }
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search plans" />
      </div>
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} />

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New plan" : "Edit plan"} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
          <Input label="Listed price" type="number" min={0} value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
          <Select label="Billing period" value={draft.billingPeriod} onChange={(e) => setDraft({ ...draft, billingPeriod: e.target.value as BillingPeriod })}>
            {BILLING_PERIODS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
          <Input label="Minimum quantity per line" type="number" min={1} value={draft.minQuantity} onChange={(e) => setDraft({ ...draft, minQuantity: Number(e.target.value) })} />
          <Input label="Available from" type="date" value={draft.availableFrom} onChange={(e) => setDraft({ ...draft, availableFrom: e.target.value })} />
          <Input label="Available until (optional)" type="date" value={draft.availableTo} onChange={(e) => setDraft({ ...draft, availableTo: e.target.value })} />
        </div>
        <div className="mt-5 space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <Toggle label="Close automatically" description="Closes itself once the expiry date has passed." checked={draft.autoClose} onChange={(v) => setDraft({ ...draft, autoClose: v })} />
          <Toggle label="Allow early close" description="Staff may close a subscription before it is active or before expiry." checked={draft.allowEarlyClose} onChange={(v) => setDraft({ ...draft, allowEarlyClose: v })} />
          <Toggle label="Allow pause" description="Active subscriptions can be paused and resumed." checked={draft.allowPause} onChange={(v) => setDraft({ ...draft, allowPause: v })} />
          <Toggle label="Allow renew" description="Active subscriptions can be extended by one billing period." checked={draft.allowRenew} onChange={(v) => setDraft({ ...draft, allowRenew: v })} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save plan
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete plan"
        message={`Delete "${toDelete?.name}"? Plans used by subscriptions cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
