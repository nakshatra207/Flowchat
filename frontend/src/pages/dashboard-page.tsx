import { FormEvent, useEffect, useMemo, useState } from "react";
import { Paperclip, Send, UsersRound } from "lucide-react";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../store/auth-store";
import type { Conversation, Message } from "../types/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeId),
    [activeId, conversations]
  );

  useEffect(() => {
    api.get<{ conversations: Conversation[] }>("/conversations").then(({ data }) => {
      setConversations(data.conversations);
      setActiveId(data.conversations[0]?._id ?? "");
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    api.get<{ messages: Message[] }>(`/messages/conversation/${activeId}`).then(({ data }) => setMessages(data.messages));
    const socket = getSocket();
    socket.connect();
    socket.emit("join-room", activeId);
    socket.on("receive-message", ({ message }: { message: Message }) => setMessages((current) => [...current, message]));

    return () => {
      socket.emit("leave-room", activeId);
      socket.off("receive-message");
    };
  }, [activeId]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!content.trim() || !activeId) return;

    const { data } = await api.post<{ message: Message }>("/messages", {
      conversationId: activeId,
      content,
      attachmentIds: []
    });
    setMessages((current) => [...current, data.message]);
    getSocket().emit("send-message", { roomId: activeId, messageId: data.message._id });
    setContent("");
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
            <div className="p-4 text-sm text-slate-500">No conversations yet. Create a group or start from the API.</div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation._id}
                className={cn("flex w-full items-center gap-3 border-b border-border p-4 text-left", activeId === conversation._id && "bg-muted")}
                onClick={() => setActiveId(conversation._id)}
              >
                <div className="grid size-10 place-items-center rounded-md bg-slate-900 text-white">
                  <UsersRound size={18} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{conversation.title || conversation.group?.name || "Direct message"}</div>
                  <div className="truncate text-xs text-slate-500">{conversation.lastMessage?.content || "No messages yet"}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
      <Card className="flex min-h-[620px] flex-col overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">{activeConversation?.title || activeConversation?.group?.name || "Chat"}</h2>
          <p className="text-sm text-slate-500">{activeConversation ? `${activeConversation.participants?.length ?? 0} participants` : "Select a conversation"}</p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {messages.map((message) => {
            const mine = message.sender?._id === user?._id;
            return (
              <div key={message._id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[78%] rounded-lg px-3 py-2 text-sm", mine ? "bg-primary text-white" : "bg-white text-slate-900 shadow-sm")}>
                  <div className="mb-1 text-xs opacity-75">{message.sender?.displayName}</div>
                  {message.content}
                </div>
              </div>
            );
          })}
        </div>
        <form className="flex gap-2 border-t border-border p-3" onSubmit={handleSend}>
          <button className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-white" type="button" aria-label="Attach file">
            <Paperclip size={18} />
          </button>
          <Input placeholder="Type a message" value={content} onChange={(event) => setContent(event.target.value)} disabled={!activeId} />
          <Button disabled={!activeId}>
            <Send size={17} />
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}

