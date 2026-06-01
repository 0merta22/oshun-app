# OSHUN — MASTER CONTEXT FILE
**Project owner:** DeAundre Webb — Sparkles in HD LLC / Webb Mind Labs LLC  
**Last updated:** May 2026  
**Read this file at the start of every session.**

---

## QUICK START (NEW SESSION)

1. Read this file top to bottom before touching any code
2. The entire frontend lives in `src/App.jsx` — one file, ~8,000+ lines
3. Backend is in `oshun-backend/` — Express/Node on Railway
4. Ask DeAundre what we're working on today

---

## PART A — LIVE INFRASTRUCTURE

| Service | URL | Notes |
|---|---|---|
| Frontend (Vite/React) | `npm run dev` from `/oshun-app` | Deploy target: Vercel |
| Backend (Express/Node) | `https://oshun-backend-production.up.railway.app` | Deployed on Railway |
| Database | `https://mtamhsyzbnxuuapuallv.supabase.co` | Supabase Postgres + RLS |

### Frontend .env
```
VITE_SUPABASE_URL=https://mtamhsyzbnxuuapuallv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_BACKEND_URL=https://oshun-backend-production.up.railway.app
```

### Railway env vars (backend)
Set in Railway dashboard: `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `CLIENT_URL`, `PORT`

---

## PART B — TECH STACK

**Frontend:** React (Vite), single-file `src/App.jsx`, Framer Motion, Sonner toasts, Lucide icons  
**Backend:** Node/Express, `oshun-backend/` subfolder  
**Database:** Supabase (Postgres)  
**Payments:** Stripe Checkout Sessions (no frontend SDK needed)  
**Email:** Resend (not yet configured — no API key)  
**Deployment:** Railway (backend), Vercel (frontend)

---

## PART C — FILE STRUCTURE

```
oshun-app/
├── src/
│   ├── App.jsx          ← ENTIRE frontend in one file (~8000+ lines)
│   └── api.js           ← All API fetch functions
├── oshun-backend/
│   ├── server.js        ← Express entry, route mounts, Stripe webhook
│   └── src/
│       ├── config/db.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── orderController.js
│       │   ├── communityController.js
│       │   ├── creatorController.js
│       │   └── subscriptionController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── productRoutes.js
│       │   ├── orderRoutes.js
│       │   ├── communityRoutes.js
│       │   ├── creatorRoutes.js
│       │   └── subscriptionRoutes.js
│       └── middleware/
│           ├── auth.js                ← JWT: attaches req.user.userId
│           └── requiresOshunPlus.js   ← Attaches req.isOshunPlus flag
├── .env
├── oshun_features_migration.sql   ← Already run in Supabase
├── oshun_plus_migration.sql       ← ⚠️ NOT YET RUN — do this first
└── CLAUDE.md                      ← This file
```

---

## PART D — SUPABASE TABLES

### Already migrated (oshun_features_migration.sql ✅)
- `community_posts`, `community_likes`, `community_saves`, `community_comments`
- `community_follows`, `community_hashtags`
- `creator_profiles`, `credit_transactions`, `credit_redemptions`, `creator_referrals`
- RPC: `increment_creator_credits`, `decrement_creator_credits`

### PENDING — Run this next ⚠️
> **`oshun_plus_migration.sql` has NOT been run.**  
> Supabase SQL Editor → paste contents → Run.  
> Creates: `user_subscriptions`, `foundation_donation_ledger`  
> Also: `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`

---

## PART E — FEATURES BUILT

| Feature | Status |
|---|---|
| Auth (register/login/JWT) | ✅ Complete |
| Product marketplace | ✅ Complete |
| Business browsing | ✅ Complete |
| Services | ✅ Complete |
| Brand partners | ✅ Complete |
| Cart + checkout | ✅ Complete |
| Order tracking | ✅ Complete |
| Community feed | ✅ Complete |
| Business Hub (5 tabs incl. Community) | ✅ Complete |
| Business profile dropdown (Settings/Help/Sign Out) | ✅ Complete |
| Business Edit Profile modal w/ photo upload | ✅ Complete |
| Brand Hub | ✅ Complete |
| Driver Hub | ✅ Complete |
| Creator Partner Program | ✅ Complete |
| Oshun+ Subscription (Stripe) | ⚠️ Pending SQL migration |

---

## PART F — PENDING TASKS (Priority Order)

1. **Run `oshun_plus_migration.sql`** in Supabase SQL Editor — BLOCKS Oshun+ feature
2. **Delete duplicate Stripe webhook** — keep only `https://oshun-backend-production.up.railway.app/api/subscription/webhook`
3. **Confirm Vercel frontend deployment** — is the live URL working?
4. **Wire Resend API key** — order + auth emails not sending
5. **Supabase Storage** — wire real image uploads for business profile photos (currently frontend-only FileReader preview)
6. **Consumer Profile page** — view/edit name, address book, order history
7. **Driver dashboard improvements** — earnings, route history
8. **Feature Plan 03 (Oshun Circle)** — deferred; requires `oshun-desk` app in workspace

