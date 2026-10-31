import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Pause, Play, Plus, RefreshCw, Trash2, XCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Combobox } from "../../components/ui/Combobox";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Stepper } from "../../components/ui/Stepper";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/Skeleton";
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
import { searchCustomers } from "../../api/customers";
import { listPlans } from "../../api/plans";
import { listProducts } from "../../api/products";
import { listTaxes } from "../../api/taxes";
import { Plan, Product, Subscription, SubscriptionStatus, Tax } from "../../types";
import { SUBSCRIPTION_STATUSES } from "../../constants/enums";
import { errorMessage, formatDate, formatMoney, toDateInput } from "../../lib/format";

const blankLine = (): SubscriptionLineInput => ({ productId: 0, variantId: null, quantity: 1 });
const plusYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export default function SubscriptionDetail() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { push } = useToast();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loaded, setLoaded] = useState(isNew);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerLabel, setCustomerLabel] = useState("");
  const [planId, setPlanId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(plusYear());
  const [paymentTermDays, setPaymentTermDays] = useState(0);
  const [lines, setLines] = useState<SubscriptionLineInput[]>([blankLine()]);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    listPlans().then((r) => setPlans(r.data));
    listProducts().then((r) => setProducts(r.data));
    listTaxes().then((r) => setTaxes(r.data));
  }, []);

  function load() {
    if (!id) return;
    getSubscription(Number(id))
      .then((s) => {
        setSubscription(s);
        setCustomerId(s.customerId);
        setCustomerLabel(s.customer?.name ?? "");
        setPlanId(s.planId);
        setStartDate(toDateInput(s.startDate));
        setExpiryDate(toDateInput(s.expiryDate));
        setPaymentTermDays(s.paymentTermDays);
        setLines((s.lines ?? []).map((l) => ({ productId: l.productId, variantId: l.variantId ?? null, quantity: l.quantity })));
      })
      .finally(() => setLoaded(true));
  }
  useEffect(load, [id]);

  const plan = plans.find((p) => p.id === planId) ?? subscription?.plan;
  // Terms are only editable before the subscription is confirmed (the API enforces the same rule).
  const closed = !!subscription && subscription.status !== "DRAFT" && subscription.status !== "QUOTATION";

  const preview = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    const rows = lines.map((line) => {
      const product = products.find((p) => p.id === line.productId);
      const variant = product?.variants?.find((v) => v.id === line.variantId);
      const unitPrice = (product?.salesPrice ?? 0) + (variant?.extraPrice ?? 0);
      const tax = taxes.find((t) => t.id === product?.taxId);
      const amount = unitPrice * line.quantity;
      const taxAmount = tax ? Math.round(((amount * tax.ratePercent) / 100) * 100) / 100 : 0;
      subtotal += amount;
      taxTotal += taxAmount;
      return { product, unitPrice, amount, taxPercent: tax?.ratePercent ?? 0 };
    });
    return { rows, subtotal, taxTotal, total: subtotal + taxTotal };
  }, [lines, products, taxes]);

  const outsideWindow =
    plan && startDate && (startDate < toDateInput(plan.availableFrom) || (plan.availableTo && startDate > toDateInput(plan.availableTo)));

  function updateLine(i: number, patch: Partial<SubscriptionLineInput>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function save() {
    if (!customerId || !planId) return push("Choose a customer and a plan", "error");
    if (lines.some((l) => !l.productId)) return push("Choose a product on every line", "error");
    setSaving(true);
    try {
      const input = { customerId: Number(customerId), planId: Number(planId), startDate, expiryDate, paymentTermDays, lines };
      if (isNew) {
        const created = await createSubscription(input);
        push(`${created.number} created`);
        navigate(`/app/subscriptions/${created.id}`);
      } else {
        await updateSubscription(Number(id), input);
        push("Subscription saved");
        load();
      }
    } catch (err) {
      push(errorMessage(err, "Failed to save subscription"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      push(message);
      load();
    } catch (err) {
      push(errorMessage(err, "Action failed"), "error");
    } finally {
      setBusy(false);
      setConfirmClose(false);
    }
  }

  const currentIndex = subscription ? SUBSCRIPTION_STATUSES.indexOf(subscription.status) : 0;
  const nextStatus = subscription && currentIndex < 4 ? SUBSCRIPTION_STATUSES[currentIndex + 1] : null;
  const canEarlyClose = subscription && plan?.allowEarlyClose && subscription.status !== "ACTIVE" && subscription.status !== "CLOSED";
  const quotationExpired = subscription?.quotationValidUntil && new Date(subscription.quotationValidUntil) < new Date() && subscription.status !== "ACTIVE" && subscription.status !== "CLOSED";

  if (!loaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate("/app/subscriptions")} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Subscriptions
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {isNew ? "New subscription" : subscription?.number}
          </h1>
          {subscription && <StatusBadge status={subscription.isPaused ? "PAUSED" : subscription.status} />}
        </div>
        {subscription && (
          <div className="flex flex-wrap gap-2">
            {subscription.isPaused ? (
              <Button variant="secondary" loading={busy} onClick={() => run(() => resumeSubscription(subscription.id), "Subscription resumed")}>
                <Play className="h-4 w-4" /> Resume
              </Button>
            ) : (
              plan?.allowPause &&
              subscription.status === "ACTIVE" && (
                <Button variant="secondary" loading={busy} onClick={() => run(() => pauseSubscription(subscription.id), "Subscription paused")}>
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              )
            )}
            {plan?.allowRenew && subscription.status === "ACTIVE" && (
              <Button variant="secondary" loading={busy} onClick={() => run(() => renewSubscription(subscription.id), "Expiry extended by one period")}>
                <RefreshCw className="h-4 w-4" /> Renew
              </Button>
            )}
            {canEarlyClose && (
              <Button variant="secondary" onClick={() => setConfirmClose(true)}>
                <XCircle className="h-4 w-4" /> Close early
              </Button>
            )}
            {nextStatus && (
              <Button loading={busy} onClick={() => run(() => transitionSubscription(subscription.id, nextStatus as SubscriptionStatus), `Moved to ${nextStatus}`)}>
                Move to {nextStatus.toLowerCase()} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {subscription && (
        <Card className="mb-6">
          <Stepper steps={SUBSCRIPTION_STATUSES} current={currentIndex} />
          {quotationExpired && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" /> The quotation expired on {formatDate(subscription.quotationValidUntil)}.
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Combobox
                label="Customer"
                value={customerId}
                selectedLabel={customerLabel}
                placeholder="Search customers"
                fetchOptions={searchCustomers}
                disabled={closed}
                onChange={(o) => {
                  setCustomerId(o.id);
                  setCustomerLabel(o.label);
                }}
              />
              <Select label="Plan" value={planId} disabled={closed} onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Select a plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billingPeriod.toLowerCase()})
                  </option>
                ))}
              </Select>
              <Input label="Start date" type="date" value={startDate} disabled={closed} onChange={(e) => setStartDate(e.target.value)} />
              <Input label="Expiry date" type="date" value={expiryDate} disabled={closed} onChange={(e) => setExpiryDate(e.target.value)} />
              <Input label="Payment terms (days)" type="number" min={0} value={paymentTermDays} disabled={closed} onChange={(e) => setPaymentTermDays(Number(e.target.value))} />
            </div>
            {outsideWindow && plan && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                This plan is only available from {formatDate(plan.availableFrom)}
                {plan.availableTo ? ` to ${formatDate(plan.availableTo)}` : ""}.
              </p>
            )}
          </Card>

          <Card
            title="Order lines"
            description={plan ? `Minimum quantity per line on this plan: ${plan.minQuantity}` : "Choose a plan to see its limits"}
            actions={
              !closed && (
                <Button variant="secondary" onClick={() => setLines((p) => [...p, blankLine()])}>
                  <Plus className="h-4 w-4" /> Add line
                </Button>
              )
            }
            padded={false}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-[20%]" />
                  <col className="w-[76px]" />
                  <col className="w-[112px]" />
                  <col className="w-[56px]" />
                  <col className="w-[124px]" />
                  <col className="w-[52px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-2.5">Product</th>
                    <th className="px-2 py-2.5">Variant</th>
                    <th className="px-2 py-2.5">Qty</th>
                    <th className="px-2 py-2.5 text-right">Unit price</th>
                    <th className="px-2 py-2.5 text-right">Tax</th>
                    <th className="px-5 py-2.5 text-right">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line, i) => {
                    const row = preview.rows[i];
                    const belowMin = plan && line.quantity < plan.minQuantity;
                    return (
                      <tr key={i}>
                        <td className="px-5 py-2.5">
                          <Select
                            value={line.productId}
                            disabled={closed}
                            onChange={(e) => updateLine(i, { productId: Number(e.target.value), variantId: null })}
                          >
                            <option value={0}>Select product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-2 py-2.5">
                          <Select
                            value={line.variantId ?? ""}
                            disabled={closed || !row.product?.variants?.length}
                            onChange={(e) => updateLine(i, { variantId: e.target.value ? Number(e.target.value) : null })}
                          >
                            <option value="">{row.product?.variants?.length ? "Standard" : "No variants"}</option>
                            {row.product?.variants?.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.value}
                                {v.extraPrice > 0 ? ` (+${v.extraPrice})` : ""}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-2 py-2.5">
                          <Input
                            type="number"
                            min={1}
                            value={line.quantity}
                            disabled={closed}
                            error={belowMin ? `Min ${plan?.minQuantity}` : undefined}
                            onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-gray-700">{formatMoney(row.unitPrice)}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-gray-500">{row.taxPercent}%</td>
                        <td className="px-5 py-2.5 text-right font-medium tabular-nums text-gray-900">{formatMoney(row.amount)}</td>
                        <td className="pr-4">
                          {!closed && lines.length > 1 && (
                            <Button variant="ghost" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))} aria-label="Remove line">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(preview.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Tax</dt>
                <dd className="tabular-nums">{formatMoney(preview.taxTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold text-gray-900">
                <dt>Per period</dt>
                <dd className="tabular-nums">{formatMoney(preview.total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-gray-500">Discounts are applied automatically when each invoice is created.</p>
            {!closed && (
              <Button className="mt-4 w-full" onClick={save} loading={saving}>
                {isNew ? "Create subscription" : "Save changes"}
              </Button>
            )}
          </Card>

          {plan && (
            <Card title={plan.name} description={`Billed ${plan.billingPeriod.toLowerCase()}`}>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li>Available {formatDate(plan.availableFrom)} - {plan.availableTo ? formatDate(plan.availableTo) : "open-ended"}</li>
                <li>Closes automatically: {plan.autoClose ? "yes" : "no"}</li>
                <li>Early close: {plan.allowEarlyClose ? "allowed" : "not allowed"}</li>
                <li>Pause: {plan.allowPause ? "allowed" : "not allowed"}</li>
                <li>Renew: {plan.allowRenew ? "allowed" : "not allowed"}</li>
              </ul>
            </Card>
          )}

          {subscription && (
            <Card title="Billing">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Next billing</dt>
                  <dd className="font-medium text-gray-900">{formatDate(subscription.nextBillingDate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Quote valid until</dt>
                  <dd className="font-medium text-gray-900">{formatDate(subscription.quotationValidUntil)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Created</dt>
                  <dd className="font-medium text-gray-900">{formatDate(subscription.createdAt)}</dd>
                </div>
              </dl>
            </Card>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClose}
        title="Close subscription early"
        message="The subscription will be closed and no further invoices will be generated. This cannot be undone."
        confirmLabel="Close subscription"
        danger
        loading={busy}
        onConfirm={() => subscription && run(() => transitionSubscription(subscription.id, "CLOSED"), "Subscription closed")}
        onClose={() => setConfirmClose(false)}
      />
    </div>
  );
}
