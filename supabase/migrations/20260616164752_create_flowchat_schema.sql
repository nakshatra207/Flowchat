
-- Users table (mirrors the Mongoose user model)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT NOT NULL DEFAULT '',
  status_message TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  presence TEXT NOT NULL DEFAULT 'offline' CHECK (presence IN ('online', 'offline', 'away', 'busy')),
  last_seen_at TIMESTAMPTZ,
  refresh_token_hash TEXT,
  token_version INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  permissions JSONB NOT NULL DEFAULT '{"onlyAdminsCanMessage":false,"onlyAdminsCanInvite":false,"onlyAdminsCanEditInfo":true}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (group_id, user_id)
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  group_id UUID REFERENCES groups(id),
  title TEXT NOT NULL DEFAULT '',
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (conversation_id, user_id)
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  message_id UUID,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'pdf', 'file')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL DEFAULT '',
  reply_to_id UUID REFERENCES messages(id),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from conversations.last_message_id now that messages table exists
ALTER TABLE conversations ADD CONSTRAINT fk_last_message FOREIGN KEY (last_message_id) REFERENCES messages(id);

-- Add FK from attachments.message_id now that messages table exists
ALTER TABLE attachments ADD CONSTRAINT fk_attachment_message FOREIGN KEY (message_id) REFERENCES messages(id);

-- Message attachments (join)
CREATE TABLE IF NOT EXISTS message_attachments (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, attachment_id)
);

-- Message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS message_reads (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id),
  actor_id UUID REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  type TEXT NOT NULL CHECK (type IN ('message', 'mention', 'reaction', 'group_invite', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);

-- RLS: disable for now (all access via service role from backend)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (backend uses service role key)
CREATE POLICY "service_role_all_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_groups" ON groups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_group_members" ON group_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_conversations" ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_cp" ON conversation_participants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_messages" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_msg_attach" ON message_attachments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_reactions" ON message_reactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_reads" ON message_reads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_attachments" ON attachments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
