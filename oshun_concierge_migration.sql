-- ============================================================
--  Oshun AI Beauty Concierge — Database Migration
--  Run in Supabase SQL Editor
--  Tables: concierge_conversations, concierge_messages, concierge_conversions
-- ============================================================

-- ── Conversation sessions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS concierge_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- ── Individual messages ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS concierge_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES concierge_conversations(id) ON DELETE CASCADE,
  role            TEXT CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Conversion tracking ──────────────────────────────────────
-- Tracks when a Concierge conversation leads to a purchase or booking
CREATE TABLE IF NOT EXISTS concierge_conversions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID REFERENCES concierge_conversations(id) ON DELETE SET NULL,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  conversion_type  TEXT CHECK (conversion_type IN (
                     'add_to_cart',
                     'booking_initiated',
                     'subscription_started',
                     'foundation_enrolled'
                   )),
  reference_id     UUID,   -- product_id, business_id, etc.
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_concierge_conversations_user
  ON concierge_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_concierge_messages_conversation
  ON concierge_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_concierge_conversions_user
  ON concierge_conversions(user_id);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE concierge_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_conversions ENABLE ROW LEVEL SECURITY;

-- Service role handles all operations (backend uses service key, bypasses RLS)
DROP POLICY IF EXISTS "Users own their conversations" ON concierge_conversations;
CREATE POLICY "service_all_conversations" ON concierge_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own messages" ON concierge_messages;
CREATE POLICY "service_all_messages" ON concierge_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own conversions" ON concierge_conversions;
CREATE POLICY "service_all_conversions" ON concierge_conversions FOR ALL USING (true) WITH CHECK (true);
