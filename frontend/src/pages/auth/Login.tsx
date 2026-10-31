// Placeholder pending P1's real auth pages. Lets a token be pasted in for
// manual testing until /auth/login exists.
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function Login() {
  const [token, setToken] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login(token);
    navigate("/app/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Sign in (dev placeholder)</h1>
        <Input label="JWT token" value={token} onChange={(e) => setToken(e.target.value)} />
        <Button type="submit" className="mt-4 w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}
