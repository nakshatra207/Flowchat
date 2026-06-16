import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Send, UsersRound } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth-store";
import type { Message, User } from "../types/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";

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

type DbConversation = {
  id: string;
  type: string;
  title: string;
  last_message_at: string | null;
  group_id: string | null;
  groups: { name: string } | null;
  unread: number;
};

function dbMsgToMessage(row: DbMessage): Message {
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
      presence: "offline"
    } as User,
    content: row.content,
    attachments: [],
    reactions: [],
    reads: [],
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at
  };
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversation_participants")
      .select(`conversation_id, unread_count, conversations!inner(id, type, title, last_message_at, group_id, groups(name))`)
      .eq("user_id", user.id);

    if (!data) return;

    const convs: DbConversation[] = data.map((row) => {
      const conv = row.conversations as unknown as Record<string, unknown>;
      return {
        id: conv.id as string,
        type: conv.type as string,
        title: conv.title as string,
        last_message_at: conv.last_message_at as string | null,
        group_id: conv.group_id as string | null,
        groups: conv.groups as { name: string } | null,
        unread: row.unread_count
      };
    });

    setConversations(convs);
    if (!activeId && convs.length > 0) setActiveId(convs[0].id);
  }, [user, activeId]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (!activeId || !user) return;
    loadMessages(activeId);

    const channel = supabase
      .channel(`conv-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        async (payload) => {
          const newRow = payload.new as { id: string };
          const { data } = await supabase
            .from("messages")
            .select("id, conversation_id, sender_id, content, created_at, edited_at, deleted_at, sender:users!sender_id(id, username, display_name, avatar_url)")
            .eq("id", newRow.id)
            .single();
          if (data) setMessages((prev) => [...prev, dbMsgToMessage(data as unknown as DbMessage)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at, edited_at, deleted_at, sender:users!sender_id(id, username, display_name, avatar_url)")
      .eq("conversation_id", convId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (data) setMessages((data as unknown as DbMessage[]).map(dbMsgToMessage));
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!content.trim() || !activeId || !user) return;
    const text = content.trim();
    setContent("");

    await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: user.id,
      content: text
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeId);
  }

  function convLabel(conv: DbConversation) {
    if (conv.title) return conv.title;
    if (conv.groups?.name) return conv.groups.name;
    return "Direct message";
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Conversations</h2>
          <p className="text-sm text-slate-500">Direct and group messages</p>
        </div>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No conversations yet. Create a group to get started.</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border p-4 text-left hover:bg-muted/60 transition-colors",
                  activeId === conv.id && "bg-muted"
                )}
                onClick={() => setActiveId(conv.id)}
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-md bg-slate-900 text-white">
                  <UsersRound size={18} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{convLabel(conv)}</div>
                  {conv.unread > 0 && (
                    <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                      {conv.unread} unread
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="flex min-h-[620px] flex-col overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">{activeConv ? convLabel(activeConv) : "Chat"}</h2>
          <p className="text-sm text-slate-500">{activeConv ? "Active conversation" : "Select a conversation"}</p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {messages.map((message) => {
            const mine = message.sender?.id === user?.id;
            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[78%] rounded-lg px-3 py-2 text-sm", mine ? "bg-primary text-white" : "bg-white text-slate-900 shadow-sm")}>
                  {!mine && <div className="mb-1 text-xs font-medium opacity-75">{message.sender?.displayName}</div>}
                  <div>{message.content}</div>
                  <div className={cn("mt-1 text-right text-xs opacity-50", mine ? "text-white" : "text-slate-500")}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form className="flex gap-2 border-t border-border p-3" onSubmit={handleSend}>
          <button
            className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-white hover:bg-muted transition-colors"
            type="button"
            aria-label="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <Input
            placeholder="Type a message…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!activeId}
          />
          <Button disabled={!activeId || !content.trim()}>
            <Send size={17} />
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
