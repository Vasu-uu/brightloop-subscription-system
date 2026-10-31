import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Reset your password</h1>
        {sent ? (
          <p className="text-sm text-gray-600">If that email is registered, a reset link has been sent.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" className="mt-4 w-full" disabled={loading}>
              Send reset link
            </Button>
          </form>
        )}
        <div className="mt-4 text-sm text-gray-500">
          <Link to="/login" className="hover:text-gray-700">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
