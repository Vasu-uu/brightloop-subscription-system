import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <Compass className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-lg font-semibold text-gray-900">Page not found</p>
      <p className="text-sm text-gray-500">The page you're looking for doesn't exist.</p>
      <Link to="/login" className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
        Back to sign in
      </Link>
    </div>
  );
}
