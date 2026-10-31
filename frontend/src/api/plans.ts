import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import { ApiMeta, BillingPeriod, Plan } from "../types";

export type PlanInput = {
  name: string;
  price: number;
  billingPeriod: BillingPeriod;
  minQuantity: number;
  availableFrom: string;
  availableTo?: string | null;
  autoClose: boolean;
  allowEarlyClose: boolean;
  allowPause: boolean;
  allowRenew: boolean;
};

export async function listPlans(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return apiGet<Plan[]>("/plans", { pageSize: 100, ...params }) as Promise<{ data: Plan[]; meta: ApiMeta }>;
}

export const createPlan = (input: PlanInput) => apiPost<Plan>("/plans", input);
export const updatePlan = (id: number, input: Partial<PlanInput> & { isActive?: boolean }) =>
  apiPut<Plan>(`/plans/${id}`, input);
export const deletePlan = (id: number) => apiDelete<{ id: number }>(`/plans/${id}`);
