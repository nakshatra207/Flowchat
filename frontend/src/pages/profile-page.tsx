import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth-store";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);

    const { data } = await supabase
      .from("users")
      .update({ display_name: displayName, bio, status_message: statusMessage })
      .eq("id", user.id)
      .select()
      .single();

    if (data) {
      updateUser({ ...user, displayName, bio, statusMessage });
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <Card className="max-w-2xl p-5">
      <h1 className="text-xl font-semibold">Profile</h1>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
          <Input value={user?.email ?? ""} disabled />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Username</label>
          <Input value={user?.username ?? ""} disabled />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Display name</label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Status message</label>
          <Input value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} placeholder="Status message" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Bio</label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" />
        </div>
        {saved && <p className="text-sm text-green-600">Profile saved.</p>}
        <Button disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
      </form>
    </Card>
  );
}
