import { apiGet, apiPost } from "./client";
import { ApiMeta, Invoice, Subscription } from "../types";

export async function listMySubscriptions(page = 1) {
  return apiGet<Subscription[]>("/portal/subscriptions", { page }) as Promise<{
    data: Subscription[];
    meta: ApiMeta;
  }>;
}

export async function getMySubscription(id: number) {
  return apiGet<Subscription>(`/portal/subscriptions/${id}`).then((r) => r.data);
}

export async function listMyInvoices(page = 1) {
  return apiGet<Invoice[]>("/portal/invoices", { page }) as Promise<{ data: Invoice[]; meta: ApiMeta }>;
}

export async function getMyInvoice(id: number) {
  return apiGet<Invoice>(`/portal/invoices/${id}`).then((r) => r.data);
}

export async function payInvoice(id: number, method: string) {
  return apiPost(`/portal/invoices/${id}/pay`, { method });
}
