import { apiGet, apiPost } from "./client";
import { ApiMeta, User } from "../types";

export async function listStaff(params: { page?: number; search?: string } = {}) {
  return apiGet<User[]>("/staff", params) as Promise<{ data: User[]; meta: ApiMeta }>;
}

export const createStaff = (input: { name: string; email: string; password: string; phone?: string }) =>
  apiPost<User>("/staff", input);
