import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useToast } from "../../components/ui/Toast";
import { createTemplate, getTemplate, TemplateLineInput, updateTemplate } from "../../api/templates";
import { listPlans } from "../../api/plans";
import { listProducts } from "../../api/products";
import { Plan, Product } from "../../types";

export default function TemplateForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { push } = useToast();

  const [name, setName] = useState("");
  const [planId, setPlanId] = useState<number | "">("");
  const [validityDays, setValidityDays] = useState(30);
  const [lines, setLines] = useState<TemplateLineInput[]>([{ productId: 0, variantId: null, quantity: 1 }]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listPlans().then((r) => setPlans(r.data)).catch(() => setPlans([]));
    listProducts().then((r) => setProducts(r.data)).catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    getTemplate(Number(id)).then((t) => {
      setName(t.name);
      setPlanId(t.planId);
      setValidityDays(t.validityDays);
      setLines(
        (t.lines ?? []).map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity }))
      );
    });
  }, [id]);

  function updateLine(index: number, patch: Partial<TemplateLineInput>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!planId) {
      push("Select a plan", "error");
      return;
    }
    setSaving(true);
    try {
      const input = { name, planId: Number(planId), validityDays, lines };
      if (isEdit) {
        await updateTemplate(Number(id), input);
      } else {
        await createTemplate(input);
      }
      push("Template saved");
      navigate("/app/templates");
    } catch (err: any) {
      push(err?.response?.data?.error?.message ?? "Failed to save template", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Template" : "New Template"} />
      <div className="max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white shadow-card animate-fade-in-up dark:border-gray-800 dark:bg-gray-900 p-6">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select label="Plan" value={planId} onChange={(e) => setPlanId(Number(e.target.value))}>
          <option value="">Select a plan</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          label="Validity (days)"
          value={validityDays}
          onChange={(e) => setValidityDays(Number(e.target.value))}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lines</span>
            <Button
              variant="secondary"
              onClick={() => setLines((prev) => [...prev, { productId: 0, variantId: null, quantity: 1 }])}
            >
              Add line
            </Button>
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={line.productId}
                  onChange={(e) => updateLine(i, { productId: Number(e.target.value) })}
                  className="flex-1"
                >
                  <option value={0}>Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                  className="w-24"
                />
                <Button variant="danger" onClick={() => removeLine(i)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate("/app/templates")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
