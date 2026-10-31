import { Navigate, Outlet } from "react-router-dom";
import { Role } from "../types";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { role } = useAuth();

  if (!role) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to="/403" replace />;

  return <Outlet />;
}
