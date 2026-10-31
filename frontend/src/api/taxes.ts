import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import { ApiMeta, Tax } from "../types";

export async function listTaxes(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return apiGet<Tax[]>("/taxes", { pageSize: 100, ...params }) as Promise<{ data: Tax[]; meta: ApiMeta }>;
}

export const createTax = (input: { name: string; ratePercent: number }) => apiPost<Tax>("/taxes", input);
export const updateTax = (id: number, input: { name?: string; ratePercent?: number; isActive?: boolean }) =>
  apiPut<Tax>(`/taxes/${id}`, input);
export const deleteTax = (id: number) => apiDelete<{ id: number }>(`/taxes/${id}`);
