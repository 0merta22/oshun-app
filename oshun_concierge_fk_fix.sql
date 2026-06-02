-- Fix concierge_conversations FK — point to custom users table, not auth.users
ALTER TABLE concierge_conversations
  DROP CONSTRAINT IF EXISTS concierge_conversations_user_id_fkey;

ALTER TABLE concierge_conversations
  ADD CONSTRAINT concierge_conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
