import { apiClient } from "./client";
import { User } from "../types";

export type AuthResult = { token: string; user: Omit<User, "passwordHash"> };

export async function login(email: string, password: string) {
  const res = await apiClient.post<{ data: AuthResult }>("/auth/login", { email, password });
  return res.data.data;
}

export async function signup(input: { email: string; password: string; name: string }) {
  const res = await apiClient.post<{ data: AuthResult }>("/auth/signup", input);
  return res.data.data;
}
