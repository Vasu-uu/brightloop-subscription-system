import { ReactNode } from "react";
import { CheckCircle2, Repeat, Receipt, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

const FEATURES = [
  { icon: Repeat, title: "Subscriptions on autopilot", text: "From quotation to active, with every renewal tracked." },
  { icon: Receipt, title: "Invoices that create themselves", text: "Taxes and discounts applied, nothing billed twice." },
  { icon: TrendingUp, title: "Revenue you can trust", text: "Collected, owed and overdue in one live view." },
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white dark:bg-gray-950 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden animate-gradient-pan overflow-hidden bg-gradient-to-br from-brand-700 via-violet-700 to-brand-900 bg-[length:200%_200%] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 animate-float rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Brightloop</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Run recurring revenue without the spreadsheet.</h2>
          <ul className="mt-8 space-y-5">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="flex animate-fade-in-up gap-3" style={{ animationDelay: `${200 + i * 120}ms`, animationFillMode: "backwards" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-white/75">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex animate-fade-in-up items-center gap-3 rounded-xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur" style={{ animationDelay: "700ms", animationFillMode: "backwards" }}>
          <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-300 animate-pop-in" />
          <div className="text-sm">
            <p className="font-semibold">INV-04512 paid</p>
            <p className="text-white/70">Payment received just now. Balance cleared.</p>
          </div>
          <ShieldCheck className="ml-auto h-5 w-5 text-white/60" />
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl lg:hidden" />
        <div className="relative w-full max-w-sm animate-fade-in-up">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
              <Sparkles className="h-[18px] w-[18px]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Brightloop</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  );
}
