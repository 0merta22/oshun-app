-- ============================================================
-- Oshun Schema Patch
-- Run in Supabase SQL Editor (project: mtamhsyzbnxuuapuallv)
-- Adds missing columns that the controllers expect
-- ============================================================

-- ── community_posts: missing columns ─────────────────────────
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS is_deleted    BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_tags  JSONB     DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS media_types   TEXT[]    DEFAULT '{}';

-- ── community_comments: missing columns ──────────────────────
ALTER TABLE community_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES community_comments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_deleted        BOOLEAN NOT NULL DEFAULT false;

-- ── community_hashtags: RPC using 'name' column ──────────────
CREATE OR REPLACE FUNCTION increment_hashtag_count(tag_name TEXT)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO community_hashtags (name, post_count)
  VALUES (tag_name, 1)
  ON CONFLICT (name) DO UPDATE SET post_count = community_hashtags.post_count + 1;
$$;

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON community_posts (is_deleted);
CREATE INDEX IF NOT EXISTS idx_posts_created    ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent  ON community_comments (parent_comment_id);
