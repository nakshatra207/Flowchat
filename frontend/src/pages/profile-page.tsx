import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth-store";
import type { User } from "../types/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage ?? "");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { data } = await api.patch<{ user: User }>("/users/me", { displayName, bio, statusMessage });
    updateUser(data.user);
  }

  return (
    <Card className="max-w-2xl p-5">
      <h1 className="text-xl font-semibold">Profile</h1>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" />
        <Input value={statusMessage} onChange={(event) => setStatusMessage(event.target.value)} placeholder="Status message" />
        <Textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Bio" />
        <Button>Save profile</Button>
      </form>
    </Card>
  );
}

