import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, Mail, Printer, Wallet, XCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/Toast";
import { cancelInvoice, confirmInvoice, getInvoice, openInvoicePdf, sendInvoice } from "../../api/invoices";
import { recordPayment } from "../../api/payments";
import { Invoice } from "../../types";
import { PAYMENT_METHODS } from "../../constants/enums";
import { daysOverdue, errorMessage, formatDate, formatMoney } from "../../lib/format";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState("CARD");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  function load() {
    if (id) getInvoice(Number(id)).then(setInvoice);
  }
  useEffect(load, [id]);

  async function run(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await fn();
      push(message);
      load();
    } catch (err) {
      push(errorMessage(err, "Action failed"), "error");
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[480px]" />
      </div>
    );
  }

  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  const canPay = invoice.status === "CONFIRMED" && balance > 0;
  const late = invoice.status === "CONFIRMED" && daysOverdue(invoice.dueDate) > 0;

  async function submitPayment() {
    if (!invoice) return;
    await run(
      () =>
        recordPayment({
          invoiceId: invoice.id,
          method,
          amount,
          paymentDate: new Date(`${payDate}T12:00:00.000Z`).toISOString(),
          note: note || undefined,
        }).then(() => setPayOpen(false)),
      "Payment recorded"
    );
  }

  return (
    <div>
      <div className="no-print">
        <button onClick={() => navigate("/app/invoices")} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          <ArrowLeft className="h-4 w-4" /> Invoices
        </button>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">{invoice.number}</h1>
            <StatusBadge status={invoice.status} />
            {late && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">{daysOverdue(invoice.dueDate)} days overdue</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {invoice.status === "DRAFT" && (
              <Button loading={busy} onClick={() => run(() => confirmInvoice(invoice.id), "Invoice confirmed")}>
                <CheckCircle2 className="h-4 w-4" /> Confirm
              </Button>
            )}
            {canPay && (
              <Button
                onClick={() => {
                  setAmount(balance);
                  setNote("");
                  setMethod("CARD");
                  setPayOpen(true);
                }}
              >
                <Wallet className="h-4 w-4" /> Record payment
              </Button>
            )}
            <Button variant="secondary" loading={busy} onClick={() => run(() => sendInvoice(invoice.id), invoice.sentAt ? "Invoice sent again" : "Invoice sent")}>
              <Mail className="h-4 w-4" /> {invoice.sentAt ? "Resend" : "Send"}
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="secondary" onClick={() => openInvoicePdf(invoice.id).catch(() => push("Could not open PDF", "error"))}>
              <Download className="h-4 w-4" /> PDF
            </Button>
            {(invoice.status === "DRAFT" || invoice.status === "CONFIRMED") && Number(invoice.amountPaid) === 0 && (
              <Button variant="ghost" onClick={() => setConfirmCancel(true)}>
                <XCircle className="h-4 w-4 text-red-500" /> Cancel invoice
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] print:block">
        <article className="rounded-xl border border-gray-200 bg-white p-8 shadow-card print:border-0 print:p-0 print:shadow-none dark:border-gray-800 dark:bg-gray-900 print:dark:bg-white">
          <div className="flex items-start justify-between border-b border-gray-100 pb-6 dark:border-gray-800">
            <div>
              <p className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-50">Brightloop Software</p>
              <p className="text-xs text-gray-500">Subscription billing</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Invoice</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{invoice.number}</p>
            </div>
          </div>

          <div className="grid gap-6 py-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Billed to</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.customer?.name}</p>
              {invoice.customer?.company && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer.company}</p>}
              <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer?.email}</p>
              {invoice.customer?.address && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer.address}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Dates</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Issued {formatDate(invoice.issueDate)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due {formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Billing period</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Subscription {invoice.subscription?.number}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800">
                <th className="py-2.5">Description</th>
                <th className="py-2.5 text-right">Qty</th>
                <th className="py-2.5 text-right">Unit price</th>
                <th className="py-2.5 text-right">Tax</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(invoice.lines ?? []).map((line) => (
                <tr key={line.id}>
                  <td className="py-3 text-gray-900 dark:text-gray-100">{line.description}</td>
                  <td className="py-3 text-right tabular-nums">{line.quantity}</td>
                  <td className="py-3 text-right tabular-nums">{formatMoney(line.unitPrice)}</td>
                  <td className="py-3 text-right tabular-nums text-gray-500">{Number(line.taxPercent)}%</td>
                  <td className="py-3 text-right font-medium tabular-nums">{formatMoney(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 ml-auto w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(invoice.subtotal)}</span>
            </div>
            {(invoice.discounts ?? []).map((d) => (
              <div key={d.id} className="flex justify-between text-green-700 dark:text-green-400">
                <span>Discount: {d.discount?.name}</span>
                <span className="tabular-nums">-{formatMoney(d.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tax</span>
              <span className="tabular-nums">{formatMoney(invoice.taxTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-gray-50">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Paid</span>
              <span className="tabular-nums">{formatMoney(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
              <span>Balance due</span>
              <span className="tabular-nums">{formatMoney(balance)}</span>
            </div>
          </div>
        </article>

        <aside className="no-print space-y-6">
          <Card title="Payments" description={`${invoice.payments?.length ?? 0} recorded`}>
            {(invoice.payments ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">No payments yet.</p>
            ) : (
              <ul className="space-y-3">
                {invoice.payments!.map((p) => (
                  <li key={p.id} className="flex items-start justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{p.method.replace("_", " ")}</p>
                      <p className="text-xs text-gray-500">{formatDate(p.paymentDate)}{p.note ? ` - ${p.note}` : ""}</p>
                    </div>
                    <span className="tabular-nums font-medium">{formatMoney(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Activity">
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li>Created {formatDate(invoice.createdAt)}</li>
              <li>{invoice.sentAt ? `Sent ${formatDate(invoice.sentAt)}` : "Not sent yet"}</li>
            </ul>
          </Card>
        </aside>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record payment">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Balance due <span className="font-semibold text-gray-900 dark:text-gray-100">{formatMoney(balance)}</span>. You cannot record more than the balance.
          </p>
          <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Input label="Amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <Input label="Payment date" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reference, cheque number..." />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPayOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submitPayment} loading={busy} disabled={amount <= 0 || amount > balance + 0.001}>
            Record {formatMoney(amount)}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel invoice"
        message={`Cancel ${invoice.number}? Cancelled invoices cannot be paid or reactivated.`}
        confirmLabel="Cancel invoice"
        danger
        loading={busy}
        onConfirm={() => run(() => cancelInvoice(invoice.id), "Invoice cancelled")}
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  );
}
