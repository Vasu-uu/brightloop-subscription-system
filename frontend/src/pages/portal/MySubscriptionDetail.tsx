import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getMySubscription } from "../../api/portal";
import { Subscription } from "../../types";

export default function MySubscriptionDetail() {
  const { id } = useParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (id) getMySubscription(Number(id)).then(setSubscription);
  }, [id]);

  if (!subscription) return <div>Loading...</div>;

  return (
    <div>
      <PageHeader title={subscription.number} />
      <div className="max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white shadow-card animate-fade-in-up dark:border-gray-800 dark:bg-gray-900 p-6">
        <div className="flex items-center gap-2">
          <StatusBadge status={subscription.status} />
          {subscription.isPaused && <span className="text-xs text-amber-600">(paused)</span>}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Plan</p>
            <p>{subscription.plan?.name}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Start date</p>
            <p>{new Date(subscription.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Expiry date</p>
            <p>{new Date(subscription.expiryDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Next billing</p>
            <p>{subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : "-"}</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
              <th className="py-1">Product</th>
              <th className="py-1">Qty</th>
              <th className="py-1">Unit price</th>
              <th className="py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(subscription.lines ?? []).map((line) => (
              <tr key={line.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-1">{line.product?.name}</td>
                <td className="py-1">{line.quantity}</td>
                <td className="py-1">{Number(line.unitPrice).toFixed(2)}</td>
                <td className="py-1">{Number(line.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
