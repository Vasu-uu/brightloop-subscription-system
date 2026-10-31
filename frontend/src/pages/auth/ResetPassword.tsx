import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { AuthLayout } from "../../components/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { apiClient } from "../../api/client";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", { token, password });
      navigate("/login");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Make it something you'll remember.">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" loading={loading}>
          Update password
        </Button>
        <div className="pt-1 text-sm">
          <Link to="/login" className="text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
