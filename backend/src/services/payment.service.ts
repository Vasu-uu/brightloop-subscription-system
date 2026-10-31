import { Prisma, Payment, PaymentMethod, InvoiceStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../shared/AppError";

export function getInvoiceBalance(invoice: { total: number; amountPaid: number }): number {
  return Number((invoice.total - invoice.amountPaid).toFixed(2));
}

export async function recordPayment(input: {
  invoiceId: number;
  method: PaymentMethod;
  amount: number;
  paymentDate: Date;
  note?: string;
}): Promise<Payment> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Payment amount must be greater than zero.", { amount: "Must be greater than zero." });
  }
  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{ id: number; total: Prisma.Decimal; amountPaid: Prisma.Decimal; status: InvoiceStatus }>>`
      SELECT id, total, amountPaid, status
      FROM Invoice
      WHERE id = ${input.invoiceId}
      FOR UPDATE
    `;
    const invoice = rows[0];
    if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found.");
    if (invoice.status !== "CONFIRMED") throw new AppError(400, "VALIDATION_ERROR", "Payments can only be recorded against CONFIRMED invoices.");
    const balance = new Prisma.Decimal(invoice.total).minus(invoice.amountPaid);
    const amount = new Prisma.Decimal(input.amount.toFixed(2));
    if (amount.greaterThan(balance)) throw new AppError(400, "VALIDATION_ERROR", "Payment amount exceeds the invoice balance.", { amount: "Cannot exceed the remaining balance." });
    const payment = await tx.payment.create({ data: {
      invoiceId: input.invoiceId, method: input.method, amount,
      paymentDate: input.paymentDate, note: input.note,
    } });
    const nextPaid = new Prisma.Decimal(invoice.amountPaid).plus(amount);
    await tx.invoice.update({ where: { id: invoice.id }, data: {
      amountPaid: nextPaid,
      ...(nextPaid.greaterThanOrEqualTo(invoice.total) ? { status: InvoiceStatus.PAID } : {}),
    } });
    return payment;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}
