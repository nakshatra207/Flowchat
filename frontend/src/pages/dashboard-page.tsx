import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Plus, Search, Send, User, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth-store";
import type { Message, User as UserType } from "../types/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";

// ─── Local types ────────────────────────────────────────────────────────────

type DbConversation = {
  id: string;
  type: "direct" | "group";
  title: string;
  group_id: string | null;
  last_message_at: string | null;
  group_name: string | null;
  other_user_name: string | null;
  other_user_id: string | null;
  unread: number;
};

type DbMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  sender: { id: string; username: string; display_name: string; avatar_url: string | null };
};

type SearchUser = { id: string; username: string; display_name: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function msgToMessage(row: DbMessage): Message {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender: {
      id: row.sender.id,
      email: "",
      username: row.sender.username,
      displayName: row.sender.display_name,
      avatarUrl: row.sender.avatar_url,
      role: "user",
      presence: "offline",
    } as UserType,
    content: row.content,
    attachments: [],
    reactions: [],
    reads: [],
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
  };
}

function convLabel(conv: DbConversation): string {
  if (conv.type === "direct") return conv.other_user_name ?? "Direct message";
  return conv.title || conv.group_name || "Group";
}

function convInitial(conv: DbConversation): string {
  return convLabel(conv).charAt(0).toUpperCase();
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // New DM / search panel
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const activeConv = conversations.find((c) => c.id === activeId);

  // ── Load conversations ────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        unread_count,
        conversations!inner(
          id, type, title, group_id, last_message_at,
          groups(name)
        )
      `)
      .eq("user_id", user.id)
      .order("conversation_id");

    if (error || !data) return;

    // For direct conversations we need the other participant's name
    const convIds = data
      .filter((r) => {
        const c = r.conversations as unknown as { type: string };
        return c.type === "direct";
      })
      .map((r) => r.conversation_id);

    const otherParticipants: Record<string, { user_id: string; username: string; display_name: string }> = {};
    if (convIds.length > 0) {
      const { data: others } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id, users!inner(username, display_name)")
        .in("conversation_id", convIds)
        .neq("user_id", user.id);

      if (others) {
        for (const o of others) {
          const u = o.users as unknown as { username: string; display_name: string };
          otherParticipants[o.conversation_id] = {
            user_id: o.user_id,
            username: u.username,
            display_name: u.display_name,
          };
        }
      }
    }

    const convs: DbConversation[] = data.map((row) => {
      const conv = row.conversations as unknown as {
        id: string; type: string; title: string; group_id: string | null;
        last_message_at: string | null; groups: { name: string } | null;
      };
      const other = otherParticipants[row.conversation_id];
      return {
        id: conv.id,
        type: conv.type as "direct" | "group",
        title: conv.title,
        group_id: conv.group_id,
        last_message_at: conv.last_message_at,
        group_name: conv.groups?.name ?? null,
        other_user_name: other ? (other.display_name || other.username) : null,
        other_user_id: other?.user_id ?? null,
        unread: row.unread_count,
      };
    });

    // Sort by last_message_at desc, then by id for stable order
    convs.sort((a, b) => {
      if (a.last_message_at && b.last_message_at)
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      if (a.last_message_at) return -1;
      if (b.last_message_at) return 1;
      return 0;
    });

    setConversations(convs);
    setActiveId((prev) => prev || (convs.length > 0 ? convs[0].id : ""));
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Load messages ─────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at, edited_at, deleted_at, sender:users!sender_id(id, username, display_name, avatar_url)")
      .eq("conversation_id", convId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) setMessages((data as unknown as DbMessage[]).map(msgToMessage));
  }, []);

  // ── Real-time subscription ────────────────────────────────────────────────

  useEffect(() => {
    if (!activeId || !user) return;
    setMessages([]);
    loadMessages(activeId);

    // Clear unread count when opening conversation
    supabase
      .from("conversation_participants")
      .update({ unread_count: 0 })
      .eq("conversation_id", activeId)
      .eq("user_id", user.id)
      .then(() => {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, unread: 0 } : c))
        );
      });

    const channel = supabase
      .channel(`msgs:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; sender_id: string };
          // Don't double-add own messages (already appended optimistically)
          if (row.sender_id === user.id) return;
          const { data } = await supabase
            .from("messages")
            .select("id, conversation_id, sender_id, content, created_at, edited_at, deleted_at, sender:users!sender_id(id, username, display_name, avatar_url)")
            .eq("id", row.id)
            .single();
          if (data) setMessages((prev) => [...prev, msgToMessage(data as unknown as DbMessage)]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId, user, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const convId = activeIdRef.current;
    const text = content.trim();
    if (!text || !convId || !user || sending) return;

    setContent("");
    setSending(true);

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: convId,
      sender: user as unknown as UserType,
      content: text,
      attachments: [],
      reactions: [],
      reads: [],
      editedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ conversation_id: convId, sender_id: user.id, content: text })
      .select("id, conversation_id, sender_id, content, created_at, edited_at, deleted_at, sender:users!sender_id(id, username, display_name, avatar_url)")
      .single();

    if (error) {
      // Rollback optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSending(false);
      return;
    }

    // Replace temp with real
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? msgToMessage(inserted as unknown as DbMessage) : m))
    );

    // Update last_message_at + increment unread for other participants
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convId);

    await supabase.rpc("increment_unread_except", {
      p_conversation_id: convId,
      p_user_id: user.id,
    });

    // Refresh conv list to show updated order
    loadConversations();
    setSending(false);
  }

  // ── User search for new DM ────────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("users")
        .select("id, username, display_name")
        .neq("id", user.id)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(8);
      setSearchResults((data as SearchUser[]) ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  async function startDM(targetUser: SearchUser) {
    if (!user) return;

    // Check if DM already exists between these two users
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversations!inner(id, type)")
      .eq("user_id", user.id);

    if (existing) {
      for (const row of existing) {
        const conv = row.conversations as unknown as { id: string; type: string };
        if (conv.type !== "direct") continue;
        // Check if target user is also in this conversation
        const { data: check } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("conversation_id", conv.id)
          .eq("user_id", targetUser.id)
          .maybeSingle();
        if (check) {
          setActiveId(conv.id);
          setShowSearch(false);
          setSearchQuery("");
          return;
        }
      }
    }

    // Create new DM conversation
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ type: "direct", title: "" })
      .select()
      .single();

    if (error || !conv) return;

    await supabase.from("conversation_participants").insert([
      { conversation_id: conv.id, user_id: user.id, unread_count: 0 },
      { conversation_id: conv.id, user_id: targetUser.id, unread_count: 0 },
    ]);

    await loadConversations();
    setActiveId(conv.id);
    setShowSearch(false);
    setSearchQuery("");
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="grid h-[calc(100vh-5rem)] gap-0 overflow-hidden rounded-lg border border-border bg-white lg:grid-cols-[300px_1fr]">

      {/* Sidebar */}
      <div className="flex flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold text-slate-800">Messages</h2>
          <button
            onClick={() => { setShowSearch((v) => !v); setSearchQuery(""); setSearchResults([]); }}
            className="grid size-8 place-items-center rounded-md hover:bg-muted transition-colors text-slate-500"
            title="New message"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search / new DM panel */}
        {showSearch && (
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                className="h-9 w-full rounded-md border border-border bg-muted pl-9 pr-3 text-sm outline-none focus:border-primary"
                placeholder="Search users…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searching && <p className="mt-2 text-xs text-slate-400">Searching…</p>}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startDM(u)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted transition-colors"
                  >
                    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {u.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{u.display_name}</div>
                      <div className="text-xs text-slate-400">@{u.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!searching && searchQuery && searchResults.length === 0 && (
              <p className="mt-2 text-xs text-slate-400">No users found.</p>
            )}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
              <MessageSquare size={32} className="opacity-30" />
              <p className="text-sm">No conversations yet.</p>
              <p className="text-xs">Click <strong>+</strong> to message someone, or create a group.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  activeId === conv.id && "bg-muted"
                )}
              >
                <div className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white",
                  conv.type === "direct" ? "bg-primary" : "bg-slate-700"
                )}>
                  {conv.type === "direct" ? <User size={17} /> : convInitial(conv)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-sm font-semibold text-slate-800">{convLabel(conv)}</span>
                    {conv.last_message_at && (
                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-slate-400 truncate">
                      {conv.type === "direct" ? "Direct message" : "Group chat"}
                    </span>
                    {conv.unread > 0 && (
                      <span className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          {activeConv ? (
            <>
              <div className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white",
                activeConv.type === "direct" ? "bg-primary" : "bg-slate-700"
              )}>
                {activeConv.type === "direct" ? <User size={16} /> : convInitial(activeConv)}
              </div>
              <div>
                <div className="font-semibold text-slate-800">{convLabel(activeConv)}</div>
                <div className="text-xs text-slate-400">
                  {activeConv.type === "direct" ? "Direct message" : "Group conversation"}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">Select a conversation or start a new one</div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {!activeId ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <Users size={40} className="opacity-20" />
              <p className="text-sm">Pick a conversation to start chatting</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <MessageSquare size={32} className="opacity-20" />
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, i) => {
                const mine = msg.sender?.id === user?.id;
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const sameSender = prevMsg?.sender?.id === msg.sender?.id;
                return (
                  <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start", !sameSender && "mt-3")}>
                    {!mine && !sameSender && (
                      <div className="mr-2 mt-0.5 grid size-7 shrink-0 place-items-center self-end rounded-full bg-slate-300 text-xs font-bold text-slate-700">
                        {(msg.sender?.displayName ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!mine && sameSender && <div className="mr-2 size-7 shrink-0" />}
                    <div className="max-w-[72%]">
                      {!mine && !sameSender && (
                        <div className="mb-1 ml-1 text-xs font-medium text-slate-500">
                          {msg.sender?.displayName}
                        </div>
                      )}
                      <div className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                        mine
                          ? "rounded-br-sm bg-primary text-white"
                          : "rounded-bl-sm bg-white text-slate-900 shadow-sm"
                      )}>
                        {msg.content}
                      </div>
                      {!sameSender || i === messages.length - 1 ? (
                        <div className={cn("mt-0.5 text-xs text-slate-400", mine ? "text-right" : "text-left")}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-border bg-white px-4 py-3"
        >
          <Input
            placeholder={activeId ? "Type a message…" : "Select a conversation first"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!activeId}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!activeId || !content.trim() || sending}
            className="shrink-0 gap-1.5"
          >
            <Send size={15} />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
