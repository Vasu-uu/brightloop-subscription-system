import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarPlus, Pause, Play, XCircle } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stepper } from "../../components/ui/Stepper";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { getMySubscription, manageMySubscription, SelfServiceAction } from "../../api/portal";
import { Subscription } from "../../types";
import { SUBSCRIPTION_STATUSES } from "../../constants/enums";
import { errorMessage, formatDate, formatMoney } from "../../lib/format";

const ACTIONS: Record<SelfServiceAction, { title: string; message: string; label: string; done: string; danger?: boolean }> = {
  pause: { title: "Pause subscription", message: "Billing stops until you resume. You can resume at any time.", label: "Pause", done: "Subscription paused" },
  resume: { title: "Resume subscription", message: "Billing continues from your next billing date.", label: "Resume", done: "Subscription resumed" },
  renew: { title: "Renew subscription", message: "Extends your subscription by one more billing period.", label: "Renew", done: "Subscription renewed" },
  close: { title: "Cancel subscription", message: "This closes the subscription and stops all future billing. It cannot be undone.", label: "Cancel subscription", done: "Subscription closed", danger: true },
};

export default function MySubscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [pending, setPending] = useState<SelfServiceAction | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) getMySubscription(Number(id)).then(setSub).catch(() => navigate("/portal/subscriptions"));
  }, [id, navigate]);

  if (!sub) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      await manageMySubscription(sub!.id, pending);
      push(ACTIONS[pending].done);
      setSub(await getMySubscription(sub!.id));
      setPending(null);
    } catch (err) {
      push(errorMessage(err, "That could not be done"), "error");
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  const live = sub.status === "ACTIVE";
  const plan = sub.plan;
  const canPause = live && !sub.isPaused && plan?.allowPause;
  const canResume = live && sub.isPaused;
  const canRenew = live && plan?.allowRenew;
  const canClose = (live || sub.status === "CONFIRMED") && plan?.allowEarlyClose;
  const expiresInDays = Math.ceil((new Date(sub.expiryDate).getTime() - Date.now()) / 86400000);

  const total = (sub.lines ?? []).reduce((s, l) => s + Number(l.amount) * (1 + Number(l.taxPercent) / 100), 0);

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => navigate("/portal/subscriptions")} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> My subscriptions
      </button>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{sub.plan?.name}</h1>
        <StatusBadge status={sub.isPaused ? "PAUSED" : sub.status} />
        <span className="text-sm text-gray-500">{sub.number}</span>
      </div>

      {live && expiresInDays <= 30 && expiresInDays >= 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>Your subscription expires on {formatDate(sub.expiryDate)} ({expiresInDays} days left).</span>
          {canRenew && <Button onClick={() => setPending("renew")}>Renew now</Button>}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <Stepper steps={SUBSCRIPTION_STATUSES} current={SUBSCRIPTION_STATUSES.indexOf(sub.status)} />
        </Card>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <Card title="What you are subscribed to" padded={false}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-2.5">Product</th>
                  <th className="px-2 py-2.5 text-right">Qty</th>
                  <th className="px-2 py-2.5 text-right">Unit price</th>
                  <th className="px-5 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(sub.lines ?? []).map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{l.product?.name}</p>
                      {l.variant && <p className="text-xs text-gray-500">{l.variant.attribute}: {l.variant.value}</p>}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">{l.quantity}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{formatMoney(l.unitPrice)}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{formatMoney(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between border-t border-gray-100 px-5 py-3 text-sm font-semibold">
              <span>Per {sub.plan?.billingPeriod.toLowerCase()} period (incl. tax)</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Dates">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Started</dt><dd className="font-medium">{formatDate(sub.startDate)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Expires</dt><dd className="font-medium">{formatDate(sub.expiryDate)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Next billing</dt><dd className="font-medium">{formatDate(sub.nextBillingDate)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Payment terms</dt><dd className="font-medium">{sub.paymentTermDays} days</dd></div>
              </dl>
            </Card>
            {(canPause || canResume || canRenew || canClose) && (
              <Card title="Manage" description="Changes apply immediately">
                <div className="flex flex-col gap-2">
                  {canPause && <Button variant="secondary" onClick={() => setPending("pause")}><Pause className="h-4 w-4" /> Pause</Button>}
                  {canResume && <Button onClick={() => setPending("resume")}><Play className="h-4 w-4" /> Resume</Button>}
                  {canRenew && <Button variant="secondary" onClick={() => setPending("renew")}><CalendarPlus className="h-4 w-4" /> Renew</Button>}
                  {canClose && <Button variant="secondary" onClick={() => setPending("close")}><XCircle className="h-4 w-4" /> Cancel subscription</Button>}
                </div>
              </Card>
            )}
            <Card title="Invoices" description="Billed for this subscription">
              {(sub.invoices ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No invoices yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {sub.invoices!.slice(0, 6).map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between">
                      <Link to={`/portal/invoices/${inv.id}`} className="font-medium text-brand-700 hover:underline">
                        {inv.number}
                      </Link>
                      <StatusBadge status={inv.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={pending !== null}
        title={pending ? ACTIONS[pending].title : ""}
        message={pending ? ACTIONS[pending].message : ""}
        confirmLabel={pending ? ACTIONS[pending].label : "Confirm"}
        danger={pending ? ACTIONS[pending].danger : false}
        loading={busy}
        onConfirm={confirm}
        onClose={() => setPending(null)}
      />
    </div>
  );
}
