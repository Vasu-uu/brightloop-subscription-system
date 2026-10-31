import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Check, Circle } from "lucide-react";
import { AuthLayout } from "../../components/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import * as authApi from "../../api/auth";

const RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: "More than 8 characters", test: (pw) => pw.length > 8 },
  { label: "An uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "A lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "A special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setLoading(true);
    try {
      const result = await authApi.signup({ email, password, name });
      login(result.token);
      navigate("/portal/subscriptions");
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      if (apiError?.fields?.email) {
        setEmailError(apiError.fields.email);
      } else {
        setError(apiError?.message ?? "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Get started with Brightloop in seconds.">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError ?? undefined}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          {RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li
                key={rule.label}
                className={`flex items-center gap-1 transition-colors ${ok ? "text-green-600" : "text-gray-400"}`}
              >
                {ok ? <Check className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                {rule.label}
              </li>
            );
          })}
        </ul>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
        <div className="pt-1 text-sm">
          <Link to="/login" className="text-brand-600 hover:text-brand-700">
            Already have an account? Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
