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

export async function getRevenueByMonth() {
  return apiGet<{ month: string; revenue: number }[]>("/dashboard/revenue-by-month").then((r) => r.data);
}

export async function listDashboardInvoices(payment: "paid" | "outstanding" | "overdue", page = 1) {
  return apiGet<Invoice[]>("/dashboard/invoices", { payment, page }) as Promise<{
    data: Invoice[];
    meta: ApiMeta;
  }>;
}
