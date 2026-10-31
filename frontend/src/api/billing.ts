import { apiPost } from "./client";

export type BillingRunResult = { created: number; skipped: number; invoiceIds: number[] };

export async function runBilling(asOfDate?: string) {
  return apiPost<BillingRunResult>("/billing/run", asOfDate ? { asOfDate } : {});
}
