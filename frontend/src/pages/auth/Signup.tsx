import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Create your account</h1>
        <div className="space-y-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
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
          <ul className="space-y-0.5 text-xs">
            {RULES.map((rule) => (
              <li key={rule.label} className={rule.test(password) ? "text-green-600" : "text-gray-400"}>
                {rule.test(password) ? "✓" : "○"} {rule.label}
              </li>
            ))}
          </ul>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="mt-4 w-full" disabled={loading}>
          Create account
        </Button>
        <div className="mt-4 text-sm text-gray-500">
          <Link to="/login" className="hover:text-gray-700">
            Already have an account? Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
