import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center dark:bg-gray-950">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
        <ShieldAlert className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">Access denied</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">You don't have permission to view this page.</p>
      <Link to="/login" className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
        Back to sign in
      </Link>
    </div>
  );
}
