import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuthStore } from "../store/auth-store";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(emailOrUsername, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email, username, or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-primary text-white">
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">FlowChat</h1>
            <p className="text-sm text-slate-500">Sign in to your workspace</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Email or username" value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} required />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button className="w-full" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          New to FlowChat? <Link className="font-semibold text-primary" to="/register">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
