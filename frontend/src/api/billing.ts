import { apiGet, apiPost } from "./client";

export type BillingRunResult = { created: number; skipped: number; invoiceIds: number[] };

export type BillingStatus = {
  enabled: boolean;
  schedule: string | null;
  running: boolean;
  lastRun: { at: string; trigger: "scheduled" | "manual"; created: number; skipped: number; error?: string } | null;
};

export async function getBillingStatus() {
  return apiGet<BillingStatus>("/billing/status").then((r) => r.data);
}

export async function runBilling(asOfDate?: string) {
  return apiPost<BillingRunResult>("/billing/run", asOfDate ? { asOfDate } : {});
}
