-- ============================================================
-- Oshun Features Migration
-- Run this in Supabase SQL Editor (project: mtamhsyzbnxuuapuallv)
-- Covers: Plan 01 — Community Feed + Plan 02 — Creator Program
-- ============================================================

-- ── PLAN 01: COMMUNITY FEED ───────────────────────────────────

CREATE TABLE IF NOT EXISTS community_posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type       TEXT        NOT NULL CHECK (post_type IN ('look','tutorial','review','inspiration','announcement')),
  caption         TEXT,
  media_urls      TEXT[]      DEFAULT '{}',
  category        TEXT,
  product_tags    JSONB       DEFAULT '[]',
  hashtags        TEXT[]      DEFAULT '{}',
  likes_count     INT         NOT NULL DEFAULT 0,
  comments_count  INT         NOT NULL DEFAULT 0,
  saves_count     INT         NOT NULL DEFAULT 0,
  is_featured     BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_likes (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id  UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_saves (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id  UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_follows (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS community_hashtags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tag        TEXT        NOT NULL UNIQUE,
  post_count INT         NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Community Feed
ALTER TABLE community_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_saves     ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_follows   ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_hashtags  ENABLE ROW LEVEL SECURITY;

-- Posts: public read, owner insert/delete, service role update (for counts)
CREATE POLICY "posts_public_read"    ON community_posts FOR SELECT USING (true);
CREATE POLICY "posts_owner_insert"   ON community_posts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "posts_owner_delete"   ON community_posts FOR DELETE USING (auth.uid()::text = user_id::text);
CREATE POLICY "posts_service_update" ON community_posts FOR UPDATE USING (true);

-- Likes/Saves: public read, owner write
CREATE POLICY "likes_public_read"   ON community_likes FOR SELECT USING (true);
CREATE POLICY "likes_owner_insert"  ON community_likes FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "likes_owner_delete"  ON community_likes FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "saves_public_read"   ON community_saves FOR SELECT USING (true);
CREATE POLICY "saves_owner_insert"  ON community_saves FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "saves_owner_delete"  ON community_saves FOR DELETE USING (auth.uid()::text = user_id::text);

-- Comments: public read, owner delete
CREATE POLICY "comments_public_read"   ON community_comments FOR SELECT USING (true);
CREATE POLICY "comments_owner_insert"  ON community_comments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "comments_owner_delete"  ON community_comments FOR DELETE USING (auth.uid()::text = user_id::text);

-- Follows: public read, owner write
CREATE POLICY "follows_public_read"  ON community_follows FOR SELECT USING (true);
CREATE POLICY "follows_owner_insert" ON community_follows FOR INSERT WITH CHECK (auth.uid()::text = follower_id::text);
CREATE POLICY "follows_owner_delete" ON community_follows FOR DELETE USING (auth.uid()::text = follower_id::text);

-- Hashtags: public read, service write
CREATE POLICY "hashtags_public_read"    ON community_hashtags FOR SELECT USING (true);
CREATE POLICY "hashtags_service_insert" ON community_hashtags FOR INSERT WITH CHECK (true);
CREATE POLICY "hashtags_service_update" ON community_hashtags FOR UPDATE USING (true);
CREATE POLICY "hashtags_service_delete" ON community_hashtags FOR DELETE USING (true);


-- ── PLAN 02: CREATOR PARTNER PROGRAM ─────────────────────────

CREATE TABLE IF NOT EXISTS creator_profiles (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tier                    TEXT        NOT NULL DEFAULT 'spark'
                            CHECK (tier IN ('spark','glow','radiance','luminary')),
  current_credits_balance INT         NOT NULL DEFAULT 0,
  total_credits_earned    INT         NOT NULL DEFAULT 0,
  affiliate_code          TEXT        UNIQUE,
  affiliate_link          TEXT,
  application_status      TEXT        NOT NULL DEFAULT 'approved'
                            CHECK (application_status IN ('pending','approved','rejected')),
  approved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT        NOT NULL CHECK (transaction_type IN (
    'referral_signup','referral_purchase','post_created','post_milestone_50_likes',
    'comment_posted','admin_award',
    'redemption_delivery','redemption_discount','redemption_box','redemption_cash'
  )),
  credits_amount   INT         NOT NULL, -- positive = earned, negative = spent
  reference_id     TEXT,
  reference_type   TEXT,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_redemptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redemption_type     TEXT        NOT NULL,
  credits_spent       INT         NOT NULL,
  applied_to_order_id TEXT,
  status              TEXT        NOT NULL DEFAULT 'applied'
                        CHECK (status IN ('applied','pending','expired')),
  value_received      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_referrals (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id         UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  affiliate_code           TEXT        NOT NULL,
  purchase_credits_awarded BOOLEAN     NOT NULL DEFAULT false,
  first_purchase_at        TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Creator Program
-- Note: backend uses service_role key which bypasses RLS automatically.
-- These policies govern direct client access only.
ALTER TABLE creator_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_referrals   ENABLE ROW LEVEL SECURITY;

-- creator_profiles: public read (leaderboard), service role writes
CREATE POLICY "creator_profile_public_read"   ON creator_profiles FOR SELECT USING (true);
CREATE POLICY "creator_profile_service_insert" ON creator_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "creator_profile_service_update" ON creator_profiles FOR UPDATE USING (true);
CREATE POLICY "creator_profile_service_delete" ON creator_profiles FOR DELETE USING (true);

-- credit_transactions: owner read, service role insert
CREATE POLICY "credit_tx_owner_read"     ON credit_transactions FOR SELECT
  USING (auth.uid()::text = user_id::text);
CREATE POLICY "credit_tx_service_insert" ON credit_transactions FOR INSERT WITH CHECK (true);

-- credit_redemptions: owner read, service role insert
CREATE POLICY "redemption_owner_read"     ON credit_redemptions FOR SELECT
  USING (auth.uid()::text = user_id::text);
CREATE POLICY "redemption_service_insert" ON credit_redemptions FOR INSERT WITH CHECK (true);

-- creator_referrals: creator read, service role write
CREATE POLICY "referral_creator_read"     ON creator_referrals FOR SELECT
  USING (auth.uid()::text = creator_id::text);
CREATE POLICY "referral_service_insert"   ON creator_referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "referral_service_update"   ON creator_referrals FOR UPDATE USING (true);


-- ── RPC FUNCTIONS ─────────────────────────────────────────────

-- Atomically increment creator credits (used by awardCredits)
CREATE OR REPLACE FUNCTION increment_creator_credits(p_user_id UUID, p_amount INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO creator_profiles (user_id, current_credits_balance, total_credits_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    current_credits_balance = creator_profiles.current_credits_balance + p_amount,
    total_credits_earned    = creator_profiles.total_credits_earned    + p_amount,
    updated_at              = now();
END;
$$;

-- Atomically decrement creator credits (used by redeemCredits)
CREATE OR REPLACE FUNCTION decrement_creator_credits(p_user_id UUID, p_amount INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE creator_profiles
  SET current_credits_balance = current_credits_balance - p_amount,
      updated_at              = now()
  WHERE user_id = p_user_id;
END;
$$;


-- ── INDEXES ───────────────────────────────────────────────────

-- Community Feed indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user    ON community_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_cat     ON community_posts (category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_likes_post    ON community_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user    ON community_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_community_saves_user    ON community_saves (user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_fwer  ON community_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_fwing ON community_follows (following_id);

-- Creator Program indexes
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user  ON creator_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user         ON credit_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created      ON credit_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_referrals_code ON creator_referrals (affiliate_code);
CREATE INDEX IF NOT EXISTS idx_creator_referrals_ref  ON creator_referrals (referred_user_id);
