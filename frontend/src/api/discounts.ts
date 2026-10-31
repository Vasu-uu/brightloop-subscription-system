import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import { ApiMeta, Discount, DiscountAppliesTo, DiscountType, Product } from "../types";

export type DiscountRow = Discount & { products?: Product[] };

export type DiscountInput = {
  name: string;
  type: DiscountType;
  value: number;
  appliesTo: DiscountAppliesTo;
  minPurchase?: number | null;
  minQuantity?: number | null;
  startDate: string;
  endDate?: string | null;
  usageLimit?: number | null;
  productIds?: number[];
};

export async function listDiscounts(params: { page?: number; search?: string } = {}) {
  return apiGet<DiscountRow[]>("/discounts", params) as Promise<{ data: DiscountRow[]; meta: ApiMeta }>;
}

export const createDiscount = (input: DiscountInput) => apiPost<Discount>("/discounts", input);
export const updateDiscount = (id: number, input: Partial<DiscountInput> & { isActive?: boolean }) =>
  apiPut<Discount>(`/discounts/${id}`, input);
export const deleteDiscount = (id: number) => apiDelete<{ id: number }>(`/discounts/${id}`);
