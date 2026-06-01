-- ============================================================
-- Oshun Community RPCs
-- Run in Supabase SQL Editor (project: mtamhsyzbnxuuapuallv)
-- Required for community likes, comments, saves, and hashtags
-- ============================================================

-- Likes
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = post_id;
$$;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
$$;

-- Comments
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = post_id;
$$;

-- Saves
CREATE OR REPLACE FUNCTION increment_post_saves(post_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE community_posts SET saves_count = saves_count + 1 WHERE id = post_id;
$$;

-- Hashtags
CREATE OR REPLACE FUNCTION increment_hashtag_count(tag_name TEXT)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO community_hashtags (name, post_count)
  VALUES (tag_name, 1)
  ON CONFLICT (name) DO UPDATE SET post_count = community_hashtags.post_count + 1;
$$;
