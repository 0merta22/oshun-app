# Oshun — Strategy & App Build Handoff
**Webb Mind Labs LLC / Sparkles in HD LLC**
**Founder:** DeAundre Webb
**Date:** May 2026
**Classification:** Confidential / Internal Use

---

## What This Document Is
This is the handoff for a strategy-focused Claude session. It covers current build status, what's done, what's left, the full tech stack, and the business context needed to think clearly about launch, GTM, and next-phase priorities.

Paste this into a new Claude project. The app build continues in the existing Cowork session.

---

## Part 1 — The Product in One Paragraph
Oshun is an on-demand beauty marketplace and delivery platform built specifically for Black beauty consumers — a market contributing $9B annually that has never had a dedicated, well-designed solution. The consumer app (oshun-app) is a React frontend + Node/Express backend that handles product browsing, service booking, cart/checkout, order tracking, and an internal drivers network. Oshun Desk is a companion CRM for beauty business owners — appointment scheduling, inventory, client management, and booking requests. Together they form a closed loop: the customer orders through Oshun, the shop manages it through Oshun Desk, the driver is part of the Oshun network.

**Brand tagline:** Dream Deep.
**Mission:** To finally see what has gone unseen for far too long.

---

## Part 2 — Current Build Status

### oshun-app (Consumer Marketplace Frontend)
| Area | Status | Notes |
|------|--------|-------|
| UI / Visual Design | ✅ Complete | Dark navy brand theme applied — Abyss #060F20 background, Gold #C8A84B accent, Seafoam #4AABBF, Shoreline #F5E8C0 text, Playfair Display + Jost fonts, Wave Mark SVG logo |
| Framer Motion animations | ✅ Complete | Page transitions (AnimatePresence), spring-physics card hovers, staggered product grid, toast notifications |
| Mock data → Real API | ✅ Complete | Products, businesses, services, brand partners all wired to Express backend; fallback to mock data if API unreachable |
| Auth (signup/login/JWT) | ✅ Complete | Register, login, `/api/auth/me` — JWT stored in localStorage |
| Role-based routing | ✅ Complete | Business → dashboard, Brand → branddashboard, Driver → driver, Consumer → home |
| Cart + Checkout | ✅ Complete | Full cart flow, delivery fee logic, order submission |
| Order tracking | ✅ Complete | Real-time status tracking page |
| Business Dashboard | ✅ Complete | Storefront, Inventory, Orders, Analytics tabs |
| Brand Dashboard | ✅ Complete | Storefront, Orders, Analytics, Products tabs + Request Hub |
| Driver Dashboard | ✅ Complete | Landing + active delivery tabs |
| Services + Booking | ✅ Complete | Service browse + booking request flow |
| Virtual Try-On page | ✅ Complete | UI shell (AI integration is future work) |
| Subscription Box page | ✅ Complete | UI shell |
| Beauty Concierge FAB | ✅ Complete | AI chat widget (backend AI integration is future work) |
| Join / Partner page | ✅ Complete | For business, brand, driver sign-up |
| Search | ✅ Complete | Cross-category global search |

### oshun-app Backend (Express + Supabase)
| Controller | Status | Notes |
|-----------|--------|-------|
| authController | ✅ | Register, login, JWT, bcrypt — username save bug fixed |
| productController | ✅ | Products, businesses, services, brand partners endpoints |
| orderController | ✅ | Create order, fetch orders, update status, JWT auth fixes, email wired |
| profileController | ✅ | Rewritten from pg syntax → Supabase syntax (was broken) |
| paymentController | ✅ | Stripe payment intent |
| uploadController | ✅ | Cloudinary image upload |
| hubController | ⚠️ | Works but brand_id ownership check missing (any user can submit on behalf of any brand) |
| Email (Resend) | ✅ | sendOrderConfirmation + sendOrderStatusUpdate wired into orderController; domain set to no-reply@oshun.com |
| Socket.io | ✅ | Real-time order status updates |

### oshun-desk (Business CRM — separate Vite app)
| Area | Status | Notes |
|------|--------|-------|
| Supabase schema | ✅ | All tables created in oshun-app's Supabase project (consolidated) |
| RLS policies | ✅ | Full team-based isolation on all 8 tables |
| Login / Dashboard | ✅ | Working on port 3000 |
| GitHub push | ⏳ Pending | Not yet pushed to GitHub |
| Vercel deployment | ⏳ Pending | Env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) need to be added to Vercel |

---

## Part 3 — Remaining Production Blockers

### Must-Do Before Launch

**1. Backend deployment (Railway)**
- Git repo created at `https://github.com/0merta22/oshun-backend.git`
- Partially set up — was mid-deploy when session pivoted
- Step paused at: adding environment variables in Railway dashboard
- Required env vars for Railway:
  ```
  SUPABASE_URL=<from Supabase project settings>
  SUPABASE_SERVICE_ROLE_KEY=<service role key>
  JWT_SECRET=<your secret>
  RESEND_API_KEY=<from resend.com>
  CLOUDINARY_CLOUD_NAME=<from cloudinary>
  CLOUDINARY_API_KEY=<from cloudinary>
  CLOUDINARY_API_SECRET=<from cloudinary>
  STRIPE_SECRET_KEY=<from stripe>
  STRIPE_WEBHOOK_SECRET=<from stripe>
  CLIENT_URL=https://your-oshun-frontend-domain.com
  PORT=4000
  ```

