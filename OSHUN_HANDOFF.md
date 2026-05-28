# Oshun Project — Session Handoff Document
**Last updated:** May 2026  
**Prepared for:** New Claude session continuation  
**Project owner:** DeAundre Webb — Sparkles in HD LLC / Webb Mind Labs LLC

---

## 1. What Oshun Is

On-demand beauty product delivery platform for Black beauty consumers. Full ecosystem:
- **Oshun** — core marketplace + delivery app (this repo)
- **Oshun Desk** — CRM for beauty businesses (separate repo, not in workspace yet)
- **Oshun Health** — organic wellness vertical (planned)
- **Oshun Foundation** — tech training nonprofit pipeline (planned)

---

## 2. Live Infrastructure

| Service | URL | Notes |
|---|---|---|
| Frontend (Vite/React) | Local dev: `npm run dev` in `/oshun-app` | Deploy target: Vercel |
| Backend (Express/Node) | `https://oshun-backend-production.up.railway.app` | Deployed on Railway |
| Database | Supabase — `https://mtamhsyzbnxuuapuallv.supabase.co` | Postgres + RLS |

### .env (frontend root)
```
VITE_SUPABASE_URL=https://mtamhsyzbnxuuapuallv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_BACKEND_URL=https://oshun-backend-production.up.railway.app
```

### Railway env vars (backend)
Set in Railway dashboard — includes: `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `CLIENT_URL`, `PORT`

---

## 3. Tech Stack

**Frontend:** React (Vite), single-file `src/App.jsx` (no subdirectories), Framer Motion, Sonner toasts, Lucide icons  
**Backend:** Node/Express, `oshun-backend/` subfolder  
**Database:** Supabase (Postgres)  
**Payments:** Stripe (Checkout Sessions — no frontend SDK needed)  
**Email:** Resend (not yet configured — no API key attached yet)  
**Deployment:** Railway (backend), Vercel (frontend — confirm if live)

---

## 4. File Structure (key files only)

```
oshun-app/
├── src/
│   ├── App.jsx          ← ENTIRE frontend in one file (~8000+ lines)
│   └── api.js           ← All API fetch functions
├── oshun-backend/
│   ├── server.js        ← Express entry, route mounts, Stripe webhook
│   └── src/
│       ├── config/db.js           ← Supabase client (require('../config/db'))
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
│           ├── auth.js                  ← JWT: attaches req.user.userId
│           └── requiresOshunPlus.js     ← Attaches req.isOshunPlus flag
├── .env
├── oshun_features_migration.sql   ← Run in Supabase (community + creator tables)
├── oshun_plus_migration.sql       ← Run in Supabase (subscriptions table)
└── CLAUDE.md                      ← Full brand/product guide (always loaded)
```

---

## 5. Supabase Tables

### Already migrated (run `oshun_features_migration.sql`)
- `community_posts`, `community_likes`, `community_saves`, `community_comments`
- `community_follows`, `community_hashtags`
- `creator_profiles`, `credit_transactions`, `credit_redemptions`, `creator_referrals`
- RPC functions: `increment_creator_credits`, `decrement_creator_credits`

### PENDING — still needs to be run
> **`oshun_plus_migration.sql`** has NOT been run yet.  
> Open Supabase SQL Editor → paste contents → run.  
> Creates: `user_subscriptions`, `foundation_donation_ledger`  
> Also runs: `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`

---

## 6. Features Built (Complete)

| Feature | Frontend | Backend | DB |
|---|---|---|---|
| Auth (register/login/JWT) | ✅ | ✅ | ✅ users table |
| Product marketplace | ✅ | ✅ | ✅ |
| Business browsing | ✅ | ✅ | ✅ |
| Services | ✅ | ✅ | ✅ |
| Brand partners | ✅ | ✅ | ✅ |
| Cart + checkout | ✅ | ✅ | ✅ |
| Order tracking | ✅ | ✅ | ✅ |
| Community feed | ✅ | ✅ | ✅* |
| Business Hub (4 tabs) | ✅ | ✅ | ✅ |
| Brand Hub | ✅ | ✅ | ✅ |
| Driver Hub | ✅ | ✅ | ✅ |
| Creator Partner Program | ✅ | ✅ | ✅* |
| Oshun+ Subscription (Stripe) | ✅ | ✅ | ⚠️ pending SQL |

*Tables exist in Supabase, backend routes live on Railway, frontend wired. RLS active.

---

## 7. Recent Changes (This Session)

### Bug fixes
- Fixed parse error: unescaped apostrophe in `PLUS_BENEFITS` array (`shop's` in single-quoted string → changed to double quotes)
- Fixed duplicate Lucide imports: `Star`, `CheckCircle`, `Clock` were declared twice

