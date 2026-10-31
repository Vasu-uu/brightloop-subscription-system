import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, Search, Sparkles, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useMe } from "../hooks/useMe";
import { NAV_GROUPS } from "./nav";
import { CommandPalette } from "./CommandPalette";

function initials(name?: string) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

export function AppShell() {
  const { role, logout } = useAuth();
  const me = useMe();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const location = useLocation();

  useEffect(() => setDrawer(false), [location.pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const closePalette = useCallback(() => setPalette(false), []);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30 transition-transform hover:rotate-6">
          <Sparkles className="h-[18px] w-[18px]" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-gray-900">Brightloop</p>
          <p className="text-[11px] text-gray-500">Subscription billing</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.roles || (role && i.roles.includes(role)));
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group.title}</p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-gray-600 hover:translate-x-0.5 hover:bg-gray-100 hover:text-gray-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute left-0 top-1.5 h-5 w-[3px] rounded-r bg-brand-600 transition-all duration-300 ${
                            isActive ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                          }`}
                        />
                        <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600"}`} />
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
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
            {initials(me?.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-gray-900">{me?.name ?? "..."}</p>
            <p className="truncate text-xs capitalize text-gray-500">{role?.toLowerCase()}</p>
          </div>
          <button onClick={logout} aria-label="Log out" className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-gray-200 bg-white lg:block">
        {sidebar}
      </aside>

      {drawer && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-gray-900/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in-left bg-white shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white/80 px-4 py-2.5 backdrop-blur-md sm:px-6 lg:px-8">
          <button onClick={() => setDrawer((o) => !o)} aria-label="Menu" className="rounded-md p-1.5 text-gray-600 lg:hidden">
            {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setPalette(true)}
            className="group flex w-full max-w-sm items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400 transition-all hover:border-brand-300 hover:bg-white hover:shadow-sm"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search or jump to...</span>
            <kbd className="hidden rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:block">
              {isMac ? "⌘" : "Ctrl"} K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
          </div>
        </header>
        <main key={location.pathname} className="mx-auto w-full max-w-7xl animate-fade-in-up px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={palette} onClose={closePalette} role={role} />
    </div>
  );
}
