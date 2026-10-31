import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/Toast";
import { cancelInvoice, confirmInvoice, getInvoice, invoicePdfUrl, sendInvoice } from "../../api/invoices";
import { recordPayment } from "../../api/payments";
import { Invoice } from "../../types";
import { PAYMENT_METHODS } from "../../constants/enums";

export default function InvoiceDetail() {
  const { id } = useParams();
  const { push } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("CARD");
  const [payAmount, setPayAmount] = useState(0);
  const [payNote, setPayNote] = useState("");

  function load() {
    if (!id) return;
    getInvoice(Number(id)).then(setInvoice);
  }

  useEffect(load, [id]);

  async function handle(action: "confirm" | "cancel" | "send") {
    if (!id) return;
    setBusy(true);
    try {
      const fn = action === "confirm" ? confirmInvoice : action === "cancel" ? cancelInvoice : sendInvoice;
      await fn(Number(id));
      push(`Invoice ${action}ed`);
      load();
    } catch (err: any) {
      push(err?.response?.data?.error?.message ?? `Failed to ${action} invoice`, "error");
    } finally {
      setBusy(false);
    }
  }

  function openPayModal() {
    setPayAmount(balance);
    setPayMethod("CARD");
    setPayNote("");
    setPayModalOpen(true);
  }

  async function handleRecordPayment() {
    if (!invoice) return;
    setBusy(true);
    try {
      await recordPayment({
        invoiceId: invoice.id,
        method: payMethod,
        amount: payAmount,
        paymentDate: new Date().toISOString(),
        note: payNote || undefined,
      });
      push("Payment recorded");
      setPayModalOpen(false);
      load();
    } catch (err: any) {
      push(err?.response?.data?.error?.message ?? "Failed to record payment", "error");
    } finally {
      setBusy(false);
    }
  }

  if (!invoice) return <div>Loading...</div>;

  const balance = Number(invoice.total) - Number(invoice.amountPaid);

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={invoice.number}
          actions={
            <>
              {invoice.status === "DRAFT" && (
                <Button onClick={() => handle("confirm")} disabled={busy}>
                  Confirm
                </Button>
              )}
              {invoice.status === "CONFIRMED" && balance > 0 && (
                <Button onClick={openPayModal} disabled={busy}>
                  Record Payment
                </Button>
              )}
              {(invoice.status === "DRAFT" || invoice.status === "CONFIRMED") &&
                Number(invoice.amountPaid) === 0 && (
                  <Button variant="danger" onClick={() => handle("cancel")} disabled={busy}>
                    Cancel
                  </Button>
                )}
              <Button variant="secondary" onClick={() => handle("send")} disabled={busy}>
                Send
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                Print
              </Button>
              <a href={invoicePdfUrl(invoice.id)} target="_blank" rel="noreferrer">
                <Button variant="secondary">Download PDF</Button>
              </a>
            </>
          }
        />
      </div>

      <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-8 print:border-0 print:shadow-none">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Invoice {invoice.number}</h2>
            <p className="text-sm text-gray-500">Status: <StatusBadge status={invoice.status} /></p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700">Bill to</p>
          <p className="text-sm text-gray-600">{invoice.customer?.name}</p>
          <p className="text-sm text-gray-600">{invoice.customer?.email}</p>
        </div>

        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
              <th className="py-1">Description</th>
              <th className="py-1">Qty</th>
              <th className="py-1">Unit price</th>
              <th className="py-1">Tax %</th>
              <th className="py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lines ?? []).map((line) => (
              <tr key={line.id} className="border-b border-gray-100">
                <td className="py-1">{line.description}</td>
                <td className="py-1">{line.quantity}</td>
                <td className="py-1">{Number(line.unitPrice).toFixed(2)}</td>
                <td className="py-1">{Number(line.taxPercent).toFixed(2)}%</td>
                <td className="py-1">{Number(line.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoice.discounts && invoice.discounts.length > 0 && (
          <div className="mb-4 text-sm">
            <p className="font-medium text-gray-700">Discounts</p>
            {invoice.discounts.map((d) => (
              <div key={d.id} className="flex justify-between text-gray-600">
                <span>{d.discount?.name}</span>
                <span>-{Number(d.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{Number(invoice.discountTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{Number(invoice.taxTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
            <span>Total</span>
            <span>{Number(invoice.total).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Paid</span>
            <span>{Number(invoice.amountPaid).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Balance</span>
            <span>{balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title="Record Payment">
        <div className="space-y-3">
          <Select label="Method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            label="Amount"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
          />
          <Input label="Note (optional)" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={busy}>
              Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
