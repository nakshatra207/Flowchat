
-- Fix RLS infinite recursion: group_members and conversation_participants
-- policies that query their own table cause infinite recursion.
-- Use security definer functions instead.

-- Drop the recursive policies
DROP POLICY IF EXISTS "gm_select" ON group_members;
DROP POLICY IF EXISTS "cp_select" ON conversation_participants;

-- Simple flat policies that don't self-reference
CREATE POLICY "gm_select" ON group_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "cp_select" ON conversation_participants FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Also fix groups_select_member to avoid recursive lookup
DROP POLICY IF EXISTS "groups_select_member" ON groups;
CREATE POLICY "groups_select_member" ON groups FOR SELECT TO authenticated
  USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Fix conv_select to avoid recursive lookup
DROP POLICY IF EXISTS "conv_select" ON conversations;
CREATE POLICY "conv_select" ON conversations FOR SELECT TO authenticated
  USING (
    id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

-- Fix conv_update
DROP POLICY IF EXISTS "conv_update" ON conversations;
CREATE POLICY "conv_update" ON conversations FOR UPDATE TO authenticated
  USING (
    id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

-- Fix msg_select
DROP POLICY IF EXISTS "msg_select" ON messages;
CREATE POLICY "msg_select" ON messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

-- Enable REPLICA IDENTITY FULL for real-time message payloads
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE conversation_participants REPLICA IDENTITY FULL;

-- Add messages publication for real-time
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
