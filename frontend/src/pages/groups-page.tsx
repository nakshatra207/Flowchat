import { FormEvent, useCallback, useEffect, useState } from "react";
import { ChevronRight, Plus, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth-store";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/utils";

type DbGroup = {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  member_count: number;
};

type SearchUser = { id: string; username: string; display_name: string };

export function GroupsPage() {
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<DbGroup[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Invite members during creation
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<SearchUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);

  const loadGroups = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("group_members")
      .select("groups!inner(id, name, description, owner_id)")
      .eq("user_id", user.id);

    if (!data) return;

    const groupIds = data.map((r) => (r.groups as unknown as { id: string }).id);
    const memberCounts: Record<string, number> = {};
    if (groupIds.length > 0) {
      const { data: counts } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds);
      if (counts) {
        for (const r of counts) memberCounts[r.group_id] = (memberCounts[r.group_id] ?? 0) + 1;
      }
    }

    setGroups(
      data.map((r) => {
        const g = r.groups as unknown as { id: string; name: string; description: string; owner_id: string };
        return { ...g, member_count: memberCounts[g.id] ?? 1 };
      })
    );
  }, [user]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // Member search debounce
  useEffect(() => {
    if (!memberSearch.trim() || !user) { setMemberResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("users")
        .select("id, username, display_name")
        .neq("id", user.id)
        .or(`username.ilike.%${memberSearch}%,display_name.ilike.%${memberSearch}%`)
        .limit(6);
      const filtered = (data as SearchUser[] ?? []).filter(
        (u) => !selectedMembers.some((m) => m.id === u.id)
      );
      setMemberResults(filtered);
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch, user, selectedMembers]);

  function addMember(u: SearchUser) {
    setSelectedMembers((prev) => [...prev, u]);
    setMemberSearch("");
    setMemberResults([]);
  }

  function removeMember(id: string) {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!user || !name.trim()) return;
    setCreateError("");
    setCreating(true);

    const { data: group, error: gErr } = await supabase
      .from("groups")
      .insert({ name: name.trim(), description: description.trim(), owner_id: user.id })
      .select()
      .single();

    if (gErr || !group) {
      setCreateError(gErr?.message ?? "Failed to create group");
      setCreating(false);
      return;
    }

    // Add all members
    const memberInserts = [
      { group_id: group.id, user_id: user.id, is_admin: true },
      ...selectedMembers.map((m) => ({ group_id: group.id, user_id: m.id, is_admin: false })),
    ];
    await supabase.from("group_members").insert(memberInserts);

    // Create group conversation
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ type: "group", group_id: group.id, title: name.trim() })
      .select()
      .single();

    if (conv) {
      const participantInserts = [
        { conversation_id: conv.id, user_id: user.id, unread_count: 0 },
        ...selectedMembers.map((m) => ({ conversation_id: conv.id, user_id: m.id, unread_count: 0 })),
      ];
      await supabase.from("conversation_participants").insert(participantInserts);
    }

    setName("");
    setDescription("");
    setSelectedMembers([]);
    setCreating(false);
    await loadGroups();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Create group form */}
      <Card className="p-5">
        <h1 className="text-xl font-semibold">Create Group</h1>
        <form className="mt-5 space-y-4" onSubmit={handleCreate}>
          <Input
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Member search */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Invite members
            </label>
            <Input
              placeholder="Search users by name or username…"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
            {memberResults.length > 0 && (
              <div className="mt-1 rounded-md border border-border bg-white shadow-sm">
                {memberResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => addMember(u)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    <div className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {u.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">{u.display_name}</span>
                      <span className="ml-1 text-slate-400">@{u.username}</span>
                    </div>
                    <Plus size={14} className="ml-auto text-primary" />
                  </button>
                ))}
              </div>
            )}
            {selectedMembers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {m.display_name}
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="ml-0.5 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {createError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{createError}</p>
          )}
          <Button disabled={creating} className="w-full">
            {creating ? "Creating…" : "Create group"}
          </Button>
        </form>
      </Card>

      {/* Groups list */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Your Groups</h2>
          <p className="text-sm text-slate-500">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="divide-y divide-border">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center text-slate-400">
              <Users size={36} className="opacity-20" />
              <p className="text-sm">You haven't created or joined any groups yet.</p>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className={cn("flex items-center gap-4 px-5 py-4")}
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-800 text-white text-sm font-bold">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{group.name}</div>
                  <div className="text-sm text-slate-500 truncate">
                    {group.description || "No description"} · {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                  </div>
                </div>
                {group.owner_id === user?.id && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Owner
                  </span>
                )}
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
