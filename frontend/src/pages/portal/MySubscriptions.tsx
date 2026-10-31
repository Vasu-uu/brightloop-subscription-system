import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Repeat } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { listMySubscriptions } from "../../api/portal";
import { Subscription } from "../../types";
import { formatDate, formatMoney } from "../../lib/format";

export default function MySubscriptions() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Subscription[] | null>(null);

  useEffect(() => {
    listMySubscriptions(1, 100).then((r) => setRows(r.data));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="My subscriptions" description="Everything you subscribe to, and when you are billed next." />
      {rows === null ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Repeat} title="No subscriptions yet" description="When you subscribe to a plan it will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((s, i) => {
            const perPeriod = (s.lines ?? []).reduce((sum, l) => sum + Number(l.amount) * (1 + Number(l.taxPercent) / 100), 0);
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/portal/subscriptions/${s.id}`)}
                className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{s.plan?.name}</p>
                    <p className="text-xs text-gray-500">{s.number}</p>
                  </div>
                  <StatusBadge status={s.isPaused ? "PAUSED" : s.status} />
                </div>
                <p className="mt-4 text-2xl font-bold tabular-nums tracking-tight text-gray-900">
                  {formatMoney(perPeriod)}
                  <span className="ml-1 text-xs font-medium text-gray-500">/ {s.plan?.billingPeriod.toLowerCase()}</span>
                </p>
                <div className="mt-4 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {s.status === "ACTIVE" && s.nextBillingDate ? `Next billing ${formatDate(s.nextBillingDate)}` : `Term ${formatDate(s.startDate)} - ${formatDate(s.expiryDate)}`}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
