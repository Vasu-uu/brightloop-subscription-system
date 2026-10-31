import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Toggle } from "../../components/ui/Toggle";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SearchInput } from "../../components/ui/SearchInput";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { usePagedList } from "../../hooks/usePagedList";
import { createTax, deleteTax, listTaxes, updateTax } from "../../api/taxes";
import { Tax } from "../../types";
import { errorMessage } from "../../lib/format";

export default function TaxesList() {
  const { role } = useAuth();
  const canWrite = role === "ADMIN";
  const { push } = useToast();
  const { rows, total, page, setPage, search, setSearch, loading, reload } = usePagedList<Tax>((a) =>
    listTaxes({ page: a.page, pageSize: 20, search: a.search })
  );
  const [editing, setEditing] = useState<Tax | "new" | null>(null);
  const [name, setName] = useState("");
  const [rate, setRate] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Tax | null>(null);

  function open(t: Tax | "new") {
    setName(t === "new" ? "" : t.name);
    setRate(t === "new" ? 0 : t.ratePercent);
    setActive(t === "new" ? true : t.isActive);
    setEditing(t);
  }

  async function save() {
    if (!name.trim()) return push("Name is required", "error");
    setSaving(true);
    try {
      if (editing === "new") await createTax({ name, ratePercent: Number(rate) });
      else if (editing) await updateTax(editing.id, { name, ratePercent: Number(rate), isActive: active });
      push("Tax saved");
      setEditing(null);
      reload();
    } catch (err) {
      push(errorMessage(err, "Failed to save tax"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteTax(toDelete.id);
      push("Tax deleted");
      reload();
    } catch (err) {
      push(errorMessage(err, "Could not delete tax"), "error");
    } finally {
      setToDelete(null);
    }
  }

  const columns: Column<Tax>[] = [
    { key: "name", header: "Tax rule", render: (r) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.name}</span> },
    { key: "rate", header: "Rate", render: (r) => <span className="tabular-nums">{r.ratePercent}%</span> },
    {
      key: "active",
      header: "Status",
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
          {r.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        canWrite ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" onClick={() => open(r)} aria-label="Edit">
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
        title="Taxes"
        description="Rules applied automatically to every invoice line through the product's tax."
        actions={
          canWrite && (
            <Button onClick={() => open("new")}>
              <Plus className="h-4 w-4" /> New tax
            </Button>
          )
        }
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search taxes" />
      </div>
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} />

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New tax" : "Edit tax"}>
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="GST 18%" autoFocus />
          <Input label="Rate (%)" type="number" min={0} max={100} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          {editing !== "new" && <Toggle label="Active" checked={active} onChange={setActive} />}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save tax
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete tax"
        message={`Delete "${toDelete?.name}"? Taxes assigned to products cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
