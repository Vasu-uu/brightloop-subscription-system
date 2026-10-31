import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DataTable, Column } from "../../components/ui/DataTable";
import { listTemplates } from "../../api/templates";
import { QuotationTemplate } from "../../types";

export default function TemplatesList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<QuotationTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      listTemplates({ page, search: search || undefined })
        .then((res) => {
          setRows(res.data);
          setTotal(res.meta.total);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [page, search]);

  const columns: Column<QuotationTemplate>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    { key: "plan", header: "Plan", render: (r) => r.plan?.name ?? r.planId },
    { key: "validityDays", header: "Validity (days)", render: (r) => r.validityDays },
    { key: "active", header: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button variant="ghost" onClick={() => navigate(`/app/templates/${r.id}`)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotation Templates"
        actions={<Button onClick={() => navigate("/app/templates/new")}>New Template</Button>}
      />
      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
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
