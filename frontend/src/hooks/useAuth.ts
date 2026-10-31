import { useCallback, useState } from "react";
import { Role } from "../types";

type JwtPayload = { userId: number; role: Role };

// TEMPORARY bootstrap: P1 owns this hook and the real /auth/login + /auth/me
// flow. Until that lands, this decodes the JWT payload client-side so
// role-gated UI and API calls work. Replace with the real implementation
// once P1's auth module is merged.
function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const payload = token ? decodeToken(token) : null;

  const login = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  return {
    user: payload ? { id: payload.userId, role: payload.role } : null,
    role: payload?.role ?? null,
    login,
    logout,
  };
}
