export interface User {
  _id: string;
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
  _id: string;
  type: "direct" | "group";
  title?: string;
  participants: User[];
  group?: Group;
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCounts?: Record<string, number>;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  attachments: Attachment[];
  reactions: Array<{ user: string; emoji: string }>;
  readBy: Array<{ user: string; readAt: string }>;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  avatarUrl?: string | null;
  owner: string | User;
  admins: Array<string | User>;
  members: Array<string | User>;
  permissions: {
    onlyAdminsCanMessage: boolean;
    onlyAdminsCanInvite: boolean;
    onlyAdminsCanEditInfo: boolean;
  };
}

export interface Attachment {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  kind: "image" | "video" | "pdf" | "file";
}

export interface NotificationItem {
  _id: string;
  type: "message" | "mention" | "reaction" | "group_invite" | "system";
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

