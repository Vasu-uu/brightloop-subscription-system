import { apiGet, apiPost } from "./client";
import { ApiMeta, Payment } from "../types";

export async function listPayments(page = 1) {
  return apiGet<Payment[]>("/payments", { page }) as Promise<{ data: Payment[]; meta: ApiMeta }>;
}

export async function recordPayment(input: { invoiceId: number; method: string; amount: number; paymentDate: string; note?: string }) {
  return apiPost<Payment>("/payments", input);
}