---

## PART G — STRIPE SETUP

- **Webhook URL:** `https://oshun-backend-production.up.railway.app/api/subscription/webhook`
- **Price ID:** `price_1TY4Q220BaVPJpiG2p7WLfwu` (Oshun+ $9.99/mo)
- Two webhooks exist in Stripe dashboard — delete the duplicate
- Signing secret → Railway env as `STRIPE_WEBHOOK_SECRET`
- Flow: `createCheckoutSession()` → Stripe hosted page → `?oshun_plus=success` → confirmation

---

## PART H — CRITICAL TECHNICAL RULES (DO NOT BREAK)

```
1. Single-file frontend — ALL components live in src/App.jsx as top-level functions.
   No subdirectories, no component files, no imports from ./components/

2. apiFetch helper — all API calls in api.js use apiFetch(), not axios

3. req.user.userId — JWT field in all controllers (NOT req.user.id)

4. require('../config/db') — Supabase import path in all controllers

5. Stripe webhook raw body — in server.js the webhook route MUST be registered
   BEFORE express.json() middleware:
   app.post('/api/subscription/webhook', express.raw({type:'application/json'}), handler)
   app.use(express.json())  // after webhook only

6. requiresOshunPlus middleware — attaches req.isOshunPlus flag, never blocks.
   Applied at route level, not globally.

7. T object — all colors/typography come from the T theme constant.
   Never hardcode colors outside of T.

8. Framer Motion patterns — motion.button with whileTap/whileHover,
   AnimatePresence with mode="wait" for page transitions.

9. Lucide imports — all icons in ONE import block at top of App.jsx.
   Never add a second import block — causes duplicate identifier parse errors.
```

---

## PART 1 — COMPANY OVERVIEW

**LLC:** Sparkles in HD LLC (operating entity)  
**Brand LLC:** Webb Mind Labs LLC (creative/consulting umbrella)  
**Founder:** DeAundre Webb  
**Location:** Virginia, USA  
**Structure:** Multi-Member LLC | EIN: Active | DUNS: Active  
**Industry:** Consulting & Professional Services / Technology / Beauty

DeAundre Webb is a former network engineer turned entrepreneur. His technical background informs Oshun's core operating principles: scalability, usability, functionality, purpose, and data-driven decision making. Oshun was born from a personal moment — watching his wife frustrated by having to stop everything to find hair products — and grew into a mission to serve a community that has been systematically underserved by the beauty industry.

---

## PART 2 — THE OSHUN BRAND

**Origin Story:** DeAundre's wife was flustered mid-day trying to find hair products. He thought: "There should be something for that." He waited a year expecting someone else to build it. They didn't. So he did.

**Mission:** To finally see what has gone unseen for far too long — and build the ecosystem Black beauty consumers have always deserved, with the unapologetic force of a movement that will not be ignored.

**Brand Promise:** "Why hasn't this been here all along?" Every design decision must protect this feeling. Oshun should feel inevitable.

**Official Tagline:** "Dream Deep." — Aquatic, ambitious, directive.

**Founder's Vision:** "I recognize what went unseen for far too long. The new wave is here — it's a vast Oshun out there." — DeAundre Webb

**Legacy:** "It was all a dream." Every person Oshun is built for has said these words. That's not a coincidence. That's the mission.

---

## PART 3 — BRAND VOICE

| Pillar | Definition |
|---|---|
| Home | Warm, familiar, safe. Customers already belong here. |
| Purposeful | Every feature exists for a reason. Function before aesthetics. |
| Ambitious | This is bigger than an app. Confidence of a movement, not a startup. |
| Grounded | No empty promises. Real impact language. |
| Inevitable | Oshun doesn't ask permission. It speaks like it was always supposed to exist. |

**Oshun DOES:** Speak directly and warmly. Center the community. Lead with impact. Sound confident, not corporate.

**Oshun DOES NOT:** Pander or perform. Use corporate jargon. Over-promise. Make the brand the hero (the community is the hero).

**Taglines for testing:**
- "Dream Deep." — Primary
- "We see you. We've always seen you." — Emotional, campaign use
- "The new wave is here." — Launch/movement moments
- "What took so long — starts now." — Ads, validates frustration

---

## PART 4 — VISUAL IDENTITY

### Color Palette

