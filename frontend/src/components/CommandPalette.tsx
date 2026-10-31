import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, LucideIcon, Play, Plus, Search } from "lucide-react";
import { NAV_GROUPS } from "./nav";
import { Role } from "../types";

type Command = { id: string; label: string; hint?: string; icon: LucideIcon; run: () => void; group: string };

export function CommandPalette({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => navigate(to);
    const nav: Command[] = NAV_GROUPS.flatMap((g) =>
      g.items
        .filter((i) => !i.roles || (role && i.roles.includes(role)))
        .map((i) => ({ id: i.to, label: i.label, hint: "Go to", icon: i.icon, group: "Navigate", run: go(i.to) }))
    );
    const actions: Command[] = [
      { id: "new-sub", label: "New subscription", icon: Plus, group: "Actions", run: go("/app/subscriptions/new") },
      { id: "new-tpl", label: "New quotation template", icon: Plus, group: "Actions", run: go("/app/templates/new") },
      { id: "billing", label: "Run billing", hint: "Opens Invoices", icon: Play, group: "Actions", run: go("/app/invoices?billing=1") },
    ];
    return [...actions, ...nav];
  }, [navigate, role]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(filtered.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && filtered[active]) {
      filtered[active].run();
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-gray-900/50 px-4 pt-[14vh] backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-lg animate-scale-in overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-400">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && <li className="px-3 py-8 text-center text-sm text-gray-400">No matches</li>}
          {filtered.map((c, i) => {
            const header = c.group !== lastGroup;
            lastGroup = c.group;
            return (
              <li key={c.id}>
                {header && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{c.group}</p>}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    c.run();
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    i === active ? "bg-brand-50 text-brand-800" : "text-gray-700"
                  }`}
                >
                  <c.icon className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="flex-1">{c.label}</span>
                  {c.hint && <span className="text-xs text-gray-400">{c.hint}</span>}
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 opacity-60" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
