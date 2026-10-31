import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Repeat,
  Receipt,
  Wallet,
  LogOut,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/templates", label: "Templates", icon: FileText },
  { to: "/app/subscriptions", label: "Subscriptions", icon: Repeat },
  { to: "/app/invoices", label: "Invoices", icon: Receipt },
  { to: "/app/payments", label: "Payments", icon: Wallet },
];

export function AppShell() {
  const { role, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="no-print flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-50">Brightloop</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? "text-brand-600 dark:text-brand-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    }`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-800">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="no-print flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {role}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </header>
        <main className="flex-1 animate-fade-in p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
