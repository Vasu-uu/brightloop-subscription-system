import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { AuthLayout } from "../../components/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import * as authApi from "../../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      login(result.token);
      navigate(result.user.role === "CUSTOMER" ? "/portal/subscriptions" : "/app/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Sign in to Brightloop" subtitle="Manage subscriptions, billing and revenue in one place.">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 animate-fade-in dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
        <div className="flex justify-between pt-1 text-sm">
          <Link to="/signup" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
            Create account
          </Link>
          <Link to="/forgot-password" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
