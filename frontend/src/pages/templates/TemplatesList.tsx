import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SearchInput } from "../../components/ui/SearchInput";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { usePagedList } from "../../hooks/usePagedList";
import { deleteTemplate, listTemplates } from "../../api/templates";
import { QuotationTemplate } from "../../types";
import { errorMessage } from "../../lib/format";

type Row = QuotationTemplate & { _count?: { lines: number } };

export default function TemplatesList() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { rows, total, page, setPage, search, setSearch, loading, reload } = usePagedList<Row>((a) =>
    listTemplates({ page: a.page, search: a.search })
  );
  const [toDelete, setToDelete] = useState<Row | null>(null);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteTemplate(toDelete.id);
      push("Template deleted");
      reload();
    } catch (err) {
      push(errorMessage(err, "Could not delete template"), "error");
    } finally {
      setToDelete(null);
    }
  }

  const columns: Column<Row>[] = [
    { key: "name", header: "Template", render: (r) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.name}</span> },
    { key: "plan", header: "Plan", render: (r) => r.plan?.name ?? r.planId },
    { key: "lines", header: "Lines", render: (r) => r._count?.lines ?? "-" },
    { key: "validity", header: "Quotation valid for", render: (r) => `${r.validityDays} days` },
    {
      key: "active",
      header: "Status",
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300" : "bg-gray-100 text-gray-500"}`}>
          {r.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" onClick={() => navigate(`/app/templates/${r.id}`)} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => setToDelete(r)} aria-label="Delete">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotation templates"
        description="Pre-built offers that turn into subscriptions in one click."
        actions={
          <Button onClick={() => navigate("/app/templates/new")}>
            <Plus className="h-4 w-4" /> New template
          </Button>
        }
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search templates" />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        page={page}
        pageSize={20}
        total={total}
        onPageChange={setPage}
        loading={loading}
        onRowClick={(r) => navigate(`/app/templates/${r.id}`)}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete template"
        message={`Delete "${toDelete?.name}"? Templates already used by a subscription cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
