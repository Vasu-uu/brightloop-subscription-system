import { apiGet, apiPost } from "./client";
import { ApiMeta, Payment } from "../types";

export type PaymentRow = Payment & {
  invoice?: { id: number; number: string; customerId: number; total: number; amountPaid: number; status: string };
};

export async function listPayments(params: { page?: number; from?: string; to?: string; customerId?: number } = {}) {
  return apiGet<PaymentRow[]>("/payments", params) as Promise<{ data: PaymentRow[]; meta: ApiMeta }>;
}

export async function recordPayment(input: {
  invoiceId: number;
  method: string;
  amount: number;
  paymentDate: string;
  note?: string;
}) {
  return apiPost<Payment>("/payments", input);
}
