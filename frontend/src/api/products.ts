import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import { ApiMeta, Product } from "../types";

export type ProductInput = {
  name: string;
  type: "SERVICE" | "GOODS";
  salesPrice: number;
  costPrice: number;
  notes?: string;
  taxId?: number | null;
  variants?: { attribute: string; value: string; extraPrice: number }[];
};

export async function listProducts(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return apiGet<Product[]>("/products", { pageSize: 100, ...params }) as Promise<{
    data: Product[];
    meta: ApiMeta;
  }>;
}

export const getProduct = (id: number) => apiGet<Product>(`/products/${id}`).then((r) => r.data);
export const createProduct = (input: ProductInput) => apiPost<Product>("/products", input);
export const updateProduct = (id: number, input: Partial<ProductInput> & { isActive?: boolean }) =>
  apiPut<Product>(`/products/${id}`, input);
export const deleteProduct = (id: number) => apiDelete<{ id: number }>(`/products/${id}`);

export const addVariant = (productId: number, v: { attribute: string; value: string; extraPrice: number }) =>
  apiPost(`/products/${productId}/variants`, v);
export const updateVariant = (
  productId: number,
  variantId: number,
  v: { attribute?: string; value?: string; extraPrice?: number }
) => apiPut(`/products/${productId}/variants/${variantId}`, v);
export const deleteVariant = (productId: number, variantId: number) =>
  apiDelete(`/products/${productId}/variants/${variantId}`);
