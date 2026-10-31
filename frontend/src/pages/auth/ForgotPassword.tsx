import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "../../components/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { apiClient } from "../../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to get back in.">
      {sent ? (
        <div className="flex animate-fade-in flex-col items-center gap-2 py-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
            <MailCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If that email is registered, a reset link has been sent.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Button type="submit" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
      <div className="mt-4 text-sm">
        <Link to="/login" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
