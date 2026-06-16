import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth-store";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

export function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPwError(error.message); } else { setPwSuccess(true); setNewPassword(""); setConfirmPassword(""); }
    setSavingPw(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <h1 className="mb-4 text-xl font-semibold">Account</h1>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium truncate">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-slate-500">Username</dt>
            <dd className="font-medium">@{user?.username}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-slate-500">Role</dt>
            <dd className="font-medium capitalize">{user?.role}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Status</dt>
            <dd className="flex items-center gap-1.5 font-medium">
              <span className={`inline-block size-2 rounded-full ${user?.presence === "online" ? "bg-green-500" : "bg-slate-400"}`} />
              {user?.presence}
            </dd>
          </div>
        </dl>
        <Button
          className="mt-6 w-full"
          style={{ background: "hsl(0 72% 51%)" }}
          onClick={logout}
        >
          Sign out
        </Button>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Change Password</h2>
          <form className="space-y-3" onSubmit={handlePasswordChange}>
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-600">Password updated successfully.</p>}
            <Button disabled={savingPw} className="w-full">
              {savingPw ? "Updating…" : "Update password"}
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="mb-2 font-semibold">Browser Notifications</h2>
          <p className="mb-4 text-sm text-slate-500">
            Enable notifications to get alerted when new messages arrive.
          </p>
          <Button className="w-full" onClick={() => Notification.requestPermission()}>
            Enable notifications
          </Button>
        </Card>
      </div>
    </div>
  );
}
