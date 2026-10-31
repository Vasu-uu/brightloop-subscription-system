import { apiGet } from "./client";
import { ApiMeta, Tax } from "../types";

export async function listTaxes(params: { page?: number } = {}) {
  return apiGet<Tax[]>("/taxes", { pageSize: 100, ...params }) as Promise<{ data: Tax[]; meta: ApiMeta }>;
}
