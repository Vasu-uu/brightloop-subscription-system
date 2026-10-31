import { apiGet } from "./client";
import { ApiMeta, Product } from "../types";

export async function listProducts(params: { page?: number; search?: string } = {}) {
  return apiGet<Product[]>("/products", { pageSize: 100, ...params }) as Promise<{
    data: Product[];
    meta: ApiMeta;
  }>;
}
