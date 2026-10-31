import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function PortalShell() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-indigo-600">Brightloop</span>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/portal/subscriptions"
              className={({ isActive }) => (isActive ? "font-medium text-indigo-700" : "text-gray-600")}
            >
              My Subscriptions
            </NavLink>
            <NavLink
              to="/portal/invoices"
              className={({ isActive }) => (isActive ? "font-medium text-indigo-700" : "text-gray-600")}
            >
              My Invoices
            </NavLink>
          </nav>
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">
          Log out
        </button>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
