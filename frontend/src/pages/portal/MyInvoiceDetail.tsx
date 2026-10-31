import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Select } from "../../components/ui/Select";
import { useToast } from "../../components/ui/Toast";
import { getMyInvoice, payInvoice } from "../../api/portal";
import { Invoice } from "../../types";
import { PAYMENT_METHODS } from "../../constants/enums";

export default function MyInvoiceDetail() {
  const { id } = useParams();
  const { push } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [method, setMethod] = useState<string>("CARD");
  const [paying, setPaying] = useState(false);

  function load() {
    if (id) getMyInvoice(Number(id)).then(setInvoice);
  }
  useEffect(load, [id]);

  async function handlePay() {
    if (!id) return;
    setPaying(true);
    try {
      await payInvoice(Number(id), method);
      push("Payment successful");
      load();
    } catch (err: any) {
      push(err?.response?.data?.error?.message ?? "Payment failed", "error");
    } finally {
      setPaying(false);
    }
  }

  if (!invoice) return <div>Loading...</div>;
  const balance = Number(invoice.total) - Number(invoice.amountPaid);

  return (
    <div>
      <PageHeader title={invoice.number} />
      <div className="max-w-xl space-y-4 rounded-xl border border-gray-200 bg-white shadow-card animate-fade-in-up dark:border-gray-800 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <StatusBadge status={invoice.status} />
          <span className="text-sm text-gray-500 dark:text-gray-400">Due {new Date(invoice.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Total</span>
            <span>{Number(invoice.total).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <span>{Number(invoice.amountPaid).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Balance</span>
            <span>{balance.toFixed(2)}</span>
          </div>
        </div>
        {invoice.status === "CONFIRMED" && balance > 0 && (
          <div className="flex items-end gap-2 border-t border-gray-200 dark:border-gray-800 pt-4">
            <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            <Button onClick={handlePay} disabled={paying}>
              Pay {balance.toFixed(2)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
