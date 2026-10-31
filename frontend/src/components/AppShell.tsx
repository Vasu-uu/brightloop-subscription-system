import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Repeat,
  Receipt,
  Wallet,
  Package,
  Layers,
  Percent,
  Tag,
  UserCog,
  LogOut,
  Moon,
  Sun,
  Sparkles,
  Menu,
  X,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useMe } from "../hooks/useMe";
import { Role } from "../types";

type NavItem = { to: string; label: string; icon: LucideIcon; roles?: Role[] };
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Sales",
    items: [
      { to: "/app/templates", label: "Quotation templates", icon: FileText },
      { to: "/app/subscriptions", label: "Subscriptions", icon: Repeat },
    ],
  },
  {
    title: "Billing",
    items: [
      { to: "/app/invoices", label: "Invoices", icon: Receipt },
      { to: "/app/payments", label: "Payments", icon: Wallet },
    ],
  },
  {
    title: "Catalog",
    items: [
      { to: "/app/products", label: "Products", icon: Package },
      { to: "/app/plans", label: "Plans", icon: Layers },
      { to: "/app/taxes", label: "Taxes", icon: Percent },
      { to: "/app/discounts", label: "Discounts", icon: Tag },
    ],
  },
  { title: "Administration", items: [{ to: "/app/staff", label: "Staff", icon: UserCog, roles: ["ADMIN"] }] },
];

function initials(name?: string) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell() {
  const { role, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
          <Sparkles className="h-[18px] w-[18px]" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-gray-50">Brightloop</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Subscription billing</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.roles || (role && i.roles.includes(role)));
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-1.5 h-5 w-[3px] rounded-r bg-brand-600" />}
                        <item.icon className={`h-4 w-4 ${isActive ? "text-brand-600 dark:text-brand-400" : "text-gray-400 group-hover:text-gray-600"}`} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 p-3 dark:border-gray-800">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            {initials(me?.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{me?.name ?? "..."}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{role}</p>
          </div>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={logout}
            aria-label="Log out"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-gray-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in-left bg-white shadow-2xl dark:bg-gray-900">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 lg:hidden">
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="rounded-md p-1.5 text-gray-600 dark:text-gray-300">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-bold tracking-tight text-gray-900 dark:text-gray-50">Brightloop</span>
        </header>
        <main className="mx-auto w-full max-w-7xl animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
