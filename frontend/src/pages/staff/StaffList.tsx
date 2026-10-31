import { useState } from "react";
import { Check, Circle, Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { SearchInput } from "../../components/ui/SearchInput";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { usePagedList } from "../../hooks/usePagedList";
import { createStaff, listStaff } from "../../api/staff";
import { User } from "../../types";
import { errorMessage, formatDate } from "../../lib/format";

const RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: "More than 8 characters", test: (pw) => pw.length > 8 },
  { label: "An uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "A lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "A special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function StaffList() {
  const { push } = useToast();
  const { rows, total, page, setPage, search, setSearch, loading, reload } = usePagedList<User>((a) =>
    listStaff({ page: a.page, search: a.search })
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [emailError, setEmailError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function save() {
    setEmailError(undefined);
    setSaving(true);
    try {
      await createStaff({ ...form, phone: form.phone || undefined });
      push("Staff member added");
      setOpen(false);
      setForm({ name: "", email: "", password: "", phone: "" });
      reload();
    } catch (err) {
      const e = err as { response?: { data?: { error?: { fields?: Record<string, string> } } } };
      if (e.response?.data?.error?.fields?.email) setEmailError(e.response.data.error.fields.email);
      else push(errorMessage(err, "Could not add staff member"), "error");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            {r.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">{r.name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (r) => r.email },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "-" },
    { key: "created", header: "Added", render: (r) => formatDate(r.createdAt) },
    {
      key: "active",
      header: "Status",
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300" : "bg-gray-100 text-gray-500"}`}>
          {r.isActive ? "Active" : "Disabled"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Internal team members who handle customers day to day. Only admins can add staff."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add staff
          </Button>
        }
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search staff" />
      </div>
      <DataTable columns={columns} rows={rows} page={page} pageSize={20} total={total} onPageChange={setPage} loading={loading} />

      <Modal open={open} onClose={() => setOpen(false)} title="Add staff member">
        <div className="space-y-3">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <Input label="Email" type="email" value={form.email} error={emailError} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Temporary password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            {RULES.map((r) => {
              const ok = r.test(form.password);
              return (
                <li key={r.label} className={`flex items-center gap-1 ${ok ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                  {ok ? <Check className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!form.name || !form.email || !RULES.every((r) => r.test(form.password))}>
            Add staff
          </Button>
        </div>
      </Modal>
    </div>
  );
}
