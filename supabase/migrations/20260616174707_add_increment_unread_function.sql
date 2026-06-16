
-- Function to increment unread count for all participants except sender
CREATE OR REPLACE FUNCTION increment_unread_except(
  p_conversation_id UUID,
  p_user_id UUID
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = p_conversation_id
    AND user_id != p_user_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION increment_unread_except(UUID, UUID) TO authenticated;
