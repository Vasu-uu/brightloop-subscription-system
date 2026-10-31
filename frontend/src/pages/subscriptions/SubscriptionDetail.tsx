import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/Toast";
import {
  createSubscription,
  getSubscription,
  pauseSubscription,
  renewSubscription,
  resumeSubscription,
  SubscriptionLineInput,
  transitionSubscription,
  updateSubscription,
} from "../../api/subscriptions";
import { listCustomers } from "../../api/customers";
import { listPlans } from "../../api/plans";
import { listProducts } from "../../api/products";
import { listTaxes } from "../../api/taxes";
import { Plan, Product, Subscription, SubscriptionStatus, Tax, User } from "../../types";
import { SUBSCRIPTION_STATUSES } from "../../constants/enums";

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export default function SubscriptionDetail() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { push } = useToast();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [planId, setPlanId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [paymentTermDays, setPaymentTermDays] = useState(0);
  const [lines, setLines] = useState<SubscriptionLineInput[]>([{ productId: 0, variantId: null, quantity: 1 }]);

  const [customers, setCustomers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCustomers().then((r) => setCustomers(r.data)).catch(() => setCustomers([]));
    listPlans().then((r) => setPlans(r.data)).catch(() => setPlans([]));
    listProducts().then((r) => setProducts(r.data)).catch(() => setProducts([]));
    listTaxes().then((r) => setTaxes(r.data)).catch(() => setTaxes([]));
  }, []);

  function loadSubscription() {
    if (!id) return;
    getSubscription(Number(id)).then((s) => {
      setSubscription(s);
      setCustomerId(s.customerId);
      setPlanId(s.planId);
      setStartDate(toDateInput(s.startDate));
      setExpiryDate(toDateInput(s.expiryDate));
      setPaymentTermDays(s.paymentTermDays);
      setLines((s.lines ?? []).map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })));
    });
  }

  useEffect(loadSubscription, [id]);

  const selectedPlan = plans.find((p) => p.id === planId) || subscription?.plan;

  const preview = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    const previewLines = lines.map((line) => {
      const product = products.find((p) => p.id === line.productId);
      const variant = product?.variants?.find((v) => v.id === line.variantId);
      const unitPrice = (product?.salesPrice ?? 0) + (variant?.extraPrice ?? 0);
      const tax = taxes.find((t) => t.id === product?.taxId);
      const amount = unitPrice * line.quantity;
      const taxAmount = tax ? Math.round(((amount * tax.ratePercent) / 100) * 100) / 100 : 0;
      subtotal += amount;
      taxTotal += taxAmount;
      return { ...line, unitPrice, amount, taxPercent: tax?.ratePercent ?? 0, taxAmount };
    });
    return { previewLines, subtotal, taxTotal, total: subtotal + taxTotal };
  }, [lines, products, taxes]);

  function updateLine(index: number, patch: Partial<SubscriptionLineInput>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function handleSave() {
    if (!customerId || !planId) {
      push("Select a customer and plan", "error");
      return;
    }
    setSaving(true);
    try {
      const input = {
        customerId: Number(customerId),
        planId: Number(planId),
        startDate,
        expiryDate,
        paymentTermDays,
        lines,
      };
      if (isNew) {
        const created = await createSubscription(input);
        push("Subscription created");
        navigate(`/app/subscriptions/${created.id}`);
      } else {
        await updateSubscription(Number(id), input);
        push("Subscription saved");
        loadSubscription();
      }
    } catch (err: any) {
      push(err?.response?.data?.error?.message ?? "Failed to save subscription", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTransition(to: SubscriptionStatus) {
    if (!id) return;
    try {
      await transitionSubscription(Number(id), to);
      push(`Moved to ${to}`);
      loadSubscription();
    } catch (err: any) {
      push(err?.response?.data?.error?.message ?? "Transition failed", "error");
    }
  }

  async function handleAction(action: "pause" | "resume" | "renew") {
    if (!id) return;
    try {
      const fn = action === "pause" ? pauseSubscription : action === "resume" ? resumeSubscription : renewSubscription;
      await fn(Number(id));
      push(`${action} succeeded`);
      loadSubscription();
    } catch (err: any) {
      push(err?.response?.data?.error?.message ?? `${action} failed`, "error");
    }
  }

  const currentIndex = subscription ? SUBSCRIPTION_STATUSES.indexOf(subscription.status) : -1;
  const nextStatus = currentIndex >= 0 && currentIndex < 4 ? SUBSCRIPTION_STATUSES[currentIndex + 1] : null;

  return (
    <div>
      <PageHeader title={isNew ? "New Subscription" : subscription?.number ?? "Loading..."} />

      {subscription && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            {SUBSCRIPTION_STATUSES.map((s, i) => (
              <span key={s} className={`flex items-center gap-2 ${i > currentIndex ? "opacity-40" : ""}`}>
                <StatusBadge status={s} />
                {i < SUBSCRIPTION_STATUSES.length - 1 && <span className="text-gray-300">→</span>}
              </span>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            {nextStatus && (
              <Button onClick={() => handleTransition(nextStatus)}>Move to {nextStatus}</Button>
            )}
            {selectedPlan?.allowEarlyClose && subscription.status !== "ACTIVE" && subscription.status !== "CLOSED" && (
              <Button variant="secondary" onClick={() => handleTransition("CLOSED")}>
                Close early
              </Button>
            )}
            {selectedPlan?.allowPause && subscription.status === "ACTIVE" && !subscription.isPaused && (
              <Button variant="secondary" onClick={() => handleAction("pause")}>
                Pause
              </Button>
            )}
            {subscription.isPaused && (
              <Button variant="secondary" onClick={() => handleAction("resume")}>
                Resume
              </Button>
            )}
            {selectedPlan?.allowRenew && subscription.status === "ACTIVE" && (
              <Button variant="secondary" onClick={() => handleAction("renew")}>
                Renew
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid max-w-4xl grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-6">
        <Select label="Customer" value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>
          <option value="">Select a customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select label="Plan" value={planId} onChange={(e) => setPlanId(Number(e.target.value))}>
          <option value="">Select a plan</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Input type="date" label="Start date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" label="Expiry date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        <Input
          type="number"
          label="Payment terms (days)"
          value={paymentTermDays}
          onChange={(e) => setPaymentTermDays(Number(e.target.value))}
        />

        <div className="col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Lines</span>
            <Button
              variant="secondary"
              onClick={() => setLines((prev) => [...prev, { productId: 0, variantId: null, quantity: 1 }])}
            >
              Add line
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="pb-1">Product</th>
                <th className="pb-1">Qty</th>
                <th className="pb-1">Unit price</th>
                <th className="pb-1">Tax %</th>
                <th className="pb-1">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {preview.previewLines.map((line, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2">
                    <Select
                      value={line.productId}
                      onChange={(e) => updateLine(i, { productId: Number(e.target.value) })}
                    >
                      <option value={0}>Select</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-1 pr-2">
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                      className="w-20"
                    />
                  </td>
                  <td className="py-1 pr-2">{line.unitPrice.toFixed(2)}</td>
                  <td className="py-1 pr-2">{line.taxPercent}%</td>
                  <td className="py-1 pr-2">{line.amount.toFixed(2)}</td>
                  <td>
                    <Button variant="danger" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex justify-end text-sm">
            <div className="w-56 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{preview.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{preview.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{preview.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate("/app/subscriptions")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
