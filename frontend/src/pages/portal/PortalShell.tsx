import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Repeat, Receipt, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const NAV_ITEMS = [
  { to: "/portal/subscriptions", label: "My Subscriptions", icon: Repeat },
  { to: "/portal/invoices", label: "My Invoices", icon: Receipt },
];

export function PortalShell() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="no-print flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            Brightloop
          </span>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </header>
      <main key={location.pathname} className="animate-fade-in-up p-6">
        <Outlet />
      </main>
    </div>
  );
}
