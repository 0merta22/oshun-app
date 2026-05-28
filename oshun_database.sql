-- ============================================================
--  OSHUN DATABASE — All Tables
--  Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================


-- ── 1. USERS ─────────────────────────────────────────────────
-- Stores every account: consumers, business owners, brands, drivers

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('consumer', 'business', 'brand', 'driver')),
  phone         TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ── 2. BUSINESSES ────────────────────────────────────────────
-- Business owner profiles — salons, barbershops, boutiques, etc.

CREATE TABLE IF NOT EXISTS businesses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  tagline     TEXT,
  category    TEXT NOT NULL,  -- 'Hair Care', 'Barber & Grooming', 'Clothing & Apparel', etc.
  location    TEXT,
  description TEXT,
  image_url   TEXT,
  initials    TEXT,           -- fallback display e.g. "GG" for "Glam & Glow"
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 3. PRODUCTS ──────────────────────────────────────────────
-- Products sold by businesses OR brand partners

CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  brand_id    UUID,           -- set when product belongs to a brand partner
  name        TEXT NOT NULL,
  description TEXT,
  price       DECIMAL(10, 2) NOT NULL,
  category    TEXT NOT NULL CHECK (
    category IN ('hair', 'skincare', 'makeup', 'nails', 'barber', 'clothing', 'fragrance', 'tools')
  ),
  image_url   TEXT,
  stock_qty   INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 4. SERVICES ──────────────────────────────────────────────
-- Bookable services: hair, nails, skin, barber, etc.

CREATE TABLE IF NOT EXISTS services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,        -- e.g. "Fade & Line-Up"
  description      TEXT,
  category         TEXT NOT NULL CHECK (
    category IN ('hair', 'skincare', 'makeup', 'nails', 'barber')
  ),
  price            DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  provider         TEXT,                 -- business name for display
  image_url        TEXT,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ── 5. ORDERS ────────────────────────────────────────────────
-- Every order placed on the platform

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  business_id      UUID REFERENCES businesses(id) ON DELETE SET NULL,
  brand_id         UUID,                 -- set for brand partner orders
  driver_id        UUID,                 -- set when driver is assigned
  items            TEXT,                 -- human-readable: "Edge Control ×2, Lip Gloss ×1"
  items_json       JSONB,                -- full detail: [{product_id, name, qty, price}]
  total            DECIMAL(10, 2) NOT NULL,
  status           TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'fulfilled')
  ),
  payment_status   TEXT DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'refunded')
  ),
  delivery_address TEXT,
  stripe_payment_id TEXT,               -- Stripe PaymentIntent ID
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ── 6. DRIVERS ───────────────────────────────────────────────
-- Driver profiles linked to user accounts

CREATE TABLE IF NOT EXISTS drivers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  vehicle_type      TEXT,               -- e.g. "Car", "Bike", "Scooter"
  license_plate     TEXT,
  is_available      BOOLEAN DEFAULT TRUE,
  current_location  TEXT,
  rating            DECIMAL(3, 2) DEFAULT 5.0,
  total_deliveries  INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ── 7. BRAND PARTNERS ────────────────────────────────────────
-- Brand partner profiles — companies placing products in hubs

CREATE TABLE IF NOT EXISTS brand_partners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  logo_url    TEXT,
  website     TEXT,
  category    TEXT,                     -- product category focus
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 8. HUB PLACEMENT REQUESTS ────────────────────────────────
-- Brand submits a request to stock products at a hub location

CREATE TABLE IF NOT EXISTS hub_placement_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    UUID REFERENCES brand_partners(id) ON DELETE CASCADE,
  city        TEXT NOT NULL,            -- e.g. "Washington, DC"
  hub_name    TEXT NOT NULL,            -- e.g. "Crown & Glory Beauty"
  products    JSONB,                    -- [{name, qty}] products to place
  notes       TEXT,
  status      TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 9. HUB PLACEMENTS ────────────────────────────────────────
-- Approved placements — brand products actively stocked at a hub

CREATE TABLE IF NOT EXISTS hub_placements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID REFERENCES hub_placement_requests(id) ON DELETE SET NULL,
  brand_id    UUID REFERENCES brand_partners(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  city        TEXT NOT NULL,
  hub_name    TEXT NOT NULL,
  products    JSONB,                    -- final list of placed products
  start_date  DATE DEFAULT CURRENT_DATE,
  end_date    DATE,                     -- null = ongoing
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 10. NOTIFICATIONS ────────────────────────────────────────
-- In-app notifications for all user types

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,            -- 'order_update', 'hub_request', 'new_order', etc.
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  data       JSONB,                    -- extra context e.g. { order_id: "..." }
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
--  INDEXES — speeds up common queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_business    ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_user          ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_business      ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_hub_requests_brand   ON hub_placement_requests(brand_id);
CREATE INDEX IF NOT EXISTS idx_hub_requests_status  ON hub_placement_requests(status);


-- ============================================================
--  SAMPLE DATA — optional, adds test records so you can
--  immediately test your API routes in Postman
-- ============================================================

-- Sample business
INSERT INTO businesses (name, tagline, category, location, description, initials)
VALUES
  ('Glam & Glow Studio',  'Your glow, elevated',           'Hair Care',          'Columbia Heights, DC', 'Full-service hair salon',         'GG'),
  ('Luxe Skin Studio',    'Science-backed skincare',        'Skin Care',          'Logan Circle, DC',     'Medical-grade skin treatments',   'LS'),
  ('Bombshell Beauty',    'Bold looks, unapologetic',       'Makeup',             'U Street, DC',         'Makeup artistry and studio',      'BB'),
  ('Polished By Design',  'Nails as art',                   'Nails',              'Shaw, DC',             'Luxury nail studio',              'PD'),
  ('Kings Cut Barbershop','Precision cuts for kings',       'Barber & Grooming',  'Shaw, DC',             'Premier barbershop for men',      'KC')
ON CONFLICT DO NOTHING;

-- Sample products
INSERT INTO products (name, description, price, category, stock_qty)
VALUES
  ('Edge Control Gel',      'Strong hold, no flakes',        12.99, 'hair',      50),
  ('Vitamin C Serum',       'Brightening daily serum',       34.99, 'skincare',  30),
  ('Matte Lip Kit',         'Long-wear lip color + liner',   18.99, 'makeup',    40),
  ('Cuticle Oil Pen',       'Nourishing nail treatment',      9.99, 'nails',     60),
  ('Beard Balm',            'Shape and condition your beard',14.99, 'barber',    35),
  ('Linen Bomber Jacket',   'Premium linen, relaxed fit',    89.99, 'clothing',  15),
  ('Shea Butter Moisturizer','Whipped body butter',          22.99, 'skincare',  45),
  ('Scalp Serum',           'Stimulates growth, reduces buildup', 29.99, 'hair', 25)
ON CONFLICT DO NOTHING;


-- ============================================================
--  Done! All 10 tables created.
--  Go to Supabase → Table Editor to verify they all appear.
-- ============================================================
