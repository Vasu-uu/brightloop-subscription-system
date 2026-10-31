import { apiClient, apiGet, apiPost } from "./client";
import { ApiMeta, Invoice } from "../types";

export async function listInvoices(params: {
  page?: number;
  status?: string;
  customerId?: number;
  from?: string;
  to?: string;
  search?: string;
}) {
  return apiGet<Invoice[]>("/invoices", params) as Promise<{ data: Invoice[]; meta: ApiMeta }>;
}

export async function getInvoice(id: number) {
  return apiGet<Invoice>(`/invoices/${id}`).then((r) => r.data);
}

export async function confirmInvoice(id: number) {
  return apiPost<Invoice>(`/invoices/${id}/confirm`);
}

export async function cancelInvoice(id: number) {
  return apiPost<Invoice>(`/invoices/${id}/cancel`);
}

export async function sendInvoice(id: number) {
  return apiPost<Invoice>(`/invoices/${id}/send`);
}

export function invoicePdfUrl(id: number) {
  return `${import.meta.env.VITE_API_URL}/invoices/${id}/pdf`;
}

export async function openInvoicePdf(id: number) {
  const res = await apiClient.get(`/invoices/${id}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function listInvoicePayments(id: number) {
  const res = await apiClient.get<{ data: import("../types").Payment[] }>(`/invoices/${id}/payments`);
  return res.data.data;
}
