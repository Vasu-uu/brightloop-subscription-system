import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import { ApiMeta, QuotationTemplate } from "../types";

export type TemplateLineInput = { productId: number; variantId?: number | null; quantity: number };
export type TemplateInput = {
  name: string;
  planId: number;
  validityDays: number;
  lines: TemplateLineInput[];
};

export async function listTemplates(params: { page?: number; pageSize?: number; search?: string }) {
  return apiGet<QuotationTemplate[]>("/quotation-templates", params) as Promise<{
    data: QuotationTemplate[];
    meta: ApiMeta;
  }>;
}

export async function getTemplate(id: number) {
  return apiGet<QuotationTemplate>(`/quotation-templates/${id}`).then((r) => r.data);
}

export async function createTemplate(input: TemplateInput) {
  return apiPost<QuotationTemplate>("/quotation-templates", input);
}

export async function updateTemplate(id: number, input: TemplateInput) {
  return apiPut<QuotationTemplate>(`/quotation-templates/${id}`, input);
}

export async function deleteTemplate(id: number) {
  return apiDelete<{ id: number }>(`/quotation-templates/${id}`);
}
