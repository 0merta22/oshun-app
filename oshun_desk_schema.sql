-- ============================================================
--  OSHUN-DESK TABLES — Add to oshun-app Supabase project
--  Run in: mtamhsyzbnxuuapuallv (oshun-app project)
--
--  Note: oshun-desk's "services" table is renamed to
--  "desk_services" to avoid conflict with oshun-app's
--  marketplace services table.
-- ============================================================


-- ── TEAMS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID,
  name       TEXT NOT NULL DEFAULT 'My Team',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEAM MEMBERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id      UUID,
  role         TEXT NOT NULL DEFAULT 'member',
  status       TEXT NOT NULL DEFAULT 'pending',
  invite_email TEXT,
  invite_token UUID DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROFILES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY,
  username      TEXT,
  business_name TEXT,
  team_id       UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── CLIENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID DEFAULT gen_random_uuid(),
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  full_name   TEXT,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  service     TEXT,
  hair_notes  TEXT,
  notes       TEXT,
  visit_count INTEGER,
  total_spend NUMERIC,
  status      TEXT,
  last_visit  DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── APPOINTMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  service     TEXT,
  date        DATE,
  time        TIME,
  price       NUMERIC DEFAULT 0,
  notes       TEXT,
  status      TEXT DEFAULT 'upcoming',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── INVENTORY ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  team_id             UUID REFERENCES teams(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  category            TEXT,
  quantity            INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  cost                NUMERIC DEFAULT 0,
  supplier            TEXT,
  barcode             TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── DESK SERVICES ─────────────────────────────────────────────
-- Renamed from "services" to avoid conflict with oshun-app's
-- marketplace services table.
CREATE TABLE IF NOT EXISTS desk_services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL,
  team_id          UUID REFERENCES teams(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  price            NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  description      TEXT,
  payment_type     TEXT DEFAULT 'none',
  deposit_amount   NUMERIC DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOOKING REQUESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      UUID,
  client_name      TEXT NOT NULL,
  client_phone     TEXT,
  client_email     TEXT,
  service_name     TEXT,
  preferred_date   DATE,
  preferred_time   TEXT,
  notes            TEXT,
  status           TEXT DEFAULT 'pending',
  payment_status   TEXT DEFAULT 'unpaid',
  stripe_session_id TEXT,
  amount_paid      NUMERIC DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_team_members_team    ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user    ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_team         ON clients(team_id);
CREATE INDEX IF NOT EXISTS idx_appointments_team    ON appointments(team_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date    ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_inventory_team       ON inventory(team_id);
CREATE INDEX IF NOT EXISTS idx_desk_services_team   ON desk_services(team_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_provider ON booking_requests(provider_id);


-- ── RLS POLICIES ─────────────────────────────────────────────

-- TEAMS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams: authenticated insert"
  ON public.teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Teams: members can read"
  ON public.teams FOR SELECT
  USING (
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Teams: owner update"
  ON public.teams FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Teams: owner delete"
  ON public.teams FOR DELETE
  USING (owner_id = auth.uid());


-- TEAM MEMBERS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members: read same team"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Team members: owner insert"
  ON public.team_members FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
  );

CREATE POLICY "Team members: owner or self update"
  ON public.team_members FOR UPDATE
  USING (
    user_id = auth.uid()
    OR team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
  );

CREATE POLICY "Team members: owner delete"
  ON public.team_members FOR DELETE
  USING (
    team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
  );


-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: team members read"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Profiles: own insert"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles: own update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());


-- CLIENTS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients: team read"
  ON public.clients FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Clients: team insert"
  ON public.clients FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Clients: team update"
  ON public.clients FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Clients: owner delete"
  ON public.clients FOR DELETE
  USING (team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()));


-- APPOINTMENTS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointments: team read"
  ON public.appointments FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Appointments: team insert"
  ON public.appointments FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Appointments: team update"
  ON public.appointments FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Appointments: owner delete"
  ON public.appointments FOR DELETE
  USING (team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()));


-- INVENTORY
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory: team read"
  ON public.inventory FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Inventory: team insert"
  ON public.inventory FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Inventory: team update"
  ON public.inventory FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Inventory: owner delete"
  ON public.inventory FOR DELETE
  USING (team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()));


-- DESK SERVICES
ALTER TABLE public.desk_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Desk services: public read"
  ON public.desk_services FOR SELECT
  USING (true);

CREATE POLICY "Desk services: team insert"
  ON public.desk_services FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Desk services: team update"
  ON public.desk_services FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Desk services: owner delete"
  ON public.desk_services FOR DELETE
  USING (team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()));


-- BOOKING REQUESTS
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking requests: public insert"
  ON public.booking_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Booking requests: provider read"
  ON public.booking_requests FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "Booking requests: provider update"
  ON public.booking_requests FOR UPDATE
  USING (provider_id = auth.uid());

CREATE POLICY "Booking requests: provider delete"
  ON public.booking_requests FOR DELETE
  USING (provider_id = auth.uid());


-- ============================================================
--  Done! All oshun-desk tables are now in the oshun-app project.
--  Next: update oshun-desk .env.local to point to this project.
-- ============================================================
