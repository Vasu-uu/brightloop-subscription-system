import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useToast } from "../../components/ui/Toast";
import { createTemplate, getTemplate, TemplateLineInput, updateTemplate } from "../../api/templates";
import { listPlans } from "../../api/plans";
import { listProducts } from "../../api/products";
import { Plan, Product } from "../../types";
import { errorMessage, formatDate } from "../../lib/format";

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
    listPlans().then((r) => setPlans(r.data));
    listProducts().then((r) => setProducts(r.data));
  }, []);

  useEffect(() => {
    if (!id) return;
    getTemplate(Number(id)).then((t) => {
      setName(t.name);
      setPlanId(t.planId);
      setValidityDays(t.validityDays);
      setLines((t.lines ?? []).map((l) => ({ productId: l.productId, variantId: l.variantId ?? null, quantity: l.quantity })));
    });
  }, [id]);

  const plan = plans.find((p) => p.id === planId);
  const update = (i: number, patch: Partial<TemplateLineInput>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  async function submit() {
    if (!name.trim()) return push("Give the template a name", "error");
    if (!planId) return push("Choose a plan", "error");
    if (lines.some((l) => !l.productId)) return push("Choose a product on every line", "error");
    setSaving(true);
    try {
      const input = { name, planId: Number(planId), validityDays, lines };
      if (isEdit) await updateTemplate(Number(id), input);
      else await createTemplate(input);
      push("Template saved");
      navigate("/app/templates");
    } catch (err) {
      push(errorMessage(err, "Failed to save template"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate("/app/templates")} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Quotation templates
      </button>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
        {isEdit ? "Edit template" : "New template"}
      </h1>

      <div className="space-y-6">
        <Card title="Template" description="A reusable offer: the right plan and product lines, valid for a set number of days.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enterprise yearly offer" autoFocus />
            </div>
            <Select label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Select a plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.billingPeriod.toLowerCase()})
                </option>
              ))}
            </Select>
            <Input label="Quotation valid for (days)" type="number" min={1} value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} />
          </div>
          {plan && (
            <p className="mt-3 text-xs text-gray-500">
              Minimum quantity per line: {plan.minQuantity}. Available from {formatDate(plan.availableFrom)}.
            </p>
          )}
        </Card>

        <Card
          title="Lines"
          actions={
            <Button variant="secondary" onClick={() => setLines((p) => [...p, { productId: 0, variantId: null, quantity: 1 }])}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          }
        >
          <div className="space-y-3">
            {lines.map((line, i) => {
              const product = products.find((p) => p.id === line.productId);
              return (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_1fr_90px_auto] items-end gap-2">
                  <Select label={i === 0 ? "Product" : undefined} value={line.productId} onChange={(e) => update(i, { productId: Number(e.target.value), variantId: null })}>
                    <option value={0}>Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label={i === 0 ? "Variant" : undefined}
                    value={line.variantId ?? ""}
                    disabled={!product?.variants?.length}
                    onChange={(e) => update(i, { variantId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">{product?.variants?.length ? "Standard" : "No variants"}</option>
                    {product?.variants?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.value}
                        {v.extraPrice > 0 ? ` (+${v.extraPrice})` : ""}
                      </option>
                    ))}
                  </Select>
                  <Input label={i === 0 ? "Qty" : undefined} type="number" min={1} value={line.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
                  <Button variant="ghost" disabled={lines.length === 1} onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))} aria-label="Remove line">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate("/app/templates")}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Save template
          </Button>
        </div>
      </div>
    </div>
  );
}
