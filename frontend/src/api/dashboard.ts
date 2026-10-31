import { apiGet } from "./client";
import { ApiMeta, Invoice } from "../types";

export type DashboardSummary = {
  activeSubscriptions: number;
  totalRevenue: number;
  totalOutstanding: number;
  overdueCount: number;
  overdueAmount: number;
  revenueThisMonth: number;
};

export async function getSummary() {
  return apiGet<DashboardSummary>("/dashboard/summary").then((r) => r.data);
}

export async function getRevenueByMonth(months = 12) {
  return apiGet<{ month: string; revenue: number }[]>("/dashboard/revenue-by-month", { months }).then((r) => r.data);
}

export async function listDashboardInvoices(
  payment: "paid" | "outstanding" | "overdue",
  params: { page?: number; from?: string; to?: string; search?: string } = {}
) {
  return apiGet<Invoice[]>("/dashboard/invoices", { payment, ...params }) as Promise<{
    data: Invoice[];
    meta: ApiMeta;
  }>;
}
