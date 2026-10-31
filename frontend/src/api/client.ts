import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const res = await apiClient.get<{ data: T; meta?: unknown }>(url, { params });
  return res.data;
}

export async function apiPost<T>(url: string, body?: unknown) {
  const res = await apiClient.post<{ data: T }>(url, body);
  return res.data.data;
}

export async function apiPut<T>(url: string, body?: unknown) {
  const res = await apiClient.put<{ data: T }>(url, body);
  return res.data.data;
}

export async function apiDelete<T>(url: string) {
  const res = await apiClient.delete<{ data: T }>(url);
  return res.data.data;
}