**2. Frontend deployment (Vercel)**
- oshun-app frontend needs to be deployed to Vercel
- Requires env var: `VITE_BACKEND_URL=https://your-railway-backend-url.com`

**3. Missing credentials** — the following block entire subsystems if absent:
  - `RESEND_API_KEY` → all transactional emails fail silently
  - `CLOUDINARY_*` → all image uploads fail with 500
  - `STRIPE_SECRET_KEY` → all payment intents fail
  - `STRIPE_WEBHOOK_SECRET` → webhooks rejected, orders never confirmed

**4. Process manager on backend**
- No PM2 or unhandledRejection handler — one crash takes the server down
- Fix: add `process.on('unhandledRejection', (err) => console.error(err))` to server.js, or use PM2

**5. oshun-desk Vercel deployment**
- Working locally; needs GitHub push + Vercel env vars set

### Smaller Items (Pre-Launch Polish)
| # | What | Where |
|---|------|-------|
| 14 | hubController — no brand ownership check | hubController.js |
| 15 | No helmet middleware (missing security headers) | server.js — `npm i helmet` + `app.use(helmet())` |
| 11 | DATABASE_URL malformed — has `https://` in host | oshun-backend/.env |

---

## Part 4 — Tech Stack

### Frontend (oshun-app)
```
React 18 (Vite)
Framer Motion — animations
Sonner — toast notifications
Lucide React — icons
Supabase JS — direct Supabase queries (auth/profile)
Stripe JS — payment UI
```

### Backend (oshun-backend)
```
Node.js / Express 5
Supabase JS (service role) — all DB operations
Socket.io — real-time order updates
Resend — transactional email
Cloudinary — image storage
Stripe — payments
bcrypt — password hashing
JWT — auth tokens
express-rate-limit — rate limiting
```

### Infrastructure
```
Supabase project: mtamhsyzbnxuuapuallv (oshun-app + oshun-desk consolidated)
Backend target: Railway
Frontend target: Vercel
Domain: oshun.com (verify with Resend for email delivery)
```

### Key Files
```
/oshun-app/src/App.jsx              — entire consumer frontend (~6,300 lines)
/oshun-app/src/api.js               — all frontend→backend API calls
/oshun-backend/src/server.js        — Express entry point
/oshun-backend/src/controllers/     — 12 controllers
/oshun-backend/src/routes/          — 12 route files
/oshun-backend/src/lib/email.js     — Resend email helpers
/oshun-app/oshun_desk_schema.sql    — all oshun-desk Supabase tables + RLS
```

---

## Part 5 — Business Context for Strategy

### Revenue Model
- **AI Automation Consulting** — active, generating revenue via Make.com + GPT automation
- **Platform (future):** marketplace commission, Oshun Desk SaaS subscription, Oshun Health product sales
- **Year 1 projection:** $112,800 | **Year 2:** $222,000 | **Year 3:** $402,000

### The Ecosystem (4 verticals)
```
OSHUN (Mother Brand)
├── Oshun Marketplace  — consumer delivery app (this build)
├── Oshun Desk         — CRM for beauty businesses
├── Oshun Health       — organic wellness products (planned)
└── Oshun Foundation   — tech certification → employment pipeline (planned)
```

### Active Channels
- TikTok, Instagram, Etsy — three-platform funnel, 4-week content calendar developed
- Google Drive + Gmail via Make.com
- Stripe + Postman connected
- $100,000 business line of credit application in progress

### The Strategic Frame
This is not a niche app — it is a **movement** and an **economic infrastructure play**. The closed loop (customer → shop → driver → graduate) means every dollar circulates within the ecosystem. Strategy conversations should weigh: launch sequencing, community activation before tech launch, business partner onboarding (Oshun Desk), and foundation pipeline as a long-term moat.

---

## Part 6 — What to Cover in Strategy Session
Suggested agenda for the new Claude project:

1. **Launch sequencing** — which comes first: soft launch with select businesses, public launch, or wait for full deployment?
2. **Business partner acquisition** — how do we get the first 10 beauty businesses onto Oshun Desk?
3. **Driver network bootstrap** — chicken-and-egg problem: need drivers before businesses, need businesses before consumers
4. **Content + GTM** — how does the existing TikTok/Instagram funnel support the app launch?
5. **Monetization phase 1** — what's the right pricing model for Oshun Desk before the marketplace has volume?
6. **Foundation narrative** — how do we use the Foundation story to differentiate from generic delivery apps in press and fundraising?
7. **Credit line deployment** — how does the $100K LOC get allocated across the four verticals?

---

*Oshun Master Handoff — Strategy Edition | Webb Mind Labs LLC | Confidential*
*App build continues in the Cowork session where this file was generated.*
