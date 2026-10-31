import { apiGet } from "./client";
import { ApiMeta, User } from "../types";
import { ComboOption } from "../components/ui/Combobox";

export async function listCustomers(
  params: { page?: number; pageSize?: number; search?: string; sort?: string; order?: "asc" | "desc" } = {}
) {
  return apiGet<User[]>("/customers", params) as Promise<{ data: User[]; meta: ApiMeta }>;
}

export async function searchCustomers(search: string): Promise<ComboOption[]> {
  const res = await listCustomers({ search: search || undefined, pageSize: 20, sort: "name", order: "asc" });
  return res.data.map((c) => ({ id: c.id, label: c.name, hint: c.email }));
}
