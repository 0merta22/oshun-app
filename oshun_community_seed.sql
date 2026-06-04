-- ============================================================
-- Oshun Community Feed — Seed Content
-- Run in Supabase SQL Editor (project: mtamhsyzbnxuuapuallv)
-- ============================================================

-- Creates/updates the Oshun brand account and seeds curated posts.
-- Uses a CTE so the user ID is always correct regardless of what's
-- already in the table.

WITH oshun_user AS (
  INSERT INTO users (email, password_hash, name, type)
  VALUES (
    'hello@oshunbeauty.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Oshun',
    'consumer'
  )
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO community_posts (user_id, post_type, caption, category, hashtags, is_deleted)
SELECT u.id, v.post_type, v.caption, v.category, v.hashtags, false
FROM oshun_user u
CROSS JOIN (VALUES
  (
    'inspiration',
    'Welcome to the Oshun Community — a space built for us, by us. ✦ Share your looks, book your appointments, and support Black-owned beauty. This is the Wave.',
    'hair',
    ARRAY['oshun','blackbeauty','naturalhair','dreamdeep','thewave']
  ),
  (
    'tutorial',
    'Protective style season is here. 🌀 Box braids, locs, twists — your crown, your rules. Browse our local beauty shops for install appointments or grab your supplies delivered in 20 minutes.',
    'hair',
    ARRAY['protectivestyles','boxbraids','naturalhair','blackhair','haircare']
  ),
  (
    'look',
    'Melanin-rich skin deserves melanin-first formulas. ✨ No white cast. No ashy finish. Just glow. Tap Shop to find SPF, serums, and moisturizers made for deeper skin tones.',
    'skin',
    ARRAY['skincare','melanin','blackskincare','glowingskin','spf']
  ),
  (
    'inspiration',
    'Nails are non-negotiable. 💅🏾 Whether you''re a gel girl or an acrylic queen — book your nail tech directly through Oshun Services. Polished By Design is taking appointments now.',
    'nails',
    ARRAY['nails','nailart','blackgirlnails','gelmanicure','nailinspo']
  ),
  (
    'inspiration',
    'Your wellness routine is your ritual. 🌿 From scalp oils to facial treatments — everything you need to take care of yourself is right here on Oshun. You deserve this.',
    'wellness',
    ARRAY['wellness','selfcare','blackwellness','holistichealth','skinroutine']
  )
) AS v(post_type, caption, category, hashtags);
