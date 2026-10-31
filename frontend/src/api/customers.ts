import { apiGet } from "./client";
import { ApiMeta, User } from "../types";

export async function listCustomers(params: { page?: number; search?: string } = {}) {
  return apiGet<User[]>("/customers", params) as Promise<{ data: User[]; meta: ApiMeta }>;
}
