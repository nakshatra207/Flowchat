export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string;
  statusMessage?: string;
  role: "user" | "admin" | "moderator";
  presence: "online" | "offline" | "away" | "busy";
  lastSeenAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  title?: string;
  participants: User[];
  group?: Group;
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: User;
  content: string;
  attachments: Attachment[];
  reactions: Array<{ user_id: string; emoji: string }>;
  reads: Array<{ user_id: string; read_at: string }>;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string | null;
  ownerId: string;
  members: Array<{ userId: string; isAdmin: boolean }>;
  permissions: {
    onlyAdminsCanMessage: boolean;
    onlyAdminsCanInvite: boolean;
    onlyAdminsCanEditInfo: boolean;
  };
}

export interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  kind: "image" | "video" | "pdf" | "file";
}

export interface NotificationItem {
  id: string;
  type: "message" | "mention" | "reaction" | "group_invite" | "system";
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}
