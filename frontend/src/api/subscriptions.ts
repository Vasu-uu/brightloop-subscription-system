import { apiGet, apiPost, apiPut } from "./client";
import { ApiMeta, Subscription, SubscriptionStatus } from "../types";

export type SubscriptionLineInput = { productId: number; variantId?: number | null; quantity: number };
export type SubscriptionInput = {
  customerId: number;
  planId: number;
  startDate: string;
  expiryDate: string;
  paymentTermDays: number;
  lines: SubscriptionLineInput[];
};

export async function listSubscriptions(params: {
  page?: number;
  status?: string;
  customerId?: number;
  search?: string;
}) {
  return apiGet<Subscription[]>("/subscriptions", params) as Promise<{ data: Subscription[]; meta: ApiMeta }>;
}

export async function getSubscription(id: number) {
  return apiGet<Subscription>(`/subscriptions/${id}`).then((r) => r.data);
}

export async function createSubscription(input: SubscriptionInput) {
  return apiPost<Subscription>("/subscriptions", input);
}

export async function updateSubscription(id: number, input: SubscriptionInput) {
  return apiPut<Subscription>(`/subscriptions/${id}`, input);
}

export async function createFromTemplate(input: { templateId: number; customerId: number; startDate: string }) {
  return apiPost<Subscription>("/subscriptions/from-template", input);
}

export async function transitionSubscription(id: number, to: SubscriptionStatus) {
  return apiPost<Subscription>(`/subscriptions/${id}/transition`, { to });
}

export async function pauseSubscription(id: number) {
  return apiPost<Subscription>(`/subscriptions/${id}/pause`);
}

export async function resumeSubscription(id: number) {
  return apiPost<Subscription>(`/subscriptions/${id}/resume`);
}

export async function renewSubscription(id: number) {
  return apiPost<Subscription>(`/subscriptions/${id}/renew`);
}