### New UI — Business Hub improvements
1. **Profile dropdown (top-right avatar)** — clicking the avatar now opens a menu: Dashboard / Settings / Help / Sign Out. Sign Out clears `user` state and routes home.
2. **Edit Profile modal** — "Edit Profile" button opens a full modal with: all business fields (name, tagline, phone, address, category, hours) + profile picture upload with live preview.
3. **Community tab** — 5th tab added to Business Hub. Businesses can select post type (Update / Promo / Beauty Tip / Event), write content, and publish to the Oshun community feed. Posts display below the composer.
4. **Community tab in nav** — added to `businessLinks` so it also appears in the top nav when signed in as business.

---

## 8. Stripe Setup

- **Webhook URL:** `https://oshun-backend-production.up.railway.app/api/subscription/webhook`
- **Price ID:** `price_1TY4Q220BaVPJpiG2p7WLfwu` (Oshun+ $9.99/mo)
- **Two webhook events exist** — user should delete the duplicate, keep only the one pointing to Railway URL above
- **Signing secret** goes in Railway env as `STRIPE_WEBHOOK_SECRET`
- Flow: Frontend calls `createCheckoutSession()` → redirects to Stripe hosted page → on success, URL has `?oshun_plus=success` → frontend shows confirmation

---

## 9. Pending Tasks (Next Session)

### High priority
- [ ] **Run `oshun_plus_migration.sql`** in Supabase SQL Editor
- [ ] **Delete duplicate Stripe webhook** — keep only the Railway one
- [ ] **Confirm Vercel frontend deployment** — is the live URL working?
- [ ] **Wire Resend API key** — email confirmations on orders + auth not sending yet

### Feature backlog
- [ ] **Feature Plan 03 (Oshun Circle)** — deferred. Requires `oshun-desk` app in workspace. Business-facing CRM social layer.
- [ ] **Consumer Profile page** — view/edit name, address book, order history
- [ ] **Driver dashboard improvements** — earnings, route history
- [ ] **Real product images** — currently using placeholder initials/gradients
- [ ] **Supabase Storage integration** — for business profile photo uploads (currently frontend-only preview)
- [ ] **Push oshun_plus_migration.sql → test Oshun+ subscription flow end-to-end**

---

## 10. Critical Technical Rules (Don't Break These)

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
```

---

## 11. Brand Quick Reference

| Item | Value |
|---|---|
| Brand | Oshun |
| Tagline | "Dream Deep." |
| Primary BG | `#060F20` (Abyss) |
| Card BG | `#0B1C3A` (Deep Navy) |
| Gold accent | `#C8A84B` |
| Teal accent | `#4AABBF` |
| Display font | Playfair Display |
| Body font | Jost |
| Founder | DeAundre Webb |
| Entity | Sparkles in HD LLC |

Full brand guide is always available in `CLAUDE.md` at the project root.

---

## 12. How to Start a New Session

1. Open Cowork with the `oshun-app` folder selected
2. Paste this to Claude:

> "I'm continuing work on the Oshun app. Read the file OSHUN_HANDOFF.md in the project root for full context, then read CLAUDE.md for brand guidelines. The main frontend is src/App.jsx and the backend is in oshun-backend/. Ask me what we're working on today."

---

*End of handoff — Oshun v1 · Webb Mind Labs LLC · Confidential*
