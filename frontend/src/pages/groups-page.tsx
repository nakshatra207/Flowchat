import { FormEvent, useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { api } from "../lib/api";
import type { Group } from "../types/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

export function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function loadGroups() {
    const { data } = await api.get<{ groups: Group[] }>("/groups");
    setGroups(data.groups);
  }

  useEffect(() => {
    loadGroups();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await api.post("/groups", { name, description, memberIds: [] });
    setName("");
    setDescription("");
    await loadGroups();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <h1 className="text-xl font-semibold">Create Group</h1>
        <form className="mt-5 space-y-4" onSubmit={handleCreate}>
          <Input placeholder="Group name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Textarea placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button>Create group</Button>
        </form>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Your Groups</h2>
        </div>
        <div className="divide-y divide-border">
          {groups.map((group) => (
            <div key={group._id} className="flex items-center gap-3 p-4">
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

