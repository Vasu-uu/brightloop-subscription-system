import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SearchInput } from "../../components/ui/SearchInput";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { usePagedList } from "../../hooks/usePagedList";
import {
  addVariant,
  createProduct,
  deleteProduct,
  deleteVariant,
  listProducts,
  updateProduct,
  updateVariant,
} from "../../api/products";
import { listTaxes } from "../../api/taxes";
import { Product, Tax } from "../../types";
import { errorMessage, formatMoney } from "../../lib/format";

type VariantDraft = { id?: number; attribute: string; value: string; extraPrice: number };
type Draft = {
  name: string;
  type: "SERVICE" | "GOODS";
  salesPrice: number;
  costPrice: number;
  taxId: number | "";
  notes: string;
  variants: VariantDraft[];
};

const EMPTY: Draft = { name: "", type: "SERVICE", salesPrice: 0, costPrice: 0, taxId: "", notes: "", variants: [] };

export default function ProductsList() {
  const { role } = useAuth();
  const canWrite = role === "ADMIN";
  const { push } = useToast();
  const { rows, total, page, setPage, search, setSearch, loading, reload } = usePagedList<Product>((a) =>
    listProducts({ page: a.page, pageSize: 20, search: a.search })
  );
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  useEffect(() => {
    listTaxes().then((r) => setTaxes(r.data));
  }, []);

  function openNew() {
    setDraft(EMPTY);
    setEditing("new");
  }

  function openEdit(p: Product) {
    setDraft({
      name: p.name,
      type: p.type,
      salesPrice: p.salesPrice,
      costPrice: p.costPrice,
      taxId: p.taxId ?? "",
      notes: p.notes ?? "",
      variants: (p.variants ?? []).map((v) => ({ id: v.id, attribute: v.attribute, value: v.value, extraPrice: v.extraPrice })),
    });
    setEditing(p);
  }

  async function save() {
    if (!draft.name.trim()) return push("Name is required", "error");
    setSaving(true);
    try {
      const base = {
        name: draft.name,
        type: draft.type,
        salesPrice: Number(draft.salesPrice),
        costPrice: Number(draft.costPrice),
        notes: draft.notes || undefined,
        taxId: draft.taxId === "" ? null : Number(draft.taxId),
      };
      const variants = draft.variants.filter((v) => v.attribute.trim() && v.value.trim());
      if (editing === "new") {
        await createProduct({ ...base, variants: variants.map(({ attribute, value, extraPrice }) => ({ attribute, value, extraPrice: Number(extraPrice) })) });
      } else if (editing) {
        await updateProduct(editing.id, base);
        const keep = new Set(variants.filter((v) => v.id).map((v) => v.id));
        for (const old of editing.variants ?? []) if (!keep.has(old.id)) await deleteVariant(editing.id, old.id);
        for (const v of variants) {
          const payload = { attribute: v.attribute, value: v.value, extraPrice: Number(v.extraPrice) };
          if (v.id) await updateVariant(editing.id, v.id, payload);
          else await addVariant(editing.id, payload);
        }
      }
      push("Product saved");
      setEditing(null);
      reload();
    } catch (err) {
      push(errorMessage(err, "Failed to save product"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteProduct(toDelete.id);
      push("Product deleted");
      reload();
    } catch (err) {
      push(errorMessage(err, "Could not delete product"), "error");
    } finally {
      setToDelete(null);
    }
  }

  const setVariant = (i: number, patch: Partial<VariantDraft>) =>
    setDraft((d) => ({ ...d, variants: d.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) }));

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{r.name}</p>
          {r.notes && <p className="max-w-xs truncate text-xs text-gray-500">{r.notes}</p>}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {r.type}
        </span>
      ),
    },
    { key: "sales", header: "Sales price", render: (r) => <span className="tabular-nums">{formatMoney(r.salesPrice)}</span> },
    { key: "cost", header: "Cost price", render: (r) => <span className="tabular-nums text-gray-500">{formatMoney(r.costPrice)}</span> },
    {
      key: "variants",
      header: "Variants",
      render: (r) =>
        r.variants && r.variants.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {r.variants.map((v) => (
              <span key={v.id} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                {v.value}
                {v.extraPrice > 0 && ` +${v.extraPrice}`}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">None</span>
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
        title="Products"
        description="What you sell. Variants such as a brand can add to the unit price."
        actions={
          canWrite && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> New product
            </Button>
          )
        }
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products" />
      </div>
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} />

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New product" : "Edit product"} wide>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
            <Select label="Type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Draft["type"] })}>
              <option value="SERVICE">Service</option>
              <option value="GOODS">Goods</option>
            </Select>
            <Input label="Sales price" type="number" min={0} value={draft.salesPrice} onChange={(e) => setDraft({ ...draft, salesPrice: Number(e.target.value) })} />
            <Input label="Cost price" type="number" min={0} value={draft.costPrice} onChange={(e) => setDraft({ ...draft, costPrice: Number(e.target.value) })} />
            <Select label="Tax" value={draft.taxId} onChange={(e) => setDraft({ ...draft, taxId: e.target.value ? Number(e.target.value) : "" })}>
              <option value="">No tax</option>
              {taxes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.ratePercent}%)
                </option>
              ))}
            </Select>
            <Input label="Notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Variants</p>
                <p className="text-xs text-gray-500">e.g. Brand / Odoo / +560 added to the unit price</p>
              </div>
              <Button variant="secondary" onClick={() => setDraft({ ...draft, variants: [...draft.variants, { attribute: "", value: "", extraPrice: 0 }] })}>
                <Plus className="h-4 w-4" /> Add variant
              </Button>
            </div>
            {draft.variants.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-400 dark:border-gray-700">
                No variants. The base sales price is used.
              </p>
            )}
            <div className="space-y-2">
              {draft.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_1fr_110px_auto] items-center gap-2">
                  <Input placeholder="Attribute (Brand)" value={v.attribute} onChange={(e) => setVariant(i, { attribute: e.target.value })} />
                  <Input placeholder="Value (Odoo)" value={v.value} onChange={(e) => setVariant(i, { value: e.target.value })} />
                  <Input type="number" placeholder="Extra" value={v.extraPrice} onChange={(e) => setVariant(i, { extraPrice: Number(e.target.value) })} />
                  <Button variant="ghost" onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, idx) => idx !== i) })} aria-label="Remove variant">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save product
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete product"
        message={`Delete "${toDelete?.name}"? This cannot be undone. Products used by subscriptions cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
