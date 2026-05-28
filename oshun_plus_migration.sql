-- ============================================================
-- Oshun+ Subscription Migration
-- Run in Supabase SQL Editor (project: mtamhsyzbnxuuapuallv)
-- Plan 04 — Oshun+ $9.99/mo recurring subscription
-- ============================================================

-- Add stripe_customer_id to users table (if not already present)
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ── SUBSCRIPTION RECORDS ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT        UNIQUE,
  status                  TEXT        NOT NULL DEFAULT 'inactive'
                            CHECK (status IN ('trialing','active','past_due','cancelled','inactive')),
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  trial_end               TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── FOUNDATION DONATION LEDGER ────────────────────────────────

CREATE TABLE IF NOT EXISTS foundation_donation_ledger (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month          DATE          NOT NULL,   -- e.g. 2026-06-01 (first of month)
  active_subscribers    INT           NOT NULL,
  total_donation_amount DECIMAL(10,2) NOT NULL,
  status                TEXT          NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','transferred','recorded')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE user_subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation_donation_ledger ENABLE ROW LEVEL SECURITY;

-- user_subscriptions: owner read, service role writes
CREATE POLICY "sub_owner_read"     ON user_subscriptions FOR SELECT
  USING (auth.uid()::text = user_id::text);
CREATE POLICY "sub_service_insert" ON user_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "sub_service_update" ON user_subscriptions FOR UPDATE USING (true);

-- foundation_donation_ledger: admin read only, service role writes
CREATE POLICY "fdl_service_insert" ON foundation_donation_ledger FOR INSERT WITH CHECK (true);
CREATE POLICY "fdl_service_update" ON foundation_donation_ledger FOR UPDATE USING (true);
CREATE POLICY "fdl_admin_read"     ON foundation_donation_ledger FOR SELECT USING (true);

-- ── INDEXES ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_subs_user   ON user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_status ON user_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_fdl_period       ON foundation_donation_ledger (period_month DESC);
