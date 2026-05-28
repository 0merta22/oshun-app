-- ============================================================
--  OSHUN-DESK — Row Level Security Policies
--  Run this in your oshun-desk Supabase project SQL Editor
--  Project: dsckujrgatmbntyzgbhz
--
--  Security model:
--  - Most data is isolated by team_id
--  - A user can access rows where they are a member of that team
--  - Team owners have full control over their team
-- ============================================================


-- ── TEAMS ────────────────────────────────────────────────────
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can create a team
CREATE POLICY "Teams: authenticated insert"
  ON public.teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Only team members can see their team
CREATE POLICY "Teams: members can read"
  ON public.teams FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- Only the owner can update or delete the team
CREATE POLICY "Teams: owner update"
  ON public.teams FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Teams: owner delete"
  ON public.teams FOR DELETE
  USING (owner_id = auth.uid());


-- ── TEAM MEMBERS ─────────────────────────────────────────────
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team members can see other members of the same team
CREATE POLICY "Team members: read same team"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Only team owner can add members
CREATE POLICY "Team members: owner insert"
  ON public.team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );

-- Team owner can update member roles; members can update themselves
CREATE POLICY "Team members: owner or self update"
  ON public.team_members FOR UPDATE
  USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );

-- Only team owner can remove members
CREATE POLICY "Team members: owner delete"
  ON public.team_members FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );


-- ── PROFILES ─────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Team members can see each other's profiles
CREATE POLICY "Profiles: team members read"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Users can only insert and update their own profile
CREATE POLICY "Profiles: own insert"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles: own update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());


-- ── CLIENTS ──────────────────────────────────────────────────
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- All team members can read clients belonging to their team
CREATE POLICY "Clients: team read"
  ON public.clients FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can add clients to their team
CREATE POLICY "Clients: team insert"
  ON public.clients FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can update clients in their team
CREATE POLICY "Clients: team update"
  ON public.clients FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Only team owner can delete clients
CREATE POLICY "Clients: owner delete"
  ON public.clients FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );


-- ── APPOINTMENTS ─────────────────────────────────────────────
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- All team members can read appointments for their team
CREATE POLICY "Appointments: team read"
  ON public.appointments FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can create appointments
CREATE POLICY "Appointments: team insert"
  ON public.appointments FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can update appointments
CREATE POLICY "Appointments: team update"
  ON public.appointments FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Only team owner can delete appointments
CREATE POLICY "Appointments: owner delete"
  ON public.appointments FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );


-- ── INVENTORY ────────────────────────────────────────────────
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- All team members can read inventory for their team
CREATE POLICY "Inventory: team read"
  ON public.inventory FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can add inventory items
CREATE POLICY "Inventory: team insert"
  ON public.inventory FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can update inventory
CREATE POLICY "Inventory: team update"
  ON public.inventory FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Only team owner can delete inventory items
CREATE POLICY "Inventory: owner delete"
  ON public.inventory FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );


-- ── SERVICES ─────────────────────────────────────────────────
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Services are public — anyone needs to see them for the booking page
CREATE POLICY "Services: public read"
  ON public.services FOR SELECT
  USING (true);

-- Team members can manage their services
CREATE POLICY "Services: team insert"
  ON public.services FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Services: team update"
  ON public.services FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Services: owner delete"
  ON public.services FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE owner_id = auth.uid()
    )
  );


-- ── BOOKING REQUESTS ─────────────────────────────────────────
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a booking request (public-facing booking page)
CREATE POLICY "Booking requests: public insert"
  ON public.booking_requests FOR INSERT
  WITH CHECK (true);

-- Only the provider (stylist) can read their booking requests
CREATE POLICY "Booking requests: provider read"
  ON public.booking_requests FOR SELECT
  USING (provider_id = auth.uid());

-- Only the provider can update (accept/decline) their requests
CREATE POLICY "Booking requests: provider update"
  ON public.booking_requests FOR UPDATE
  USING (provider_id = auth.uid());

-- Only the provider can delete requests
CREATE POLICY "Booking requests: provider delete"
  ON public.booking_requests FOR DELETE
  USING (provider_id = auth.uid());


-- ============================================================
--  Done! All oshun-desk tables are now protected.
--
--  Security summary:
--  - teams/team_members: team owner controls membership
--  - clients/appointments/inventory: all team members can read+write,
--    only owner can delete
--  - services: public read (for booking page), team manages
--  - booking_requests: anyone can book, only provider sees them
--  - profiles: own profile + same team members visible
-- ============================================================
