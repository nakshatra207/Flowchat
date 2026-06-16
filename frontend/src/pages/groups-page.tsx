import { FormEvent, useCallback, useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth-store";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

type DbGroup = {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  owner_id: string;
};

export function GroupsPage() {
  const user = useAuthStore((state) => state.user);
  const [groups, setGroups] = useState<DbGroup[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const loadGroups = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("group_members")
      .select("groups!inner(id, name, description, avatar_url, owner_id)")
      .eq("user_id", user.id);

    if (data) {
      setGroups(data.map((row) => row.groups as unknown as DbGroup));
    }
  }, [user]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setError("");

    const { data: group, error: gErr } = await supabase
      .from("groups")
      .insert({ name, description, owner_id: user.id })
      .select()
      .single();

    if (gErr || !group) {
      setError(gErr?.message ?? "Failed to create group");
      return;
    }

    await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id, is_admin: true });

    const { data: conv } = await supabase
      .from("conversations")
      .insert({ type: "group", group_id: group.id, title: name })
      .select()
      .single();

    if (conv) {
      await supabase.from("conversation_participants").insert({ conversation_id: conv.id, user_id: user.id, unread_count: 0 });
    }

    setName("");
    setDescription("");
    await loadGroups();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <h1 className="text-xl font-semibold">Create Group</h1>
        <form className="mt-5 space-y-4" onSubmit={handleCreate}>
          <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button>Create group</Button>
        </form>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Your Groups</h2>
        </div>
        <div className="divide-y divide-border">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center gap-3 p-4">
              <div className="grid size-10 place-items-center rounded-md bg-slate-900 text-white">
                <UsersRound size={18} />
              </div>
              <div>
                <div className="font-semibold">{group.name}</div>
                <div className="text-sm text-slate-500">{group.description || "No description"}</div>
              </div>
            </div>
          ))}
          {groups.length === 0 && <div className="p-4 text-sm text-slate-500">No groups yet.</div>}
        </div>
      </Card>
    </div>
  );
}