| Name | Hex | Role |
|---|---|---|
| Abyss | `#060F20` | Primary Background |
| Deep Navy | `#0B1C3A` | Surface |
| Tide | `#1A3A6B` | Elevated Surface |
| Current | `#2B7A8C` | Accent |
| Seafoam | `#4AABBF` | Highlight |
| Gold | `#C8A84B` | Primary Accent |
| Shoreline | `#F5E8C0` | Warm Cream |
| Sand | `#D4B896` | Secondary Text |

### Typography

| Role | Font | Weight |
|---|---|---|
| Display | Playfair Display | Regular / Italic |
| Body | Jost | Light (300) |
| Label | Jost | Medium (500) + Caps |

### Official Logo — The Wave Mark

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="oshunGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4AABBF"/>
      <stop offset="100%" stop-color="#C8A84B"/>
    </linearGradient>
    <linearGradient id="oshunGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C8A84B"/>
      <stop offset="100%" stop-color="#4AABBF"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="52" stroke="url(#oshunGrad1)" stroke-width="1.5" fill="none" opacity="0.35"/>
  <circle cx="60" cy="60" r="44" stroke="url(#oshunGrad1)" stroke-width="0.5" fill="none" opacity="0.15"/>
  <path d="M18 60 Q36 36 60 60 Q84 84 102 60"
        stroke="url(#oshunGrad1)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M18 70 Q36 46 60 70 Q84 94 102 70"
        stroke="url(#oshunGrad2)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5"/>
  <path d="M24 50 Q42 28 60 50 Q78 72 96 50"
        stroke="url(#oshunGrad1)" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.2"/>
</svg>
```

**Logo rules:** Dark backgrounds only (`#0B1C3A` or `#060F20`). Never stretch, rotate, or recolor outside the defined gradient. Min 32×32px (app icon), 80×80px (web).

### Motion Language

| Principle | Description | Use |
|---|---|---|
| The Flow | Elements enter like water — unhurried, inevitable | Page transitions, content reveals |
| The Tide | Loading states breathe in and out | Skeleton loaders, progress states |
| The Shimmer | Gold light catches across surfaces | Hover states, active elements, CTAs |

---

## PART 5 — THE ECOSYSTEM

```
OSHUN (Mother Brand)
├── Oshun Marketplace     — Core on-demand delivery app (THIS REPO)
├── Oshun Desk            — CRM for beauty businesses (separate repo)
├── Oshun Health          — Organic wellness vertical (planned)
└── Oshun Foundation      — Tech training nonprofit pipeline (planned)
```

The closed loop: customer orders through Oshun → shop manages via Oshun Desk → driver in Oshun network → Foundation grad built the feature. The money never has to leave.

**Market:** Black consumers contribute ~$9B annually to the beauty market. No viable on-demand solution exists specifically for this community at scale.

---

## PART 6 — BUSINESS & FINANCIAL CONTEXT

| Item | Value |
|---|---|
| Operating Entity | Sparkles in HD LLC |
| Credit Application | $100,000 business line in progress |
| Year 1 Projection | $112,800 |
| Year 2 Projection | $222,000 |
| Year 3 Projection | $402,000 |

**Active revenue:** AI automation consulting (lead follow-up via Make.com → GPT → Gmail)  
**Active platforms:** TikTok, Instagram, Etsy  
**Integrations:** Google Drive, Gmail, Stripe, Postman

---

## PART 7 — COMMANDS & WORKING VOCABULARY

| Command | Action |
|---|---|
| Refine [section] | Polish and improve a specific section |
| Add [feature] | Build a new product feature |
| Debug [behavior] | Troubleshoot unexpected behavior |
| Export this | Package current work as a file |
| Explain the code | Walk through what's happening line by line |
| Performance check | Audit for speed and efficiency |
| Responsive test | Check mobile/tablet layout |
| Theme it to [style] | Apply visual style to a component |
| Simplify this | Reduce complexity without losing function |
| Connect [service] | Integrate a third-party service |
| Show me the state flow | Map how data moves through the app |
| Who controls [X]? | Audit permissions and ownership |

---

## PART 8 — QUICK REFERENCE

| Item | Value |
|---|---|
| Brand | Oshun |
| Tagline | "Dream Deep." |
| Primary BG | `#060F20` (Abyss) |
| Card BG | `#0B1C3A` (Deep Navy) |
| Gold | `#C8A84B` |
| Teal | `#4AABBF` |
| Display font | Playfair Display |
| Body font | Jost |
| Founder | DeAundre Webb |
| Entity | Sparkles in HD LLC |
| Backend URL | `https://oshun-backend-production.up.railway.app` |
| Supabase URL | `https://mtamhsyzbnxuuapuallv.supabase.co` |

---

*Oshun v1 · Webb Mind Labs LLC · Confidential*
