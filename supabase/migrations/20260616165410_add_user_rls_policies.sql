
-- Add user-level RLS policies using Supabase auth.uid()

-- USERS: anyone authenticated can read users, only own row for write
CREATE POLICY "users_select_authenticated" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);

-- GROUPS: members can read, admins can update
CREATE POLICY "groups_select_member" ON groups FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id::text = auth.uid()::text));
CREATE POLICY "groups_insert_authenticated" ON groups FOR INSERT TO authenticated WITH CHECK (owner_id::text = auth.uid()::text);
CREATE POLICY "groups_update_admin" ON groups FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id::text = auth.uid()::text AND is_admin = true));

-- GROUP_MEMBERS
CREATE POLICY "gm_select" ON group_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM group_members gm2 WHERE gm2.group_id = group_members.group_id AND gm2.user_id::text = auth.uid()::text));
CREATE POLICY "gm_insert" ON group_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gm_delete" ON group_members FOR DELETE TO authenticated USING (user_id::text = auth.uid()::text);

-- CONVERSATIONS: participants can read
CREATE POLICY "conv_select" ON conversations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id::text = auth.uid()::text));
CREATE POLICY "conv_insert" ON conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "conv_update" ON conversations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id::text = auth.uid()::text));

-- CONVERSATION_PARTICIPANTS
CREATE POLICY "cp_select" ON conversation_participants FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversation_participants cp2 WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id::text = auth.uid()::text));
CREATE POLICY "cp_insert" ON conversation_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cp_update" ON conversation_participants FOR UPDATE TO authenticated USING (user_id::text = auth.uid()::text);
CREATE POLICY "cp_delete" ON conversation_participants FOR DELETE TO authenticated USING (user_id::text = auth.uid()::text);

-- MESSAGES
CREATE POLICY "msg_select" ON messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id::text = auth.uid()::text));
CREATE POLICY "msg_insert" ON messages FOR INSERT TO authenticated WITH CHECK (sender_id::text = auth.uid()::text);
CREATE POLICY "msg_update" ON messages FOR UPDATE TO authenticated USING (sender_id::text = auth.uid()::text);

-- MESSAGE_ATTACHMENTS
CREATE POLICY "ma_select" ON message_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "ma_insert" ON message_attachments FOR INSERT TO authenticated WITH CHECK (true);

-- MESSAGE_REACTIONS
CREATE POLICY "mr_select" ON message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mr_insert" ON message_reactions FOR INSERT TO authenticated WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "mr_delete" ON message_reactions FOR DELETE TO authenticated USING (user_id::text = auth.uid()::text);

-- MESSAGE_READS
CREATE POLICY "reads_select" ON message_reads FOR SELECT TO authenticated USING (true);
CREATE POLICY "reads_insert" ON message_reads FOR INSERT TO authenticated WITH CHECK (user_id::text = auth.uid()::text);

-- ATTACHMENTS
CREATE POLICY "att_select" ON attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "att_insert" ON attachments FOR INSERT TO authenticated WITH CHECK (owner_id::text = auth.uid()::text);

-- NOTIFICATIONS
CREATE POLICY "notif_select" ON notifications FOR SELECT TO authenticated USING (recipient_id::text = auth.uid()::text);
CREATE POLICY "notif_update" ON notifications FOR UPDATE TO authenticated USING (recipient_id::text = auth.uid()::text);
CREATE POLICY "notif_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
