import { apiGet } from "./client";
import { ApiMeta, Plan } from "../types";

export async function listPlans(params: { page?: number; search?: string } = {}) {
  return apiGet<Plan[]>("/plans", { pageSize: 100, ...params }) as Promise<{ data: Plan[]; meta: ApiMeta }>;
}
