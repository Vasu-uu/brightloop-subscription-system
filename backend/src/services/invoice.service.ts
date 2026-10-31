import { Invoice } from "@prisma/client";

export async function createInvoiceFromSubscription(
  _subscriptionId: number,
  _periodStart: Date
): Promise<Invoice> {
  throw new Error("not implemented");
}

export async function runBilling(
  _asOf: Date
): Promise<{ created: number; skipped: number; invoiceIds: number[] }> {
  throw new Error("not implemented");
}
