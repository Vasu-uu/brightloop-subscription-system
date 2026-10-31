import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, CreditCard, FileCheck, Landmark, LucideIcon, Printer, Smartphone } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/Toast";
import { getMyInvoice, payInvoice } from "../../api/portal";
import { Invoice } from "../../types";
import { PAYMENT_METHODS } from "../../constants/enums";
import { daysOverdue, errorMessage, formatDate, formatMoney } from "../../lib/format";

const ICONS: Record<string, LucideIcon> = {
  CASH: Banknote,
  CARD: CreditCard,
  UPI: Smartphone,
  BANK_TRANSFER: Landmark,
  CHEQUE: FileCheck,
};

export default function MyInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [method, setMethod] = useState("CARD");
  const [paying, setPaying] = useState(false);

  function load() {
    if (id) getMyInvoice(Number(id)).then(setInvoice).catch(() => navigate("/portal/invoices"));
  }
  useEffect(load, [id]);

  async function pay() {
    if (!id) return;
    setPaying(true);
    try {
      await payInvoice(Number(id), method);
      push("Payment successful. Thank you!");
      load();
    } catch (err) {
      push(errorMessage(err, "Payment failed"), "error");
    } finally {
      setPaying(false);
    }
  }

  if (!invoice) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  const canPay = invoice.status === "CONFIRMED" && balance > 0;
  const late = invoice.status === "CONFIRMED" && daysOverdue(invoice.dueDate) > 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print">
        <button onClick={() => navigate("/portal/invoices")} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          <ArrowLeft className="h-4 w-4" /> My invoices
        </button>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">{invoice.number}</h1>
            <StatusBadge status={invoice.status} />
            {late && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">{daysOverdue(invoice.dueDate)} days overdue</span>}
          </div>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px] print:block">
        <article className="rounded-xl border border-gray-200 bg-white p-7 shadow-card print:border-0 print:p-0 print:shadow-none dark:border-gray-800 dark:bg-gray-900 print:dark:bg-white">
          <div className="flex items-start justify-between border-b border-gray-100 pb-5 dark:border-gray-800">
            <p className="text-lg font-bold tracking-tight">Brightloop Software</p>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400">
              <p>Issued {formatDate(invoice.issueDate)}</p>
              <p>Due {formatDate(invoice.dueDate)}</p>
              <p>Period {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}</p>
            </div>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(invoice.lines ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="py-3">{l.description}</td>
                  <td className="py-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="py-3 text-right tabular-nums">{formatMoney(l.unitPrice)}</td>
                  <td className="py-3 text-right font-medium tabular-nums">{formatMoney(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5 ml-auto w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span className="tabular-nums">{formatMoney(invoice.subtotal)}</span></div>
            {Number(invoice.discountTotal) > 0 && (
              <div className="flex justify-between text-green-700 dark:text-green-400"><span>Discounts</span><span className="tabular-nums">-{formatMoney(invoice.discountTotal)}</span></div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Tax</span><span className="tabular-nums">{formatMoney(invoice.taxTotal)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold dark:border-gray-800"><span>Total</span><span className="tabular-nums">{formatMoney(invoice.total)}</span></div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Paid</span><span className="tabular-nums">{formatMoney(invoice.amountPaid)}</span></div>
            <div className="flex justify-between font-semibold"><span>Balance due</span><span className="tabular-nums">{formatMoney(balance)}</span></div>
          </div>
        </article>

        <aside className="no-print space-y-6">
          {canPay ? (
            <Card title="Pay this invoice" description="Secure checkout (simulated gateway)">
              <div className="grid grid-cols-1 gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = ICONS[m];
                  return (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        method === m
                          ? "border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-500 dark:bg-brand-500/10 dark:text-brand-200"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {m.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
              <Button className="mt-4 w-full" loading={paying} onClick={pay}>
                Pay {formatMoney(balance)}
              </Button>
            </Card>
          ) : (
            <Card title="Payment">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {invoice.status === "PAID" ? "This invoice is fully paid. Thank you!" : invoice.status === "CANCELLED" ? "This invoice was cancelled." : "This invoice is not open for payment yet."}
              </p>
            </Card>
          )}
          {(invoice.payments ?? []).length > 0 && (
            <Card title="Payment history">
              <ul className="space-y-2 text-sm">
                {invoice.payments!.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.method.replace("_", " ")} <span className="text-xs text-gray-500">{formatDate(p.paymentDate)}</span></span>
                    <span className="font-medium tabular-nums">{formatMoney(p.amount)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
