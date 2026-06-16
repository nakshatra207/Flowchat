import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuthStore } from "../store/auth-store";
import type { AuthError } from "@supabase/supabase-js";

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [form, setForm] = useState({ email: "", username: "", displayName: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register(form);
      navigate("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as AuthError)?.message ?? "Registration failed.";
      setError(msg);
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
            <h1 className="text-xl font-semibold">Create FlowChat Account</h1>
            <p className="text-sm text-slate-500">Start secure team messaging</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Display name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
          <Input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button className="w-full" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <Link className="font-semibold text-primary" to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
