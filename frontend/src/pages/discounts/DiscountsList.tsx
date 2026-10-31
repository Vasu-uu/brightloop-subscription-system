import { useEffect, useState } from "react";
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
import { createDiscount, deleteDiscount, DiscountInput, DiscountRow, listDiscounts, updateDiscount } from "../../api/discounts";
import { listProducts } from "../../api/products";
import { Product } from "../../types";
import { errorMessage, formatDate, formatMoney, toDateInput } from "../../lib/format";

type Draft = {
  name: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  appliesTo: "PRODUCT" | "SUBSCRIPTION";
  minPurchase: string;
  minQuantity: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  productIds: number[];
  isActive: boolean;
};
const EMPTY = (): Draft => ({
  name: "",
  type: "PERCENTAGE",
  value: 10,
  appliesTo: "SUBSCRIPTION",
  minPurchase: "",
  minQuantity: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  usageLimit: "",
  productIds: [],
  isActive: true,
});

function state(d: DiscountRow): { label: string; cls: string } {
  const now = Date.now();
  if (!d.isActive) return { label: "Inactive", cls: "bg-gray-100 text-gray-500 dark:bg-gray-800" };
  if (d.endDate && new Date(d.endDate).getTime() < now) return { label: "Expired", cls: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" };
  if (d.usageLimit != null && d.usedCount >= d.usageLimit) return { label: "Used up", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" };
  if (new Date(d.startDate).getTime() > now) return { label: "Scheduled", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" };
  return { label: "Live", cls: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300" };
}

export default function DiscountsList() {
  const { role } = useAuth();
  const canWrite = role === "ADMIN";
  const { push } = useToast();
  const { rows, total, page, setPage, search, setSearch, loading, reload } = usePagedList<DiscountRow>((a) =>
    listDiscounts({ page: a.page, search: a.search })
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<DiscountRow | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY());
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<DiscountRow | null>(null);

  useEffect(() => {
    listProducts().then((r) => setProducts(r.data));
  }, []);

  function openEdit(d: DiscountRow) {
    setDraft({
      name: d.name,
      type: d.type,
      value: d.value,
      appliesTo: d.appliesTo,
      minPurchase: d.minPurchase != null ? String(d.minPurchase) : "",
      minQuantity: d.minQuantity != null ? String(d.minQuantity) : "",
      startDate: toDateInput(d.startDate),
      endDate: toDateInput(d.endDate),
      usageLimit: d.usageLimit != null ? String(d.usageLimit) : "",
      productIds: (d.products ?? []).map((p) => p.id),
      isActive: d.isActive,
    });
    setEditing(d);
  }

  async function save() {
    if (!draft.name.trim()) return push("Name is required", "error");
    setSaving(true);
    try {
      const payload: DiscountInput & { isActive: boolean } = {
        name: draft.name,
        type: draft.type,
        value: Number(draft.value),
        appliesTo: draft.appliesTo,
        minPurchase: draft.minPurchase ? Number(draft.minPurchase) : null,
        minQuantity: draft.minQuantity ? Number(draft.minQuantity) : null,
        startDate: draft.startDate,
        endDate: draft.endDate || null,
        usageLimit: draft.usageLimit ? Number(draft.usageLimit) : null,
        productIds: draft.appliesTo === "PRODUCT" ? draft.productIds : [],
        isActive: draft.isActive,
      };
      if (editing === "new") {
        const { isActive: _ignored, ...create } = payload;
        await createDiscount(create);
      } else if (editing) await updateDiscount(editing.id, payload);
      push("Discount saved");
      setEditing(null);
      reload();
    } catch (err) {
      push(errorMessage(err, "Failed to save discount"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteDiscount(toDelete.id);
      push("Discount deleted");
      reload();
    } catch (err) {
      push(errorMessage(err, "Could not delete discount"), "error");
    } finally {
      setToDelete(null);
    }
  }

  const toggleProduct = (id: number) =>
    setDraft((d) => ({ ...d, productIds: d.productIds.includes(id) ? d.productIds.filter((x) => x !== id) : [...d.productIds, id] }));

  const columns: Column<DiscountRow>[] = [
    { key: "name", header: "Discount", render: (r) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.name}</span> },
    {
      key: "value",
      header: "Value",
      render: (r) => <span className="tabular-nums">{r.type === "PERCENTAGE" ? `${r.value}%` : formatMoney(r.value)}</span>,
    },
    {
      key: "applies",
      header: "Applies to",
      render: (r) =>
        r.appliesTo === "SUBSCRIPTION" ? (
          "Whole subscription"
        ) : (
          <span title={(r.products ?? []).map((p) => p.name).join(", ")}>
            {(r.products ?? []).length} product{(r.products ?? []).length === 1 ? "" : "s"}
          </span>
        ),
    },
    {
      key: "conditions",
      header: "Conditions",
      render: (r) => (
        <span className="text-gray-600 dark:text-gray-400">
          {r.minPurchase != null ? `Min ${formatMoney(r.minPurchase)}` : ""}
          {r.minPurchase != null && r.minQuantity != null ? ", " : ""}
          {r.minQuantity != null ? `Min qty ${r.minQuantity}` : ""}
          {r.minPurchase == null && r.minQuantity == null ? "None" : ""}
        </span>
      ),
    },
    { key: "valid", header: "Valid", render: (r) => `${formatDate(r.startDate)} - ${r.endDate ? formatDate(r.endDate) : "no end"}` },
    { key: "usage", header: "Used", render: (r) => `${r.usedCount}${r.usageLimit != null ? ` / ${r.usageLimit}` : ""}` },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const s = state(r);
        return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
      },
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
        title="Discounts"
        description="Applied automatically to the next invoice when eligible, until they expire or run out."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setDraft(EMPTY());
                setEditing("new");
              }}
            >
              <Plus className="h-4 w-4" /> New discount
            </Button>
          )
        }
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search discounts" />
      </div>
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} />

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New discount" : "Edit discount"} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
          </div>
          <Select label="Type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Draft["type"] })}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed amount</option>
          </Select>
          <Input label={draft.type === "PERCENTAGE" ? "Percent off" : "Amount off"} type="number" min={0} value={draft.value} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })} />
          <Select label="Applies to" value={draft.appliesTo} onChange={(e) => setDraft({ ...draft, appliesTo: e.target.value as Draft["appliesTo"] })}>
            <option value="SUBSCRIPTION">Whole subscription</option>
            <option value="PRODUCT">Specific products</option>
          </Select>
          <Input label="Usage limit (optional)" type="number" min={1} value={draft.usageLimit} onChange={(e) => setDraft({ ...draft, usageLimit: e.target.value })} />
          <Input label="Minimum purchase (optional)" type="number" min={0} value={draft.minPurchase} onChange={(e) => setDraft({ ...draft, minPurchase: e.target.value })} />
          <Input label="Minimum quantity (optional)" type="number" min={1} value={draft.minQuantity} onChange={(e) => setDraft({ ...draft, minQuantity: e.target.value })} />
          <Input label="Start date" type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
          <Input label="End date (optional)" type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
        </div>

        {draft.appliesTo === "PRODUCT" && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Eligible products</p>
            <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-800">
              {products.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input type="checkbox" checked={draft.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="rounded border-gray-300 text-brand-600" />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {editing !== "new" && (
          <div className="mt-4">
            <Toggle label="Active" description="Inactive discounts are never applied." checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save discount
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete discount"
        message={`Delete "${toDelete?.name}"? Invoices that already used it keep their history only if it has not been applied.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
