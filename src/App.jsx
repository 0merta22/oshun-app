import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import {
  fetchProducts, fetchBusinesses, fetchServices, fetchBrandPartners,
  getFeed, likePost, unlikePost, savePost, unsavePost,
  getComments, addComment, followUser, unfollowUser,
  getTrendingHashtags, createPost as createCommunityPost,
  joinCreatorProgram, getMyCreatorProfile, getCreditBalance,
  getCreatorTransactions, getMyReferrals, getAffiliateLink,
  redeemCredits, getCreatorLeaderboard,
  getSubscriptionStatus, createCheckoutSession,
  cancelSubscription, reactivateSubscription, getStripeBillingPortal,
  sendConciergeMessage,
  fetchNews,
} from './api';

// ─────────────────────────────────────────────────────────────
// RESPONSIVE HOOK — no media queries needed in JSX
// ─────────────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return { isMobile: w < 640, isTablet: w < 1024, w };
}

// ─────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────
function Skeleton({ width = "100%", height = 20, radius = 8 }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: `linear-gradient(90deg, ${T.bgCard} 25%, ${T.bgCardAlt} 50%, ${T.bgCard} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  );
}

// ─────────────────────────────────────────────────────────────
// GLOBAL SEARCH
// ─────────────────────────────────────────────────────────────
function searchAll(query, {
  products = PRODUCTS,
  brandProducts = BRAND_PRODUCTS,
  businesses = BUSINESSES,
  brands = BRAND_PARTNERS,
  services = SERVICES,
} = {}) {
  const q = query.toLowerCase().trim();
  if (!q) return { products: [], brands: [], businesses: [], services: [], brandProducts: [] };
  const match = (str) => str?.toLowerCase().includes(q);
  return {
    products:      products.filter(p => match(p.name) || match(p.brand) || match(p.category) || p.tags?.some(match)),
    brandProducts: brandProducts.filter(p => match(p.name) || match(p.brand) || match(p.category) || p.tags?.some(match)),
    businesses:    businesses.filter(b => match(b.name) || match(b.tagline) || match(b.category) || b.tags?.some(match)),
    brands:        brands.filter(b => match(b.name) || match(b.tagline) || b.tags?.some(match)),
    services:      services.filter(s => match(s.name) || match(s.provider) || match(s.description)),
  };
}
import {
  ShoppingCart, Search, Star, MapPin, Clock, X, Plus, Minus,
  Heart, User, Package, Scissors, Home, CreditCard,
  CheckCircle, Calendar, Bell, BarChart2, ArrowLeft,
  ChevronRight, ChevronLeft, Store, Truck, Edit3, LogOut, Eye, EyeOff,
  TrendingUp, Tag, Navigation, Car, DollarSign, Radio, CheckSquare, AlertCircle, Zap,
  Camera, Mic, Sparkles, Send, Share2, Gift, Award,
  Upload, ExternalLink, RefreshCw, FileText, Download, Settings, Users, Globe,
  MessageCircle, Bookmark, Copy, Crown, Layers, Leaf
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────
const T = {
  // ── Backgrounds — dark navy ecosystem (per brand spec) ───────
  bg:           "#060F20",       // Abyss — primary background
  bgCard:       "#0B1C3A",       // Deep Navy — card surface
  bgCardAlt:    "#1A3A6B",       // Tide — elevated surface / alt card
  bgCardHover:  "#1F4580",       // slightly lighter tide for hover
  glass:        "rgba(255,255,255,0.03)",
  glassMid:     "rgba(255,255,255,0.06)",
  glassBorder:  "rgba(255,255,255,0.10)",
  // ── Gold — primary accent (#C8A84B per brand spec) ───────────
  gold:         "#C8A84B",       // brand gold
  goldLight:    "#D9BC6E",       // bright gold
  goldDark:     "#A08530",       // deep gold
  goldGlow:     "rgba(200,168,75,0.18)",
  goldGlowStrong:"rgba(200,168,75,0.38)",
  // ── Current / Seafoam — teal accents ─────────────────────────
  purple:       "#2B7A8C",       // Current — teal (kept as 'purple' key for JSX compat)
  purpleDark:   "#1A5A6B",
  purpleDeep:   "#0B2A36",
  purpleGlow:   "rgba(43,122,140,0.18)",
  seafoam:      "#4AABBF",       // Seafoam — highlight
  // ── Mapped aliases (for backward compat) ─────────────────────
  silver:       "#4AABBF",
  silverLight:  "#6BBFCF",
  silverDark:   "#2B8A9C",
  // ── Text ─────────────────────────────────────────────────────
  cream:        "#F5E8C0",       // Shoreline — warm cream — primary text
  creamMid:     "#D4B896",       // Sand — secondary text
  muted:        "#7A90A8",       // muted blue-grey
  // ── Borders ──────────────────────────────────────────────────
  border:       "rgba(200,168,75,0.15)",   // subtle gold border
  borderMid:    "rgba(200,168,75,0.28)",   // mid gold border
  borderGlow:   "rgba(200,168,75,0.55)",   // active gold glow
  // ── Status ───────────────────────────────────────────────────
  success:      "#4ADE80",
  error:        "#F87171",
  rose:         "#4AABBF",       // maps to seafoam
};

// Inject global styles once
if (typeof document !== "undefined" && !document.getElementById("oshun-global")) {
  const style = document.createElement("style");
  style.id = "oshun-global";
  style.textContent = `
    @keyframes shimmer      { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    /* The Tide — skeleton loader breathes in and out */
    @keyframes tide         { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
    @keyframes oshunSpin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes slideIn      { from{transform:translateX(-12px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes reviewIn     { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes fadeUp       { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes pulse        { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.25);opacity:0.7} }
    @keyframes navPulse     { 0%,100%{box-shadow:0 0 0 0 rgba(184,134,11,0.4)} 60%{box-shadow:0 0 0 6px rgba(184,134,11,0)} }
    @keyframes driverPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(184,134,11,0.35)} 70%{box-shadow:0 0 0 10px rgba(184,134,11,0)} }
    @keyframes goldGlow     { 0%,100%{box-shadow:0 0 12px rgba(184,134,11,0.2)} 50%{box-shadow:0 0 28px rgba(184,134,11,0.45)} }
    @keyframes borderGlow   { 0%,100%{border-color:rgba(184,134,11,0.2)} 50%{border-color:rgba(184,134,11,0.55)} }
    * { box-sizing: border-box; }
    input, textarea, button { font-family: inherit; }
    button { transition: opacity 0.15s, transform 0.15s, box-shadow 0.2s; }
    button:active { transform: scale(0.97); }
    /* Hide scrollbar on horizontal scroll rows but keep scrollable */
    .oshun-hscroll::-webkit-scrollbar { display: none; }
    .oshun-hscroll { -ms-overflow-style: none; scrollbar-width: none; }
    /* Card hover lift — The Shimmer */
    .oshun-card { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
    .oshun-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,168,75,0.4); border-color: rgba(200,168,75,0.45) !important; }
  `;
  document.head.appendChild(style);
}

// Delivery fee — raised from $2.99 to $4.99 (unit economics fix)
const DELIVERY_FEE = 4.99;
// Free delivery threshold — orders over $40 ship free (drives AOV)
const FREE_DELIVERY_THRESHOLD = 40;

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "hair",      label: "Hair Care",           emoji: "✂️" },
  { id: "skincare",  label: "Skin Care",            emoji: "✨" },
  { id: "makeup",    label: "Makeup",               emoji: "💄" },
  { id: "nails",     label: "Nails",                emoji: "💅" },
  { id: "barber",    label: "Barbers",              emoji: "💈" },
  { id: "clothing",  label: "Clothing & Apparel",   emoji: "👗" },
  { id: "fragrance", label: "Fragrance",            emoji: "🌸" },
  { id: "tools",     label: "Tools & Accessories",  emoji: "🪞" },
];

// fulfillmentType:
//   "local"     → on-demand delivery via Oshun driver (existing flow)
//   "ship"      → brand ships direct via carrier (Option 1)
//   "dropship"  → Oshun routes order to brand for fulfillment (Option 3)
//   "warehouse" → brand inventory at Oshun regional hub, on-demand (Option 4 — future)
const PRODUCTS = [
  { id: 1,  businessId: 1, name: "Curl Defining Gel",           brand: "Pattern Beauty",        category: "hair",     price: 24.99, rating: 4.8, reviews: 312,  gradient: "linear-gradient(135deg,#C96B8A,#8B35A8)",  description: "Lightweight gel that defines curls without crunch.",         tags: ["Curly","Natural","Hold"],           fulfillmentType: "local"    },
  { id: 2,  businessId: 1, name: "Rosemary Mint Scalp Oil",     brand: "Mielle Organics",       category: "hair",     price: 12.99, rating: 4.9, reviews: 1204, gradient: "linear-gradient(135deg,#3A6B8B,#2D9E6B)",  description: "Stimulates scalp health and promotes hair growth.",           tags: ["Growth","Scalp","Natural"],         fulfillmentType: "local"    },
  { id: 3,  businessId: 2, name: "Hydra Vizor SPF 30",          brand: "Fenty Skin",            category: "skincare", price: 38.00, rating: 4.7, reviews: 876,  gradient: "linear-gradient(135deg,#D4AF37,#E07B54)",  description: "Invisible moisturizer + sunscreen hybrid.",                  tags: ["SPF","Moisturizer","All Skin"],     fulfillmentType: "local"    },
  { id: 4,  businessId: 2, name: "Black Girl Sunscreen SPF 50", brand: "Black Girl Sunscreen",  category: "skincare", price: 18.99, rating: 4.9, reviews: 2341, gradient: "linear-gradient(135deg,#E07B54,#D4AF37)",  description: "No white cast — jojoba, cacao & avocado enriched.",          tags: ["SPF 50","No White Cast","Melanin"], fulfillmentType: "local"    },
  { id: 5,  businessId: 3, name: "Pro Filt'r Foundation",       brand: "Fenty Beauty",          category: "makeup",   price: 40.00, rating: 4.8, reviews: 4521, gradient: "linear-gradient(135deg,#8B35A8,#C96B8A)",  description: "50 inclusive shades with buildable full coverage.",           tags: ["Full Coverage","50 Shades"],        fulfillmentType: "local"    },
  { id: 6,  businessId: 3, name: "MatteTrance Lipstick",        brand: "Pat McGrath Labs",      category: "makeup",   price: 55.00, rating: 4.9, reviews: 987,  gradient: "linear-gradient(135deg,#A8291A,#C96B8A)",  description: "Intensely pigmented matte lip colour in 50 shades.",         tags: ["Matte","Pigmented","Luxury"],       fulfillmentType: "local"    },
  { id: 7,  businessId: 4, name: "Gel-Couture Nail Polish",     brand: "Essie",                 category: "nails",    price: 11.99, rating: 4.6, reviews: 654,  gradient: "linear-gradient(135deg,#E07B54,#C96B8A)",  description: "Gel-like shine and wear without a UV lamp.",                 tags: ["Gel-like","No Lamp","Chip-Resist"], fulfillmentType: "local"    },
  { id: 8,  businessId: 1, name: "Deep Moisture Mask",          brand: "Shea Moisture",         category: "hair",     price: 14.99, rating: 4.7, reviews: 1890, gradient: "linear-gradient(135deg,#8B6A3A,#C8A055)",  description: "Coconut & hibiscus deep treatment for thick curly hair.",    tags: ["Deep Condition","Curly","Moisture"],fulfillmentType: "local"    },
  { id: 9,  businessId: 2, name: "Vitamin C Brightening Serum", brand: "Good Molecules",        category: "skincare", price: 21.00, rating: 4.7, reviews: 543,  gradient: "linear-gradient(135deg,#F0A030,#E07B54)",  description: "Brightens, evens skin tone and reduces dark spots.",         tags: ["Vitamin C","Brightening","Serum"],  fulfillmentType: "local"    },
  { id: 10, businessId: 3, name: "Setting Spray",               brand: "NYX Professional",      category: "makeup",   price: 9.99,  rating: 4.5, reviews: 3210, gradient: "linear-gradient(135deg,#6B3A8B,#3A6B8B)",  description: "Long-lasting matte setting spray for all-day wear.",         tags: ["Setting","Matte","Long-Wear"],      fulfillmentType: "local"    },
  { id: 11, businessId: 4, name: "Gel Top Coat",                brand: "OPI",                   category: "nails",    price: 14.50, rating: 4.8, reviews: 821,  gradient: "linear-gradient(135deg,#C96B8A,#6B3A8B)",  description: "Salon-quality gel finish top coat.",                         tags: ["Gel","Top Coat","Glossy"],          fulfillmentType: "local"    },
  { id: 12, businessId: 1, name: "Edge Control",                brand: "Eco Styler",            category: "hair",     price: 6.99,  rating: 4.6, reviews: 2100, gradient: "linear-gradient(135deg,#2D5A3A,#3A6B8B)",  description: "Strong-hold, frizz-fighting edge control gel.",              tags: ["Edges","Strong Hold","Natural"],    fulfillmentType: "local"    },
];

// ─── BRAND PARTNERS ─────────────────────────────────────────
// Option 1 = ship, Option 3 = dropship
// Option 4 (warehouse) → set warehouseRegions: ["DC"] once inventory ships to hub
const BRAND_PARTNERS = [
  {
    id: "bp1", name: "Soleil Botanics", tagline: "Small-batch luxury oils from the California coast",
    location: "Los Angeles, CA", category: "Skincare & Oils", rating: 4.9, reviews: 847,
    gradient: "linear-gradient(135deg,#C8A055 0%,#E07B54 100%)", initials: "SB",
    fulfillmentType: "ship", shippingDays: "3-5", shippingFee: 7.99,
    description: "Soleil Botanics crafts small-batch specialty face and body oils using botanicals sourced from California farms. Every bottle is hand-poured and cold-pressed.",
    tags: ["Botanical","Specialty Oils","Luxury","Small-Batch"],
    // warehouseRegions: [] ← Option 4: populate when inventory ships to Oshun DC hub
  },
  {
    id: "bp2", name: "Melanin Lab", tagline: "Science-backed serums formulated for deeper skin tones",
    location: "Houston, TX", category: "Skincare & Serums", rating: 4.8, reviews: 1203,
    gradient: "linear-gradient(135deg,#6B3A8B 0%,#C96B8A 100%)", initials: "ML",
    fulfillmentType: "dropship", shippingDays: "5-7", shippingFee: 0,
    description: "Melanin Lab develops dermatologist-tested formulas specifically designed for melanin-rich skin. Free shipping on every order — fulfilled directly from our Houston lab.",
    tags: ["Dermatologist-Tested","Serums","Melanin-Rich","Free Ship"],
    // warehouseRegions: [] ← Option 4: populate when inventory ships to Oshun DC hub
  },
  {
    id: "bp3", name: "Crown Ritual", tagline: "Ancestral hair care rooted in African botanicals",
    location: "Brooklyn, NY", category: "Hair Care", rating: 4.9, reviews: 2140,
    gradient: "linear-gradient(135deg,#2D5A3A 0%,#3A6B8B 100%)", initials: "CR",
    fulfillmentType: "ship", shippingDays: "2-4", shippingFee: 5.99,
    description: "Crown Ritual blends African black soap, baobab oil, and shea butter into a complete hair care system celebrating the origins of natural beauty.",
    tags: ["African Botanicals","Natural","Protective Styles","Heritage"],
    // warehouseRegions: [] ← Option 4: populate when inventory ships to Oshun DC hub
  },
];

const BRAND_PRODUCTS = [
  // Soleil Botanics — ship
  { id: "bp1-1", brandId: "bp1", name: "24K Rosehip Face Oil",        brand: "Soleil Botanics", category: "skincare", price: 68.00, rating: 4.9, reviews: 412,  gradient: "linear-gradient(135deg,#C8A055,#E07B54)", description: "Cold-pressed rosehip and sea-buckthorn oil blend. Visibly reduces dark spots in 4 weeks.",   tags: ["Rosehip","Anti-Aging","Glow"],         fulfillmentType: "ship",     shippingDays: "3-5" },
  { id: "bp1-2", brandId: "bp1", name: "Squalane Body Elixir",         brand: "Soleil Botanics", category: "skincare", price: 52.00, rating: 4.8, reviews: 287,  gradient: "linear-gradient(135deg,#E07B54,#D4AF37)", description: "Lightweight squalane oil with vitamin E. Absorbs instantly, no greasy residue.",            tags: ["Squalane","Body Oil","Lightweight"],   fulfillmentType: "ship",     shippingDays: "3-5" },
  { id: "bp1-3", brandId: "bp1", name: "Blue Tansy Calming Serum",     brand: "Soleil Botanics", category: "skincare", price: 84.00, rating: 4.9, reviews: 193,  gradient: "linear-gradient(135deg,#3A6B8B,#2D5A3A)", description: "Blue tansy and chamomile calm redness and irritation. Best for sensitive skin.",             tags: ["Blue Tansy","Calming","Sensitive"],    fulfillmentType: "ship",     shippingDays: "3-5" },
  // Melanin Lab — dropship
  { id: "bp2-1", brandId: "bp2", name: "Hyperpigmentation Corrector",  brand: "Melanin Lab",     category: "skincare", price: 58.00, rating: 4.8, reviews: 621,  gradient: "linear-gradient(135deg,#8B35A8,#C96B8A)", description: "Niacinamide + kojic acid formula clinically proven to fade dark spots in 6 weeks.",         tags: ["Niacinamide","Dark Spots","Clinical"], fulfillmentType: "dropship", shippingDays: "5-7" },
  { id: "bp2-2", brandId: "bp2", name: "Melanin Glow Moisturizer",     brand: "Melanin Lab",     category: "skincare", price: 44.00, rating: 4.9, reviews: 834,  gradient: "linear-gradient(135deg,#C96B8A,#8B35A8)", description: "Hyaluronic acid and peptide moisturizer designed to enhance natural melanin radiance.",      tags: ["Hyaluronic","Peptide","Hydrating"],    fulfillmentType: "dropship", shippingDays: "5-7" },
  { id: "bp2-3", brandId: "bp2", name: "SPF 50 Tinted Shield",         brand: "Melanin Lab",     category: "skincare", price: 36.00, rating: 4.7, reviews: 445,  gradient: "linear-gradient(135deg,#6B3A8B,#8B35A8)", description: "Zero white cast SPF 50 in 6 inclusive tints. Reef-safe and fragrance-free.",               tags: ["SPF 50","No White Cast","Tinted"],     fulfillmentType: "dropship", shippingDays: "5-7" },
  // Crown Ritual — ship
  { id: "bp3-1", brandId: "bp3", name: "Baobab & Shea Butter Cream",   brand: "Crown Ritual",    category: "hair",     price: 32.00, rating: 4.9, reviews: 978,  gradient: "linear-gradient(135deg,#2D5A3A,#8B6A3A)", description: "Rich whipped shea and baobab butter for deep moisture and definition on all curl types.",   tags: ["Shea","Baobab","Deep Moisture"],       fulfillmentType: "ship",     shippingDays: "2-4" },
  { id: "bp3-2", brandId: "bp3", name: "African Black Soap Shampoo",   brand: "Crown Ritual",    category: "hair",     price: 28.00, rating: 4.8, reviews: 712,  gradient: "linear-gradient(135deg,#3A6B8B,#2D5A3A)", description: "Sulfate-free cleanse with authentic West African black soap and aloe vera.",                tags: ["Black Soap","Sulfate-Free","Cleanse"], fulfillmentType: "ship",     shippingDays: "2-4" },
  { id: "bp3-3", brandId: "bp3", name: "Pre-Poo Marula Oil Treatment", brand: "Crown Ritual",    category: "hair",     price: 45.00, rating: 4.9, reviews: 534,  gradient: "linear-gradient(135deg,#8B6A3A,#3A6B8B)", description: "Cold-pressed marula oil pre-treatment that prevents breakage and seals in moisture.",        tags: ["Marula","Pre-Poo","Breakage"],         fulfillmentType: "ship",     shippingDays: "2-4" },
];

const SERVICES = [
  { id: 1, businessId: 1, name: "Natural Hair Styling",  category: "hair",     price: 85,  duration: "2 hrs",   rating: 4.9, reviews: 145, gradient: "linear-gradient(135deg,#C96B8A,#8B35A8)", description: "Wash, deep condition, and style your natural hair.",                     provider: "Crown & Glory Beauty",  providerAvatar: "CG" },
  { id: 2, businessId: 1, name: "Silk Press",            category: "hair",     price: 110, duration: "2.5 hrs", rating: 4.8, reviews: 203, gradient: "linear-gradient(135deg,#D4AF37,#C96B8A)", description: "Silky-smooth press that leaves hair sleek without damage.",              provider: "Crown & Glory Beauty",  providerAvatar: "CG" },
  { id: 3, businessId: 2, name: "Signature Facial",      category: "skincare", price: 95,  duration: "1 hr",    rating: 4.9, reviews: 178, gradient: "linear-gradient(135deg,#D4AF37,#3A6B8B)", description: "Deep-cleansing facial tailored to your skin type.",                      provider: "Luxe Skin Studio",      providerAvatar: "LS" },
  { id: 4, businessId: 2, name: "Chemical Peel",         category: "skincare", price: 130, duration: "45 min",  rating: 4.7, reviews: 89,  gradient: "linear-gradient(135deg,#E07B54,#D4AF37)", description: "Resurface and renew your skin with a professional-grade peel.",          provider: "Luxe Skin Studio",      providerAvatar: "LS" },
  { id: 5, businessId: 4, name: "Full Set Acrylics",     category: "nails",    price: 65,  duration: "1.5 hrs", rating: 4.8, reviews: 312, gradient: "linear-gradient(135deg,#C96B8A,#E07B54)", description: "Custom acrylic nail set with your choice of shape and design.",          provider: "Polished By Design",    providerAvatar: "PD" },
  { id: 6, businessId: 4, name: "Box Braid Install",     category: "hair",     price: 180, duration: "5-6 hrs", rating: 4.9, reviews: 267, gradient: "linear-gradient(135deg,#3A6B8B,#8B35A8)", description: "Classic box braids in medium, small, or jumbo sizes.",                  provider: "Polished By Design",    providerAvatar: "PD" },
  { id: 7, businessId: 4, name: "Gel Mani + Pedi",       category: "nails",    price: 90,  duration: "2 hrs",   rating: 4.9, reviews: 445, gradient: "linear-gradient(135deg,#E07B54,#D4AF37)", description: "Full gel manicure and pedicure with your colour choice.",                provider: "Polished By Design",    providerAvatar: "PD" },
  { id: 8, businessId: 1, name: "Locs Retwist",          category: "hair",     price: 75,  duration: "1.5 hrs", rating: 4.8, reviews: 198, gradient: "linear-gradient(135deg,#8B35A8,#3A6B8B)", description: "Clean retwist with optional essential oil treatment.",                   provider: "Crown & Glory Beauty",  providerAvatar: "CG" },
  { id: 9, businessId: 5, name: "Fade & Line-Up",        category: "barber",   price: 35,  duration: "45 min",  rating: 4.9, reviews: 412, gradient: "linear-gradient(135deg,#B8860B,#007A75)", description: "Clean taper fade with precision line-up and edge work.",                 provider: "Kings Cut Barbershop",  providerAvatar: "KC" },
  { id: 10, businessId: 5, name: "Beard Shape & Trim",   category: "barber",   price: 25,  duration: "30 min",  rating: 4.8, reviews: 298, gradient: "linear-gradient(135deg,#007A75,#B8860B)", description: "Full beard shaping, trim, and hot towel treatment.",                    provider: "Kings Cut Barbershop",  providerAvatar: "KC" },
  { id: 11, businessId: 5, name: "Skin Taper + Design",  category: "barber",   price: 55,  duration: "1 hr",    rating: 5.0, reviews: 187, gradient: "linear-gradient(135deg,#1A1A1A,#B8860B)", description: "Skin-level taper with custom design cut into the fade.",                 provider: "Kings Cut Barbershop",  providerAvatar: "KC" },
];

const REVIEWS = {
  1: [
    { id: 1, author: "Aaliyah J.",  initials: "AJ", rating: 5, date: "Apr 8, 2026",  subject: "Natural Hair Styling",  text: "Absolutely phenomenal experience. My curls have never looked this defined — she took her time and the deep condition left my hair feeling like silk. Will 100% be back.", helpful: 24 },
    { id: 2, author: "Monique T.",  initials: "MT", rating: 5, date: "Apr 5, 2026",  subject: "Rosemary Mint Scalp Oil", text: "I've tried so many growth oils and this one is different. My edges are actually filling back in after two months. The Oshun delivery was super fast too!", helpful: 17 },
    { id: 3, author: "Destiny R.",  initials: "DR", rating: 4, date: "Mar 30, 2026", subject: "Silk Press",              text: "Silk press was immaculate — straight without any heat damage. Only reason it's not 5 stars is I had to wait about 20 mins past my appointment time. Quality was worth it though.", helpful: 9  },
    { id: 4, author: "Imani W.",    initials: "IW", rating: 5, date: "Mar 22, 2026", subject: "Locs Retwist",            text: "Best retwist I've had in DC. She gets my parts right every time and the essential oil treatment smells amazing. Booked again for next month already.", helpful: 31 },
    { id: 5, author: "Tiana B.",    initials: "TB", rating: 5, date: "Mar 15, 2026", subject: "Curl Defining Gel",       text: "Ordered the Pattern curl gel and it arrived in like 30 minutes. Packaging was secure and it's legit the real product. Crown & Glory is my go-to for natural products on Oshun.", helpful: 12 },
  ],
  2: [
    { id: 1, author: "Kezia L.",    initials: "KL", rating: 5, date: "Apr 9, 2026",  subject: "Signature Facial",       text: "This facial changed my skin. She diagnosed my dry patches immediately and customized the treatment on the spot. I left glowing and my skin stayed that way for two weeks.", helpful: 38 },
    { id: 2, author: "Nadia M.",    initials: "NM", rating: 5, date: "Apr 2, 2026",  subject: "Vitamin C Serum",         text: "Ordered the Good Molecules serum and it showed up faster than expected. My hyperpigmentation is visibly lighter after 3 weeks. Huge fan.", helpful: 21 },
    { id: 3, author: "Priya S.",    initials: "PS", rating: 4, date: "Mar 27, 2026", subject: "Chemical Peel",           text: "The peel was professional and results were great — my skin texture is so much smoother. The aftercare instructions were thorough. Would bump to 5 stars if booking was easier.", helpful: 14 },
    { id: 4, author: "Camille F.",  initials: "CF", rating: 5, date: "Mar 18, 2026", subject: "Hydra Vizor SPF 30",      text: "I've been searching for an SPF that doesn't leave a white cast on my skin tone and this is it. Ordered same-day on Oshun and it was at my door before dinner.", helpful: 29 },
  ],
  3: [
    { id: 1, author: "Jade W.",     initials: "JW", rating: 5, date: "Apr 10, 2026", subject: "Pro Filt'r Foundation",   text: "They had my shade in stock when no one else did. Delivery was under 25 minutes and the foundation is authentic. Bombshell is my new go-to beauty supply.", helpful: 45 },
    { id: 2, author: "Simone A.",   initials: "SA", rating: 4, date: "Apr 3, 2026",  subject: "Setting Spray",           text: "Great selection and fast delivery. The NYX setting spray I ordered was a great price and works exactly as expected. Would love if they added more drugstore brands.", helpful: 11 },
    { id: 3, author: "Regina P.",   initials: "RP", rating: 5, date: "Mar 29, 2026", subject: "MatteTrance Lipstick",    text: "I can't believe I got Pat McGrath delivered in 30 minutes in DC. This store is dangerous for my wallet. Shade match was perfect.", helpful: 52 },
    { id: 4, author: "Fatima O.",   initials: "FO", rating: 3, date: "Mar 20, 2026", subject: "General Order",           text: "Products were legit and the selection is impressive. My order took about 50 min though which was longer than the estimate. Still a solid store overall.", helpful: 7  },
  ],
  4: [
    { id: 1, author: "Nia R.",      initials: "NR", rating: 5, date: "Apr 7, 2026",  subject: "Full Set Acrylics",       text: "The most precise nail set I've ever gotten. She freehanded the design and didn't charge extra. I've been getting compliments all week. I am not going anywhere else.", helpful: 61 },
    { id: 2, author: "Zara K.",     initials: "ZK", rating: 5, date: "Apr 1, 2026",  subject: "Box Braid Install",       text: "Five and a half hours and not a single break — she is a machine. Box braids are even, scalp isn't tender, and the parting is immaculate. Worth every penny of that $180.", helpful: 44 },
    { id: 3, author: "Leah C.",     initials: "LC", rating: 5, date: "Mar 25, 2026", subject: "Gel Mani + Pedi",         text: "Honestly the most relaxing two hours I've had in a while. The gel didn't chip at all after two weeks — and I'm a teacher so my hands go through it. Phenomenal.", helpful: 33 },
    { id: 4, author: "Amara S.",    initials: "AS", rating: 4, date: "Mar 14, 2026", subject: "Gel Top Coat",            text: "Ordered the OPI top coat via Oshun and it arrived quickly. Legit product, great price. Only wish the store had more nail art supply options.", helpful: 8  },
  ],
};

const BUSINESSES = [
  { id: 1, name: "Crown & Glory Beauty",   tagline: "Natural beauty for the culture",    category: "Hair Care & Products",   rating: 4.9, reviews: 541, deliveryTime: "25-40 min", deliveryFee: 2.99, gradient: "linear-gradient(135deg,#C96B8A 0%,#8B35A8 100%)",  tags: ["Natural","Hair Care","Textured Hair"],  location: "Columbia Heights, DC", initials: "CG", description: "Premium natural beauty products and services for melanin-rich skin and textured hair." },
  { id: 2, name: "Luxe Skin Studio",       tagline: "Where glow is a guarantee",         category: "Skincare & Facials",     rating: 4.8, reviews: 389, deliveryTime: "30-45 min", deliveryFee: 3.49, gradient: "linear-gradient(135deg,#D4AF37 0%,#E07B54 100%)",  tags: ["Skincare","Facials","Luxury"],          location: "U Street, DC",         initials: "LS", description: "A curated skincare studio offering high-performance products and transformative treatments." },
  { id: 3, name: "Bombshell Beauty Supply",tagline: "Everything beauty, all in one",     category: "Full Beauty Supply",     rating: 4.7, reviews: 782, deliveryTime: "20-35 min", deliveryFee: 1.99, gradient: "linear-gradient(135deg,#8B35A8 0%,#C96B8A 100%)",  tags: ["Makeup","Full Range","Wigs"],           location: "Shaw, DC",             initials: "BB", description: "Your one-stop beauty supply shop carrying the widest range of products in the city." },
  { id: 5, name: "Kings Cut Barbershop",    tagline: "Precision cuts for kings",          category: "Barber & Grooming",      rating: 4.9, reviews: 512, deliveryTime: "Studio Only",deliveryFee: 0,    gradient: "linear-gradient(135deg,#B8860B 0%,#007A75 100%)",  tags: ["Barber","Fade","Grooming"],             location: "Shaw, DC",             initials: "KC", description: "Premier Black-owned barbershop serving DC with precision fades, beard work, and skin tapers." },
  { id: 5, name: "Kings Cut Barbershop",    tagline: "Precision cuts for kings",          category: "Barber & Grooming",      rating: 4.9, reviews: 512, deliveryTime: "Studio Only", deliveryFee: 0,    gradient: "linear-gradient(135deg,#B8860B 0%,#007A75 100%)",  tags: ["Barber","Fade","Grooming"],            location: "Shaw, DC",             initials: "KC", description: "Premier Black-owned barbershop serving DC with precision fades, beard work, and skin tapers." },
  { id: 4, name: "Polished By Design",     tagline: "Precision in every stroke",         category: "Nails & Styling",        rating: 4.9, reviews: 634, deliveryTime: "Studio Only",deliveryFee: 0,    gradient: "linear-gradient(135deg,#E07B54 0%,#D4AF37 100%)",  tags: ["Nails","Braids","Styling"],             location: "Petworth, DC",         initials: "PD", description: "Expert nail art and braiding services from a team of certified beauty professionals." },
];

const PROMO_BANNERS = [
  {
    id: 1,
    headline: "New Drop: Summer Essentials",
    sub: "Crown & Glory just stocked the best natural hair picks for the season",
    cta: "Shop Now", badge: "NEW", gradient: "linear-gradient(135deg,#C96B8A 0%,#8B35A8 100%)",
    page: "shop",
  },
  {
    id: 2,
    headline: "Book a Service Today",
    sub: "Silk press, box braids, acrylics — open slots available this week",
    cta: "Book Now", badge: "SERVICES", gradient: "linear-gradient(135deg,#D4AF37 0%,#E07B54 100%)",
    page: "services",
  },
  {
    id: 3,
    headline: "Free Delivery Over $40",
    sub: "Same-day delivery from Black-owned beauty shops near you in DC",
    cta: "Start Shopping", badge: "FREE SHIP", gradient: "linear-gradient(135deg,#007A74 0%,#007A75 100%)",
    page: "shop",
  },
  {
    id: 4,
    headline: "Brand Partners: Ships to DC",
    sub: "Melanin Lab, Crown Ritual & Soleil Botanics — science-backed & culture-rooted",
    cta: "Explore Brands", badge: "BRAND NEW", gradient: "linear-gradient(135deg,#3A6B8B 0%,#2D5A3A 100%)",
    page: "brands",
  },
];

// ─────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "gold", style = {}, disabled }) {
  const base = {
    borderRadius: 12, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    border: "none", opacity: disabled ? 0.45 : 1, fontSize: 14,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    letterSpacing: "0.01em",
  };
  const variants = {
    gold:    { background: `linear-gradient(135deg,${T.gold} 0%,${T.goldDark} 100%)`, color: "#031312", padding: "12px 24px", boxShadow: `0 4px 20px ${T.goldGlow}, 0 1px 0 rgba(255,255,255,0.08) inset` },
    outline: { background: "transparent", border: `1.5px solid ${T.gold}`, color: T.gold, padding: "11px 22px", boxShadow: `0 0 12px ${T.goldGlow}` },
    purple:  { background: `linear-gradient(135deg,${T.purple},${T.purpleDark})`, color: T.cream, padding: "12px 22px", boxShadow: `0 4px 16px ${T.purpleGlow}` },
    ghost:   { background: T.glass, border: `1px solid ${T.glassBorder}`, color: T.creamMid, padding: "8px 14px", backdropFilter: "blur(8px)" },
    danger:  { background: `linear-gradient(135deg,${T.error},#C0392B)`, color: "white", padding: "10px 20px", boxShadow: "0 4px 16px rgba(239,68,68,0.3)" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

function Input({ placeholder, value, onChange, type = "text", style = {} }) {
  return (
    <input
      placeholder={placeholder} value={value} onChange={onChange} type={type}
      style={{
        background: T.bgCardAlt, border: `1px solid ${T.borderMid}`, borderRadius: 12,
        padding: "13px 16px", color: T.cream, outline: "none", fontSize: 14,
        width: "100%", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
        ...style
      }}
    />
  );
}

function Avatar({ initials, gradient, size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: gradient, display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, color: "white", fontSize: size * 0.33,
      border: "1.5px solid rgba(255,255,255,0.15)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────
const PROMO_NOTIFICATIONS = [
  { id:1, title:"✨ Flash Sale — 20% Off Hair Care",      body:"Today only: Rosemary Mint Oil, Edge Control & more.",   time:"Just now",  unread:true  },
  { id:2, title:"🌸 New Arrival: Blue Tansy Serum",       body:"Soleil Botanics just dropped their calming serum.",     time:"2 hrs ago", unread:true  },
  { id:3, title:"💅 Polished By Design — Limited Slots",  body:"Only 2 nail appointments left this week. Book now.",   time:"5 hrs ago", unread:false },
  { id:4, title:"⭐ Oshun Black — Free Delivery Weekend", body:"Subscribe this weekend and save on every order.",       time:"Yesterday", unread:false },
];

function Navbar({ page, setPage, cart, user, onAuthOpen, activeOrder, onTabChange, onSignOut }) {
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const { isMobile } = useBreakpoint();
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [readIds,      setReadIds]      = useState([]);
  const unreadCount = PROMO_NOTIFICATIONS.filter(n => n.unread && !readIds.includes(n.id)).length;
  const openNotifs  = () => { setNotifOpen(o => !o); setReadIds(PROMO_NOTIFICATIONS.map(n => n.id)); };
  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  useEffect(() => {
    if (!profileOpen) return;
    const h = e => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [profileOpen]);
  useEffect(() => {
    if (!notifOpen) return;
    const handler = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // Role-specific nav links — business/brand get their own tabs, driver gets none
  const consumerLinks = [
    { id: "home",      tab: null, label: "Home",      Icon: Home          },
    { id: "shop",      tab: null, label: "Shop",      Icon: Package       },
    { id: "community", tab: null, label: "Community", Icon: Users         },
    { id: "creator",   tab: null, label: "Creator",   Icon: Crown         },
    { id: "oshun-plus",tab: null, label: "Oshun+",   Icon: Star          },
    { id: "services",  tab: null, label: "Services",  Icon: Scissors      },
    { id: "brands",    tab: null, label: "Brands",    Icon: Store         },
    { id: "join",      tab: null, label: "Partner",   Icon: MessageCircle },
  ];
  const businessLinks = [
    { id: "dashboard",      tab: "storefront", label: "Home",      Icon: Home        },
    { id: "dashboard",      tab: "inventory",  label: "Inventory", Icon: Package     },
    { id: "dashboard",      tab: "orders",     label: "Orders",    Icon: ShoppingCart},
    { id: "dashboard",      tab: "analytics",  label: "Analytics", Icon: BarChart2   },
    { id: "dashboard",      tab: "community",  label: "Community", Icon: Users       },
  ];
  const brandLinks = [
    { id: "branddashboard", tab: "storefront", label: "Home",      Icon: Home        },
    { id: "branddashboard", tab: "orders",     label: "Orders",    Icon: ShoppingCart},
    { id: "branddashboard", tab: "analytics",  label: "Analytics", Icon: BarChart2   },
    { id: "branddashboard", tab: "inventory",  label: "Products",  Icon: Package     },
  ];
  const allLinks = user?.type === "business" ? businessLinks
    : user?.type === "brand" ? brandLinks
    : user?.type === "driver" ? []
    : consumerLinks;

  return (
    <nav style={{
      background: `linear-gradient(180deg, ${T.bgCard} 0%, rgba(11,28,58,0.97) 100%)`,
      borderBottom: `1px solid rgba(200,168,75,0.25)`,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 58, gap: 8 }}>

        {/* Logo — Wave Mark + OSHUN wordmark (Playfair Display) */}
        <button onClick={() => { setPage("home"); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginRight: isMobile ? 0 : 16, flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ width: 34, height: 34 }}>
            <defs>
              <linearGradient id="navGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4AABBF"/>
                <stop offset="100%" stopColor="#C8A84B"/>
              </linearGradient>
              <linearGradient id="navGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C8A84B"/>
                <stop offset="100%" stopColor="#4AABBF"/>
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="52" stroke="url(#navGrad1)" strokeWidth="1.5" fill="none" opacity="0.35"/>
            <circle cx="60" cy="60" r="44" stroke="url(#navGrad1)" strokeWidth="0.5" fill="none" opacity="0.15"/>
            <path d="M18 60 Q36 36 60 60 Q84 84 102 60" stroke="url(#navGrad1)" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M18 70 Q36 46 60 70 Q84 94 102 70" stroke="url(#navGrad2)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5"/>
            <path d="M24 50 Q42 28 60 50 Q78 72 96 50" stroke="url(#navGrad1)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.2"/>
          </svg>
          {!isMobile && (
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: '"Playfair Display", serif', color: T.cream, letterSpacing: "0.5px" }}>OSHUN</span>
          )}
        </button>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 2, flex: 1 }}>
            {allLinks.map(({ id, tab, label, Icon }) => (
              <button key={label} onClick={() => { setPage(id); if (tab && onTabChange) onTabChange(id, tab); }} style={{
                background: page === id ? `rgba(200,168,75,0.15)` : "rgba(255,255,255,0.04)",
                color: page === id ? T.gold : T.creamMid,
                border: page === id ? `1px solid rgba(200,168,75,0.45)` : `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 9, padding: "7px 13px", cursor: "pointer",
                fontWeight: page === id ? 600 : 400, fontSize: 13,
                fontFamily: '"Jost", sans-serif',
                display: "flex", alignItems: "center", gap: 5,
                transition: "all 0.18s",
              }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        )}

        {isMobile && <div style={{ flex: 1 }} />}

        {/* Active order tracker pill */}
        {activeOrder && (
          <button onClick={() => setPage("tracking")} style={{
            display:"flex", alignItems:"center", gap:6, background:`rgba(200,168,75,0.12)`,
            border:`1.5px solid rgba(200,168,75,0.45)`, borderRadius:20, padding:"5px 13px",
            cursor:"pointer", color:T.gold, fontWeight:700, fontSize:11,
            animation:"navPulse 2s ease-in-out infinite", flexShrink: 0,
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:T.gold, display:"inline-block", flexShrink:0 }} />
            {isMobile ? "Track" : "Track Order"}
          </button>
        )}

        {/* Bell + Cart + Profile — both mobile and desktop */}
        <div ref={notifRef} style={{ display:"flex", alignItems:"center", gap:2, position:"relative" }}>

          {/* Notifications bell */}
          <button onClick={openNotifs} style={{ position:"relative", background:"transparent", border:"none", cursor:"pointer", color: notifOpen ? "#fff" : "rgba(255,255,255,0.85)", padding:8, borderRadius:8, transition:"color 0.2s" }}>
            <Bell size={isMobile ? 19 : 20} />
            {unreadCount > 0 && (
              <span style={{ position:"absolute", top:4, right:4, background:T.error, borderRadius:"50%", width:8, height:8, boxShadow:`0 0 6px rgba(239,68,68,0.6)` }} />
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div style={{ position:"absolute", top:46, right: isMobile ? -82 : 0, width:320, background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, boxShadow:`0 16px 48px rgba(0,0,0,0.7)`, zIndex:200, overflow:"hidden", animation:"fadeUp 0.18s ease" }}>
              <div style={{ padding:"14px 18px 10px", borderBottom:`1px solid ${T.borderMid}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:800, color:T.cream, fontSize:14 }}>Notifications</span>
                <span style={{ fontSize:11, color:T.muted }}>Bi-daily promos</span>
              </div>
              {PROMO_NOTIFICATIONS.map(n => (
                <div key={n.id} style={{ padding:"13px 18px", borderBottom:`1px solid ${T.borderMid}`, display:"flex", gap:12, alignItems:"flex-start", background: !readIds.includes(n.id) && n.unread ? "rgba(210,175,55,0.04)" : "transparent" }}>
                  {!readIds.includes(n.id) && n.unread && <div style={{ width:6, height:6, borderRadius:"50%", background:T.gold, marginTop:5, flexShrink:0, boxShadow:`0 0 6px ${T.gold}` }} />}
                  {(readIds.includes(n.id) || !n.unread) && <div style={{ width:6, flexShrink:0 }} />}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, color:T.cream, fontSize:13, marginBottom:3 }}>{n.title}</div>
                    <div style={{ fontSize:12, color:T.creamMid, lineHeight:1.5 }}>{n.body}</div>
                    <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>{n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding:"10px 18px", textAlign:"center" }}>
                <span style={{ fontSize:12, color:T.gold, cursor:"pointer", fontWeight:600 }}>View all promotions →</span>
              </div>
            </div>
          )}

          {/* Cart */}
          <button onClick={() => setPage("cart")} style={{ position:"relative", background:"transparent", border:"none", cursor:"pointer", color:"#fff", padding:8, borderRadius:8 }}>
            <ShoppingCart size={isMobile ? 19 : 20} />
            {cartCount > 0 && (
              <span style={{ position:"absolute", top:2, right:2, background:T.gold, color:"#031312", borderRadius:"50%", width:16, height:16, fontSize:10, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 6px ${T.gold}` }}>{cartCount}</span>
            )}
          </button>

          {/* Profile avatar / Sign In */}
          {user ? (
            <div ref={profileRef} style={{ position:"relative" }}>
              <button
                onClick={() => setProfileOpen(o => !o)}
                style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.purple})`, border: profileOpen ? `2px solid ${T.gold}` : "none", cursor:"pointer", color:"white", fontWeight:800, fontSize:13, boxShadow:`0 0 12px ${T.goldGlow}`, flexShrink:0 }}
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              {profileOpen && (
                <div style={{ position:"absolute", top:42, right:0, width:200, background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:14, boxShadow:`0 16px 48px rgba(0,0,0,0.7)`, zIndex:300, overflow:"hidden", animation:"fadeUp 0.15s ease" }}>
                  {/* User info header */}
                  <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${T.borderMid}` }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.cream, marginBottom:1 }}>{user.name}</div>
                    <div style={{ fontSize:11, color:T.muted, textTransform:"capitalize" }}>{user.type} account</div>
                  </div>
                  {/* Menu items */}
                  {[
                    { icon: <Home size={14}/>,     label:"Dashboard",  action:() => { setPage(user.type==="business"?"dashboard":user.type==="driver"?"driver":user.type==="brand"?"branddashboard":"profile"); setProfileOpen(false); } },
                    { icon: <Settings size={14}/>,  label:"Settings",   action:() => { toast.info("Settings coming soon"); setProfileOpen(false); } },
                    { icon: <Globe size={14}/>,     label:"Help",       action:() => { toast.info("Help center coming soon"); setProfileOpen(false); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"11px 16px", background:"none", border:"none", cursor:"pointer", color:T.creamMid, fontSize:13, fontFamily:'"Jost",sans-serif', textAlign:"left", transition:"background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background="none"}
                    >
                      <span style={{ color:T.gold }}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                  <div style={{ borderTop:`1px solid ${T.borderMid}` }}>
                    <button onClick={() => { if(onSignOut) onSignOut(); setProfileOpen(false); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"11px 16px", background:"none", border:"none", cursor:"pointer", color:"#EF4444", fontSize:13, fontFamily:'"Jost",sans-serif', textAlign:"left", transition:"background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background="none"}
                    >
                      <LogOut size={14}/> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onAuthOpen} style={{ padding:"8px 16px", fontSize:13, fontWeight:600, fontFamily:'"Jost",sans-serif', borderRadius:9, background:`rgba(200,168,75,0.12)`, border:`1px solid rgba(200,168,75,0.4)`, color:T.gold, cursor:"pointer" }}>Sign In</button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE BOTTOM TAB BAR
// ─────────────────────────────────────────────────────────────
function MobileBottomNav({ page, setPage, cart, user, onAuthOpen }) {
  const tabs = [
    { id:"home",      label:"Home",      Icon:Home     },
    { id:"shop",      label:"Shop",      Icon:Package  },
    { id:"community", label:"Community", Icon:Users    },
    { id:"creator",   label:"Creator",   Icon:Crown    },
    { id: user?.type === "business" ? "dashboard" : user?.type === "driver" ? "driver" : "profile",
      label:"Account", Icon:User, action: !user ? onAuthOpen : null },
  ];

  return (
    <nav style={{
      position:"fixed", bottom:0, left:0, right:0,
      background:"rgba(6,15,32,0.96)",
      borderTop:`1px solid rgba(200,168,75,0.2)`,
      backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
      display:"flex", alignItems:"center", height:62,
      zIndex:200, paddingBottom:"env(safe-area-inset-bottom,0px)",
    }}>
      {tabs.slice(0,2).map(({ id, label, Icon }) => {
        const active = page === id;
        return (
          <button key={id} onClick={() => setPage(id)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:3, background:"transparent", border:"none",
            cursor:"pointer", padding:"8px 0", position:"relative",
            color: active ? T.gold : T.muted,
          }}>
            {active && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:24, height:2, borderRadius:2, background:T.gold, boxShadow:`0 0 8px ${T.gold}` }} />}
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize:10, fontWeight:active?700:400, letterSpacing:"0.02em" }}>{label}</span>
          </button>
        );
      })}

      {/* Center Sparkles button */}
      <div style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"center" }}>
        <button onClick={() => setPage("shop")} style={{
          width:52, height:52, borderRadius:"50%",
          background:`linear-gradient(135deg,${T.gold} 0%,${T.purple} 100%)`,
          border:`2.5px solid ${T.bg}`, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 0 20px ${T.goldGlowStrong}, 0 4px 16px rgba(0,0,0,0.6)`,
          marginBottom:18,
          animation:"goldGlow 3s ease-in-out infinite",
        }}>
          <Sparkles size={21} color="#fff" />
        </button>
      </div>

      {tabs.slice(2).map(({ id, label, Icon, action }) => {
        const active = page === id;
        return (
          <button key={id} onClick={() => action ? action() : setPage(id)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:3, background:"transparent", border:"none",
            cursor:"pointer", padding:"8px 0", position:"relative",
            color: active ? T.gold : T.muted,
          }}>
            {active && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:24, height:2, borderRadius:2, background:T.gold, boxShadow:`0 0 8px ${T.gold}` }} />}
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize:10, fontWeight:active?700:400, letterSpacing:"0.02em" }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// PROMO BANNER CAROUSEL
// ─────────────────────────────────────────────────────────────
function HomeBannerCarousel({ setPage }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  const start = useCallback(() => {
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % PROMO_BANNERS.length);
    }, 4000);
  }, []);

  useEffect(() => { start(); return () => clearInterval(timerRef.current); }, [start]);

  const go = (dir) => {
    clearInterval(timerRef.current);
    setIdx(i => (i + dir + PROMO_BANNERS.length) % PROMO_BANNERS.length);
    start();
  };

  const b = PROMO_BANNERS[idx];

  return (
    <div style={{ position:"relative", margin:"12px 16px", borderRadius:18, overflow:"hidden", height:170, background:b.gradient }}>
      <div style={{ position:"absolute", top:14, left:14, background:"rgba(0,0,0,0.35)", color:"#fff", fontSize:9, fontWeight:800, letterSpacing:1.5, padding:"4px 10px", borderRadius:20, backdropFilter:"blur(8px)" }}>
        {b.badge}
      </div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 18px 18px", background:"linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 100%)" }}>
        <div style={{ color:"#fff", fontWeight:900, fontSize:18, lineHeight:1.2, marginBottom:5 }}>{b.headline}</div>
        <div style={{ color:"rgba(255,255,255,0.82)", fontSize:12, marginBottom:12 }}>{b.sub}</div>
        <button onClick={() => setPage(b.page)} style={{ background:"rgba(255,255,255,0.2)", border:"1.5px solid rgba(255,255,255,0.6)", backdropFilter:"blur(8px)", color:"#fff", fontWeight:700, fontSize:12, padding:"7px 16px", borderRadius:20, cursor:"pointer" }}>
          {b.cta} →
        </button>
      </div>
      <button onClick={() => go(-1)} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", background:"rgba(0,0,0,0.35)", border:"none", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
        <ChevronLeft size={14} />
      </button>
      <button onClick={() => go(1)} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"rgba(0,0,0,0.35)", border:"none", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
        <ChevronRight size={14} />
      </button>
      <div style={{ position:"absolute", bottom:10, right:14, display:"flex", gap:5 }}>
        {PROMO_BANNERS.map((_, i) => (
          <div key={i} onClick={() => { clearInterval(timerRef.current); setIdx(i); start(); }} style={{ width: i===idx ? 18 : 6, height:6, borderRadius:3, background: i===idx ? "#fff" : "rgba(255,255,255,0.45)", cursor:"pointer", transition:"width 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────
function BusinessCard({ biz, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="oshun-card"
      whileHover={{ y: -6, boxShadow: `0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px ${T.borderGlow}` }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}
      style={{
        background: T.bgCard,
        border: `1px solid ${T.borderMid}`,
        borderRadius: 18, overflow: "hidden", cursor: "pointer", textAlign: "left", width: "100%",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>
      {/* Cover image area */}
      <div style={{ height: 120, background: biz.gradient, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Avatar initials={biz.initials} gradient="rgba(0,0,0,0.35)" size={58} />
        </div>
        {/* Open badge */}
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)", color: "#22C55E", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, letterSpacing: 0.5, backdropFilter: "blur(6px)" }}>
          ● OPEN
        </div>
        {/* Delivery pill */}
        <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.65)", color: T.cream, fontSize: 10, fontWeight: 600, padding: "4px 9px", borderRadius: 20, backdropFilter: "blur(6px)", display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} /> {biz.deliveryTime}
        </div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: T.cream, marginBottom: 3, letterSpacing: "-0.2px" }}>{biz.name}</div>
        <div style={{ fontSize: 12, color: T.creamMid, marginBottom: 10, lineHeight: 1.4 }}>{biz.tagline}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Star size={12} color={T.gold} fill={T.gold} />
            <span style={{ color: T.gold, fontWeight: 700, fontSize: 12 }}>{biz.rating}</span>
            <span style={{ color: T.muted, fontSize: 11 }}>({biz.reviews})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, color: T.muted, fontSize: 11 }}>
            <MapPin size={10} /> {biz.location.split(",")[0]}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function ServiceCard({ service, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="oshun-card"
      whileHover={{ y: -5, boxShadow: `0 14px 36px rgba(0,0,0,0.65), 0 0 0 1px ${T.borderGlow}` }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}
      style={{
        background: T.bgCard,
        border: `1px solid ${hovered ? T.borderGlow : T.borderMid}`,
        borderRadius: 18, overflow: "hidden", cursor: "pointer", textAlign: "left", width: "100%",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.6)` : "0 2px 12px rgba(0,0,0,0.3)",
      }}>
      <div style={{ height: 110, background: service.gradient, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.5) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Avatar initials={service.providerAvatar} gradient="rgba(0,0,0,0.3)" size={50} />
        </div>
        <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", color: T.cream, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>
            <Clock size={9} style={{ verticalAlign: "middle", marginRight: 3 }} />{service.duration}
          </div>
          <div style={{ background: `rgba(0,207,196,0.15)`, border: `1px solid ${T.gold}44`, color: T.goldLight, fontSize: 13, fontWeight: 900, padding: "3px 10px", borderRadius: 20, backdropFilter: "blur(6px)" }}>
            ${service.price}
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.cream, marginBottom: 3, letterSpacing: "-0.1px" }}>{service.name}</div>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>{service.provider}</div>
      </div>
    </motion.button>
  );
}

function HomePage({ setPage, setSelectedBusiness, setSelectedService, setSearchQuery, setShopCategory, user, products = PRODUCTS, businesses = BUSINESSES, services = SERVICES, brandPartners = BRAND_PARTNERS }) {
  const [search, setSearch] = useState("");
  const { isMobile, isTablet } = useBreakpoint();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleSearch = () => {
    if (search.trim()) { setSearchQuery(search.trim()); setPage("search"); }
  };

  const SectionHeader = ({ title, onSeeAll }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, padding:"0 16px" }}>
      <span style={{ fontSize:18, fontWeight:900, color:T.cream, letterSpacing:"-0.3px" }}>{title}</span>
      {onSeeAll && (
        <button onClick={onSeeAll} style={{ background:"none", border:"none", color:T.gold, cursor:"pointer", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:3, letterSpacing:"0.03em", textTransform:"uppercase" }}>
          See all <ChevronRight size={13} />
        </button>
      )}
    </div>
  );

  return (
    <div style={{ paddingBottom: isMobile ? 80 : 0 }}>

      {/* ── Search Bar ── */}
      <div style={{ padding:"14px 16px 0", background:T.bg }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:11 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.gold, boxShadow:`0 0 6px ${T.gold}` }} />
          <span style={{ fontSize:12, color:T.creamMid, fontWeight:500, letterSpacing:"0.02em" }}>Washington, DC</span>
          <span style={{ fontSize:11, color:T.gold, fontWeight:700 }}>▾</span>
        </div>
        <div style={{
          display:"flex", alignItems:"center",
          background:T.bgCardAlt, borderRadius:14,
          border:`1px solid ${T.borderMid}`,
          padding:"0 14px", height:46, gap:10,
          boxShadow:`0 2px 16px rgba(0,0,0,0.4)`,
          transition:"border-color 0.2s, box-shadow 0.2s",
        }}>
          <Search size={16} color={T.muted} style={{ flexShrink:0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search products, services, or shops..."
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:T.cream, fontSize:14, letterSpacing:"0.01em" }}
          />
          <button onClick={() => {}} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", padding:"4px" }}>
            <Camera size={17} />
          </button>
          <div style={{ width:1, height:18, background:T.borderMid }} />
          <button onClick={() => {}} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", padding:"4px" }}>
            <Mic size={17} />
          </button>
        </div>
      </div>

      {/* ── Personalized Greeting ── */}
      {user && (
        <div style={{ padding:"12px 16px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:14, padding:"12px 16px" }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#ffffff", flexShrink:0, boxShadow:`0 0 12px ${T.goldGlow}` }}>
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontWeight:800, color:T.cream, fontSize:15, letterSpacing:"-0.01em" }}>
                {greeting}, <span style={{ background:`linear-gradient(90deg,${T.gold},${T.rose})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{user.name?.split(" ")[0]}</span> ✦
              </div>
              <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>Ready to find something beautiful today?</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Feature Entry Cards ── */}
      <div className="oshun-hscroll" style={{ padding:"14px 16px 0", display:"flex", gap:10, overflowX:"auto" }}>
        <button onClick={() => setPage("subscribe")} style={{ flexShrink:0, background:`linear-gradient(135deg,${T.purpleDeep},#0D0D18)`, border:`1px solid ${T.purple}44`, borderRadius:16, padding:"13px 18px", cursor:"pointer", textAlign:"left", minWidth:160, boxShadow:`0 4px 20px ${T.purpleGlow}` }}>
          <div style={{ fontSize:22, marginBottom:6 }}>💎</div>
          <div style={{ fontWeight:800, color:T.cream, fontSize:13 }}>Beauty Box</div>
          <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Monthly brand drops</div>
        </button>
        <button onClick={() => setPage("tryon")} style={{ flexShrink:0, background:`linear-gradient(135deg,#0D1420,#141820)`, border:`1px solid ${T.gold}33`, borderRadius:16, padding:"13px 18px", cursor:"pointer", textAlign:"left", minWidth:160, boxShadow:`0 4px 20px ${T.goldGlow}` }}>
          <div style={{ fontSize:22, marginBottom:6 }}>✨</div>
          <div style={{ fontWeight:800, color:T.cream, fontSize:13 }}>Virtual Try-On</div>
          <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>See it before you buy</div>
        </button>
        <button onClick={() => setPage("services")} style={{ flexShrink:0, background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:"13px 18px", cursor:"pointer", textAlign:"left", minWidth:160 }}>
          <div style={{ fontSize:22, marginBottom:6 }}>📅</div>
          <div style={{ fontWeight:800, color:T.cream, fontSize:13 }}>Book a Service</div>
          <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Nail, hair & skin care</div>
        </button>
        <button onClick={() => setPage("brands")} style={{ flexShrink:0, background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:"13px 18px", cursor:"pointer", textAlign:"left", minWidth:160 }}>
          <div style={{ fontSize:22, marginBottom:6 }}>🌐</div>
          <div style={{ fontWeight:800, color:T.cream, fontSize:13 }}>Brand Partners</div>
          <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Ship-to-you brands</div>
        </button>
      </div>

      {/* ── Category Chips ── */}
      <div className="oshun-hscroll" style={{ padding:"14px 0 0", overflowX:"auto" }}>
        <div style={{ display:"flex", gap:8, padding:"0 16px", width:"max-content" }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => { setShopCategory(cat.id); setPage("shop"); }} style={{
              display:"flex", alignItems:"center", gap:6,
              background:T.glass, border:`1px solid ${T.glassBorder}`,
              borderRadius:22, padding:"7px 16px", cursor:"pointer",
              color:T.cream, fontSize:13, fontWeight:500, whiteSpace:"nowrap", flexShrink:0,
              backdropFilter:"blur(8px)",
              boxShadow:"0 2px 8px rgba(0,0,0,0.3)",
            }}>
              <span style={{ fontSize:14 }}>{cat.emoji}</span>{cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Promo Banner Carousel ── */}
      <HomeBannerCarousel setPage={setPage} />

      {/* ── Shops Near You ── */}
      <section style={{ marginTop:26 }}>
        <SectionHeader title="Shops Near You" onSeeAll={() => setPage("shop")} />
        <div className="oshun-hscroll" style={{ overflowX:"auto", paddingBottom:6 }}>
          <div style={{ display:"flex", gap:14, padding:"0 16px", width:"max-content" }}>
            {BUSINESSES.map(biz => (
              <button key={biz.id} onClick={() => { setSelectedBusiness(biz); setPage("business"); }} className="oshun-card" style={{
                background:T.bgCard, border:`1px solid ${T.borderMid}`,
                borderRadius:18, overflow:"hidden", cursor:"pointer",
                textAlign:"left", width:isMobile ? 185 : 220, flexShrink:0,
                boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
              }}>
                <div style={{ height:95, background:biz.gradient, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.5) 100%)" }} />
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Avatar initials={biz.initials} gradient="rgba(0,0,0,0.3)" size={46} />
                  </div>
                  <div style={{ position:"absolute", top:8, right:8, background:"rgba(34,197,94,0.18)", border:"1px solid rgba(34,197,94,0.45)", color:"#22C55E", fontSize:8, fontWeight:800, padding:"2px 7px", borderRadius:20, backdropFilter:"blur(6px)" }}>● OPEN</div>
                  <div style={{ position:"absolute", bottom:8, left:8, background:"rgba(0,0,0,0.65)", color:T.cream, fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:20, backdropFilter:"blur(6px)", display:"flex", alignItems:"center", gap:3 }}>
                    <Clock size={9} />{biz.deliveryTime}
                  </div>
                </div>
                <div style={{ padding:"10px 13px" }}>
                  <div style={{ fontWeight:800, fontSize:13, color:T.cream, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-0.1px" }}>{biz.name}</div>
                  <div style={{ fontSize:11, color:T.creamMid, marginBottom:7, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{biz.tagline}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    <Star size={10} color={T.gold} fill={T.gold} />
                    <span style={{ fontSize:11, color:T.gold, fontWeight:700 }}>{biz.rating}</span>
                    <span style={{ fontSize:11, color:T.muted }}>({biz.reviews})</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Places You May Like ── */}
      <section style={{ marginTop:28 }}>
        <SectionHeader title="Places You May Like" onSeeAll={() => setPage("shop")} />
        <div className="oshun-hscroll" style={{ overflowX:"auto", paddingBottom:6 }}>
          <div style={{ display:"flex", gap:14, padding:"0 16px", width:"max-content" }}>
            {[...BUSINESSES].reverse().map(biz => (
              <button key={`like-${biz.id}`} onClick={() => { setSelectedBusiness(biz); setPage("business"); }} className="oshun-card" style={{
                background:T.bgCard, border:`1px solid ${T.borderMid}`,
                borderRadius:18, overflow:"hidden", cursor:"pointer",
                textAlign:"left", width:isMobile ? 185 : 220, flexShrink:0,
                boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
              }}>
                <div style={{ height:95, background:biz.gradient, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.5) 100%)" }} />
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Avatar initials={biz.initials} gradient="rgba(0,0,0,0.3)" size={46} />
                  </div>
                  <div style={{ position:"absolute", top:8, left:8, background:`linear-gradient(135deg,${T.gold}22,${T.gold}44)`, backdropFilter:"blur(6px)", border:`1px solid ${T.gold}55`, color:T.gold, fontSize:8, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>✦ PICK FOR YOU</div>
                </div>
                <div style={{ padding:"10px 13px" }}>
                  <div style={{ fontWeight:800, fontSize:13, color:T.cream, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{biz.name}</div>
                  <div style={{ fontSize:11, color:T.creamMid, marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{biz.category}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    <Star size={10} color={T.gold} fill={T.gold} />
                    <span style={{ fontSize:11, color:T.gold, fontWeight:700 }}>{biz.rating}</span>
                    <span style={{ fontSize:11, color:T.muted }}>· {biz.deliveryTime}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deals & Limited Time ── */}
      <section style={{ marginTop:28 }}>
        <SectionHeader title="Deals & Limited Time" onSeeAll={() => setPage("shop")} />
        <div className="oshun-hscroll" style={{ overflowX:"auto", paddingBottom:6 }}>
          <div style={{ display:"flex", gap:12, padding:"0 16px", width:"max-content" }}>
            {[
              { product: PRODUCTS[1], pct: 20 },
              { product: PRODUCTS[3], pct: 15 },
              { product: PRODUCTS[7], pct: 10 },
              { product: PRODUCTS[11], pct: 18 },
            ].map(({ product, pct }) => (
              <div key={product.id} className="oshun-card" style={{
                background:T.bgCard, border:`1px solid ${T.borderMid}`,
                borderRadius:16, overflow:"hidden", width:isMobile ? 150 : 170, flexShrink:0,
                boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
              }}>
                <div style={{ height:105, background:product.gradient, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0) 40%,rgba(0,0,0,0.4) 100%)" }} />
                  <div style={{ position:"absolute", top:9, left:9, background:"linear-gradient(135deg,#EF4444,#C0392B)", color:"#fff", fontSize:9, fontWeight:900, padding:"3px 8px", borderRadius:6, letterSpacing:"0.5px", boxShadow:"0 2px 8px rgba(239,68,68,0.4)" }}>
                    -{pct}%
                  </div>
                  <div style={{ position:"absolute", bottom:7, left:9, background:"rgba(0,0,0,0.65)", color:T.gold, fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:20, backdropFilter:"blur(6px)", letterSpacing:"0.3px" }}>
                    Limited deal
                  </div>
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontSize:9, color:T.muted, marginBottom:2, textTransform:"uppercase", letterSpacing:"0.5px" }}>{product.brand}</div>
                  <div style={{ fontWeight:700, fontSize:12, color:T.cream, marginBottom:7, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-0.1px" }}>{product.name}</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                    <span style={{ fontWeight:900, fontSize:15, color:T.goldLight }}>${(product.price * (1 - pct/100)).toFixed(2)}</span>
                    <span style={{ fontSize:10, color:T.muted, textDecoration:"line-through" }}>${product.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Book a Service ── */}
      <section style={{ marginTop:28 }}>
        <SectionHeader title="Book a Service" onSeeAll={() => setPage("services")} />
        <div className="oshun-hscroll" style={{ overflowX:"auto", paddingBottom:6 }}>
          <div style={{ display:"flex", gap:12, padding:"0 16px", width:"max-content" }}>
            {SERVICES.map(svc => (
              <button key={svc.id} onClick={() => { setSelectedService(svc); setPage("booking"); }} className="oshun-card" style={{
                background:T.bgCard, border:`1px solid ${T.borderMid}`,
                borderRadius:16, overflow:"hidden", cursor:"pointer",
                textAlign:"left", width:isMobile ? 162 : 188, flexShrink:0,
                boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
              }}>
                <div style={{ height:85, background:svc.gradient, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.55) 100%)" }} />
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Avatar initials={svc.providerAvatar} gradient="rgba(0,0,0,0.3)" size={40} />
                  </div>
                  <div style={{ position:"absolute", bottom:8, right:8, background:`rgba(0,207,196,0.15)`, border:`1px solid ${T.gold}55`, color:T.goldLight, fontSize:13, fontWeight:900, padding:"3px 10px", borderRadius:20, backdropFilter:"blur(6px)" }}>
                    ${svc.price}
                  </div>
                </div>
                <div style={{ padding:"10px 13px" }}>
                  <div style={{ fontWeight:700, fontSize:12, color:T.cream, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{svc.name}</div>
                  <div style={{ fontSize:10, color:T.gold, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{svc.provider}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand Partners ── */}
      <section style={{ marginTop:28 }}>
        <SectionHeader title="Brand Partners" onSeeAll={() => setPage("brands")} />
        <div className="oshun-hscroll" style={{ overflowX:"auto", paddingBottom:6 }}>
          <div style={{ display:"flex", gap:12, padding:"0 16px", width:"max-content" }}>
            {BRAND_PARTNERS.map(bp => (
              <button key={bp.id} onClick={() => setPage("brands")} className="oshun-card" style={{
                background:T.bgCard, border:`1px solid ${T.borderMid}`,
                borderRadius:16, overflow:"hidden", cursor:"pointer",
                textAlign:"left", width:isMobile ? 178 : 205, flexShrink:0,
                boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
              }}>
                <div style={{ height:80, background:bp.gradient, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.45) 100%)" }} />
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Avatar initials={bp.initials} gradient="rgba(0,0,0,0.25)" size={40} />
                  </div>
                  <div style={{ position:"absolute", bottom:8, left:8, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(6px)", color:T.cream, fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, letterSpacing:"0.5px" }}>
                    {bp.fulfillmentType === "dropship" ? "FREE SHIP" : `SHIPS ${bp.shippingDays}D`}
                  </div>
                </div>
                <div style={{ padding:"10px 13px" }}>
                  <div style={{ fontWeight:800, fontSize:13, color:T.cream, marginBottom:2, letterSpacing:"-0.1px" }}>{bp.name}</div>
                  <div style={{ fontSize:10, color:T.creamMid, marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{bp.tagline}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <Star size={10} color={T.gold} fill={T.gold} />
                    <span style={{ fontSize:10, color:T.gold, fontWeight:700 }}>{bp.rating}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Desktop: Full grid ── */}
      {!isMobile && (
        <section style={{ maxWidth:1200, margin:"32px auto 0", padding:"0 24px" }}>
          <SectionHeader title="All Featured Shops" onSeeAll={() => setPage("shop")} />
          <div style={{ display:"grid", gridTemplateColumns:isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)", gap:16 }}>
            {BUSINESSES.map(biz => (
              <BusinessCard key={biz.id} biz={biz} onClick={() => { setSelectedBusiness(biz); setPage("business"); }} />
            ))}
          </div>
        </section>
      )}

      {/* ── Partner with Oshun Banner ── */}
      <section style={{ padding:"0 16px", marginBottom:24 }}>
        <div style={{
          background: `linear-gradient(135deg, ${T.goldDark} 0%, ${T.gold} 60%, ${T.purple} 100%)`,
          borderRadius:20, padding:isMobile?"20px 20px":"28px 36px",
          display:"flex", flexDirection:isMobile?"column":"row",
          alignItems:"center", justifyContent:"space-between", gap:16,
          boxShadow:`0 8px 32px ${T.goldGlowStrong}`,
        }}>
          <div>
            <div style={{ fontSize:isMobile?16:20, fontWeight:900, color:"#fff", marginBottom:6, letterSpacing:"-0.02em" }}>
              Grow with Oshun ✦
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.5, maxWidth:380 }}>
              Join as a driver and earn $18–28/hr, or list your brand and reach customers across DC and beyond.
            </div>
          </div>
          <button
            onClick={() => setPage("join")}
            style={{
              flexShrink:0,
              background:"rgba(255,255,255,0.95)",
              border:"none", borderRadius:12,
              padding:"12px 26px", cursor:"pointer",
              fontWeight:800, fontSize:14, color:T.goldDark,
              boxShadow:"0 4px 16px rgba(0,0,0,0.2)",
              whiteSpace:"nowrap",
            }}
          >
            Partner with Us →
          </button>
        </div>
      </section>

      {/* ── More to Explore ── */}
      <section style={{ padding:"28px 16px", marginTop:8 }}>
        <div style={{ fontSize:17, fontWeight:800, color:T.cream, marginBottom:14 }}>More to Explore</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {[
            { label:"Hair Care", emoji:"✂️", page:"shop" },
            { label:"Skin Care", emoji:"✨", page:"shop" },
            { label:"Nails",     emoji:"💅", page:"services" },
            { label:"Makeup",    emoji:"💄", page:"shop" },
            { label:"Fragrance", emoji:"🌸", page:"shop" },
            { label:"Tools",     emoji:"🪞", page:"shop" },
          ].map(item => (
            <button key={item.label} onClick={() => setPage(item.page)} style={{
              background:T.bgCard, border:`1px solid ${T.borderMid}`,
              borderRadius:14, padding:"14px 8px", cursor:"pointer",
              textAlign:"center", color:T.cream
            }}>
              <div style={{ fontSize:22, marginBottom:5 }}>{item.emoji}</div>
              <div style={{ fontSize:11, fontWeight:600, color:T.creamMid }}>{item.label}</div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart, inCart }) {
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const outOfStock = product.stock === 0;
  const handleAdd = () => {
    if (outOfStock) return;
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    toast.success(`${product.name} added to cart`, {
      icon: "🛍️",
      duration: 2000,
    });
  };

  return (
    <motion.div
      className="oshun-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: `0 16px 40px rgba(0,0,0,0.65), 0 0 0 1px ${T.borderGlow}` }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      style={{
        background: T.bgCard,
        border: `1px solid ${outOfStock ? T.error+"44" : T.borderMid}`,
        borderRadius: 18,
        overflow: "hidden",
        opacity: outOfStock ? 0.72 : 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Cover */}
      <div style={{ height: 152, background: product.gradient, position: "relative" }}>
        {/* Gradient overlay for depth */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.35) 100%)" }} />
        {/* Wishlist */}
        <button style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.45)", border: `1px solid rgba(255,255,255,0.1)`, backdropFilter: "blur(8px)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.rose, zIndex: 2 }}>
          <Heart size={14} />
        </button>
        {/* Out of stock overlay */}
        {outOfStock && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>
            <span style={{ background: T.error, color: "white", fontWeight: 800, fontSize: 10, padding: "4px 10px", borderRadius: 6, letterSpacing: "0.05em" }}>OUT OF STOCK</span>
          </div>
        )}
        {/* Low stock warning */}
        {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(239,68,68,0.85)", backdropFilter: "blur(6px)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 5, zIndex: 2 }}>
            Only {product.stock} left
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "14px 14px 16px" }}>
        <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{product.brand}</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.cream, marginBottom: 8, lineHeight: 1.35 }}>{product.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
          <Star size={11} fill={T.gold} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 700 }}>{product.rating}</span>
          <span style={{ color: T.muted, fontSize: 11 }}>({product.reviews.toLocaleString()})</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: T.goldLight }}>${product.price.toFixed(2)}</span>
          <button onClick={handleAdd} disabled={outOfStock}
            style={{
              background: outOfStock ? T.bgCardAlt : added ? T.success : `linear-gradient(135deg,${T.gold},${T.goldDark})`,
              color: outOfStock ? T.muted : added ? "white" : "#ffffff",
              border: "none", borderRadius: 9, padding: "7px 13px", cursor: outOfStock ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s",
              boxShadow: (!outOfStock && !added) ? `0 0 12px ${T.goldGlow}` : "none",
            }}>
            {outOfStock ? "Sold Out" : added ? <><CheckCircle size={12} /> Added</> : <><Plus size={12} /> Add</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// SHOP PAGE
// ─────────────────────────────────────────────────────────────
// Fulfillment badge used on both local and brand product cards
function FulfillmentBadge({ type, shippingDays }) {
  const cfg = {
    local:     { label: "Local Delivery",    color: T.gold,    bg: T.purpleDeep,                       icon: "🛵" },
    ship:      { label: `Ships in ${shippingDays} days`, color: "#60A5FA", bg: "#0D1A2E", icon: "📦" },
    dropship:  { label: `Ships in ${shippingDays} days · Free`, color: T.success, bg: "#0A1F0A", icon: "🚀" },
    warehouse: { label: "On-Demand · Hub",   color: T.goldLight, bg: T.purpleDeep,                     icon: "⚡" },
  };
  const c = cfg[type] || cfg.local;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:c.bg, color:c.color, borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700 }}>
      {c.icon} {c.label}
    </span>
  );
}

// Brand partner product card (ship / dropship)
function BrandProductCard({ product, onAddToCart, inCart }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="oshun-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.bgCard, border: `1px solid ${hovered ? T.borderGlow : T.borderMid}`,
        borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${T.borderGlow}` : "0 2px 8px rgba(0,0,0,0.3)",
      }}>
      <div style={{ height: 132, background: product.gradient, position: "relative", display: "flex", alignItems: "flex-end", padding: "12px 14px" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.4) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <FulfillmentBadge type={product.fulfillmentType} shippingDays={product.shippingDays} />
        </div>
      </div>
      <div style={{ padding: "14px 16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>{product.brand}</div>
        <div style={{ fontWeight: 700, color: T.cream, fontSize: 13, marginBottom: 5, lineHeight: 1.35, flex: 1 }}>{product.name}</div>
        <div style={{ fontSize: 11, color: T.creamMid, marginBottom: 10, lineHeight: 1.45 }}>{product.description}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
          {product.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 9, background: T.bgCardAlt, color: T.creamMid, border: `1px solid ${T.borderMid}`, borderRadius: 5, padding: "2px 7px" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 900, fontSize: 18, color: T.goldLight }}>${product.price.toFixed(2)}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Star size={10} fill={T.gold} color={T.gold} />
              <span style={{ fontSize: 10, color: T.gold, fontWeight: 700 }}>{product.rating}</span>
              <span style={{ fontSize: 10, color: T.muted }}>({product.reviews})</span>
            </div>
          </div>
          <button onClick={onAddToCart} style={{
            background: inCart ? T.success : `linear-gradient(135deg,${T.gold},${T.goldDark})`,
            border: "none", borderRadius: 10, padding: "9px 15px", cursor: "pointer",
            color: inCart ? "white" : "#ffffff", fontWeight: 700, fontSize: 12,
            boxShadow: !inCart ? `0 0 12px ${T.goldGlow}` : "none",
          }}>
            {inCart ? "✓ Added" : "+ Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Brand partner store card (for home page / brand directory)
function BrandCard({ brand, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="oshun-card"
      style={{
        background: T.bgCard, border: `1px solid ${hovered ? T.borderGlow : T.borderMid}`,
        borderRadius: 18, overflow: "hidden", cursor: "pointer", textAlign: "left", width: "100%",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${T.borderGlow}` : "0 2px 8px rgba(0,0,0,0.3)",
      }}>
      <div style={{ height: 108, background: brand.gradient, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.35) 100%)" }} />
        <Avatar initials={brand.initials} gradient="rgba(0,0,0,0.3)" size={52} />
        <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.55)", color: T.goldLight, fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 6, backdropFilter: "blur(6px)", border: `1px solid rgba(255,255,255,0.1)`, letterSpacing: "0.05em" }}>
          🌐 NATIONAL
        </span>
      </div>
      <div style={{ padding: "13px 15px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: T.cream, marginBottom: 2 }}>{brand.name}</div>
        <div style={{ fontSize: 11, color: T.creamMid, marginBottom: 9, lineHeight: 1.4 }}>{brand.tagline}</div>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: T.muted, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={10} fill={T.gold} color={T.gold} /> <span style={{ color: T.gold, fontWeight: 700 }}>{brand.rating}</span> <span style={{ color: T.muted }}>({brand.reviews})</span></span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} /> {brand.location}</span>
        </div>
        <FulfillmentBadge type={brand.fulfillmentType} shippingDays={brand.shippingDays} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SEARCH RESULTS PAGE
// ─────────────────────────────────────────────────────────────
function SearchResultsPage({ query, cart, setCart, setPage, setSelectedBusiness, setSelectedService, setSelectedBrand, setSearchQuery, products = PRODUCTS, businesses = BUSINESSES, services = SERVICES, brandPartners = BRAND_PARTNERS, brandProducts = BRAND_PRODUCTS }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [localQuery, setLocalQuery] = useState(query);
  const results = searchAll(query, { products, businesses, services, brands: brandPartners, brandProducts });
  const total = Object.values(results).reduce((s, arr) => s + arr.length, 0);

  const addToCart = p => setCart(prev => {
    const ex = prev.find(i => i.id === p.id);
    return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
  });

  const SectionHeader = ({ label, count }) => count === 0 ? null : (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "28px 0 14px" }}>
      <h2 style={{ color: T.cream, fontWeight: 800, fontSize: 16, margin: 0 }}>{label}</h2>
      <span style={{ background: T.purpleDeep, color: T.gold, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{count}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
      {/* Search bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <div style={{ flex: 1, display: "flex", background: T.bgCardAlt, borderRadius: 12, border: `1.5px solid ${T.borderMid}`, overflow: "hidden" }}>
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center", color: T.muted }}><Search size={17} /></div>
          <input value={localQuery} onChange={e => setLocalQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setSearchQuery(localQuery)}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.cream, fontSize: 15, padding: "12px 0" }} />
          {localQuery && <button onClick={() => { setLocalQuery(""); }} style={{ background: "none", border: "none", color: T.muted, padding: "0 12px", cursor: "pointer" }}><X size={15} /></button>}
        </div>
        <Btn onClick={() => setSearchQuery(localQuery)}>Search</Btn>
      </div>

      {/* Result summary */}
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 8 }}>
        {total > 0 ? <><span style={{ color: T.cream, fontWeight: 700 }}>{total} results</span> for "<span style={{ color: T.gold }}>{query}</span>"</> : `No results for "${query}"`}
      </div>

      {total === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
          <h3 style={{ color: T.cream, fontWeight: 800, marginBottom: 8 }}>Nothing found</h3>
          <p style={{ color: T.muted, marginBottom: 24 }}>Try searching for a product name, brand, category, or shop.</p>
          <Btn onClick={() => setPage("shop")}>Browse All Products</Btn>
        </div>
      )}

      {/* Businesses */}
      <SectionHeader label="Shops" count={results.businesses.length} />
      {results.businesses.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 14 }}>
          {results.businesses.map(b => <BusinessCard key={b.id} biz={b} onClick={() => { setSelectedBusiness(b); setPage("business"); }} />)}
        </div>
      )}

      {/* Local products */}
      <SectionHeader label="Products — Local Delivery" count={results.products.length} />
      {results.products.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(4,1fr)", gap: 14 }}>
          {results.products.map(p => <ProductCard key={p.id} product={p} onAddToCart={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />)}
        </div>
      )}

      {/* Brand products */}
      <SectionHeader label="National Brand Products" count={results.brandProducts.length} />
      {results.brandProducts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(4,1fr)", gap: 14 }}>
          {results.brandProducts.map(p => <BrandProductCard key={p.id} product={p} onAddToCart={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />)}
        </div>
      )}

      {/* Brand partners */}
      <SectionHeader label="National Brands" count={results.brands.length} />
      {results.brands.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 14 }}>
          {results.brands.map(b => <BrandCard key={b.id} brand={b} onClick={() => { setSelectedBrand(b); setPage("brand"); }} />)}
        </div>
      )}

      {/* Services */}
      <SectionHeader label="Services" count={results.services.length} />
      {results.services.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 14 }}>
          {results.services.map(s => <ServiceCard key={s.id} service={s} onClick={() => { setSelectedService(s); setPage("booking"); }} />)}
        </div>
      )}
    </div>
  );
}

function ShopPage({ cart, setCart, setSelectedBrand, setPage, initialCategory, products = PRODUCTS, brandProducts = BRAND_PRODUCTS }) {
  const [activeCat,  setActiveCat]  = useState(initialCategory || "all");
  const [activeMode, setActiveMode] = useState("all");
  const { isMobile, isTablet } = useBreakpoint();

  const localFiltered  = activeCat === "all" ? products       : products.filter(p => p.category === activeCat);
  const brandFiltered  = activeCat === "all" ? brandProducts : brandProducts.filter(p => p.category === activeCat);
  const showLocal      = activeMode !== "national";
  const showNational   = activeMode !== "local";

  const addToCart = product => {
    toast.success(`${product.name} added to cart`, { icon: "🛍️", duration: 2000 });
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      return ex ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...product, qty: 1 }];
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "24px 16px" : "36px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, color: T.cream, marginBottom: 4, letterSpacing: "-0.02em" }}>Shop Beauty</h1>
        <p style={{ color: T.creamMid, fontSize: 14 }}>Local on-demand delivery & national brand partners — in one place</p>
      </div>

      {/* Mode toggle — pill style */}
      <div style={{ display: "flex", gap: 6, background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 14, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {[["all","All Products"],["local","🛵 Local"],["national","🌐 National"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveMode(id)} style={{
            background: activeMode === id ? `linear-gradient(135deg,${T.gold},${T.goldDark})` : "transparent",
            color: activeMode === id ? "#ffffff" : T.creamMid,
            border: "none", borderRadius: 10, padding: isMobile ? "8px 14px" : "9px 18px",
            cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.2s",
            boxShadow: activeMode === id ? `0 0 14px ${T.goldGlow}` : "none",
          }}>{label}</button>
        ))}
      </div>

      {/* Category chips */}
      <div className="oshun-hscroll" style={{ display: "flex", gap: 8, marginBottom: 32, overflowX: "auto", paddingBottom: 4 }}>
        {[{ id: "all", label: "All", emoji: "✦" }, ...CATEGORIES].map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)} style={{
            background: activeCat === cat.id ? `linear-gradient(135deg,${T.gold},${T.goldDark})` : T.glass,
            backdropFilter: activeCat === cat.id ? "none" : "blur(10px)",
            color: activeCat === cat.id ? "#ffffff" : T.creamMid,
            border: `1px solid ${activeCat === cat.id ? T.gold : T.glassBorder}`,
            borderRadius: 20, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13,
            whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
            boxShadow: activeCat === cat.id ? `0 0 12px ${T.goldGlow}` : "none",
          }}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Local products */}
      {showLocal && localFiltered.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          {activeMode === "all" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: T.cream, margin: 0 }}>🛵 Local Delivery</h2>
              <span style={{ fontSize: 12, color: T.gold, background: T.purpleDeep, border: `1px solid ${T.purple}33`, borderRadius: 6, padding: "2px 9px", fontWeight: 600 }}>20–45 min</span>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(4,1fr)", gap: 16 }}>
            {localFiltered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                <ProductCard product={p} onAddToCart={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* National brand products */}
      {showNational && brandFiltered.length > 0 && (
        <div>
          {activeMode === "all" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: T.cream, margin: 0 }}>🌐 National Brands</h2>
                <span style={{ fontSize: 12, color: T.creamMid }}>Ships to you</span>
              </div>
              <button onClick={() => setPage("brands")} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>
                All brand partners →
              </button>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(4,1fr)", gap: 16 }}>
            {brandFiltered.map(p => (
              <BrandProductCard key={p.id} product={p} onAddToCart={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Full-size service card with hover state (used in ServicesPage grid)
function ServiceCardFull({ svc, onBook }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="oshun-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.bgCard, border: `1px solid ${hovered ? `${T.purple}55` : T.borderMid}`,
        borderRadius: 20, overflow: "hidden",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${T.purple}33` : "0 2px 8px rgba(0,0,0,0.3)",
      }}>
      {/* Cover */}
      <div style={{ height: 140, background: svc.gradient, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.5) 100%)" }} />
        <Avatar initials={svc.providerAvatar} gradient="rgba(0,0,0,0.3)" size={64} />
        <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: `1px solid rgba(255,255,255,0.1)`, color: T.cream, fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} /> {svc.duration}
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: "18px 18px 20px" }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: T.cream, marginBottom: 3, letterSpacing: "-0.01em" }}>{svc.name}</div>
        <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 10 }}>by {svc.provider}</div>
        <div style={{ fontSize: 13, color: T.creamMid, marginBottom: 14, lineHeight: 1.5 }}>{svc.description}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
          <Star size={12} fill={T.gold} color={T.gold} />
          <span style={{ color: T.gold, fontWeight: 700, fontSize: 13 }}>{svc.rating}</span>
          <span style={{ color: T.muted, fontSize: 12 }}>({svc.reviews} reviews)</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 900, fontSize: 22, color: T.goldLight }}>${svc.price}</span>
          <Btn onClick={onBook} variant="purple" style={{ padding: "10px 20px", fontSize: 13, borderRadius: 11 }}>Book Now</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SERVICES PAGE
// ─────────────────────────────────────────────────────────────
function ServicesPage({ setPage, setSelectedService, services = SERVICES }) {
  const [activeCat, setActiveCat] = useState("all");
  const { isMobile, isTablet } = useBreakpoint();
  const filtered = activeCat === "all" ? services : services.filter(s => s.category === activeCat);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "24px 16px" : "36px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, color: T.cream, marginBottom: 4, letterSpacing: "-0.02em" }}>Book a Service</h1>
        <p style={{ color: T.creamMid, fontSize: 14 }}>Beauty professionals, on your schedule</p>
      </div>

      {/* Category chips */}
      <div className="oshun-hscroll" style={{ display: "flex", gap: 8, marginBottom: 32, overflowX: "auto", paddingBottom: 4 }}>
        {[{ id: "all", label: "✦ All Services" }, { id: "hair", label: "✂️ Hair" }, { id: "barber", label: "💈 Barber" }, { id: "skincare", label: "✨ Skincare" }, { id: "nails", label: "💅 Nails" }].map(f => (
          <button key={f.id} onClick={() => setActiveCat(f.id)} style={{
            background: activeCat === f.id ? `linear-gradient(135deg,${T.purple},${T.purpleDark})` : T.glass,
            backdropFilter: "blur(10px)",
            color: activeCat === f.id ? T.cream : T.creamMid,
            border: `1px solid ${activeCat === f.id ? T.purple : T.glassBorder}`,
            borderRadius: 20, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13,
            whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s",
            boxShadow: activeCat === f.id ? `0 0 14px ${T.purpleGlow}` : "none",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Service cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 20 }}>
        {filtered.map(svc => (
          <ServiceCardFull key={svc.id} svc={svc} onBook={() => { setSelectedService(svc); setPage("booking"); }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOKING PAGE
// ─────────────────────────────────────────────────────────────
function BookingPage({ service, setPage }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booked, setBooked] = useState(false);

  if (!service) return <div style={{ padding: 40, textAlign: "center", color: T.muted }}>No service selected.</div>;

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i + 1); return d; });
  const DAY_NAMES  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MON_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const TIME_SLOTS = ["9:00 AM","10:00 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];
  const UNAVAIL    = ["10:00 AM","2:00 PM"];

  const fmtDate = d => d ? `${DAY_NAMES[d.getDay()]}, ${MON_NAMES[d.getMonth()]} ${d.getDate()}` : "";

  if (booked) return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "20px 24px", textAlign: "center" }}>
      <div style={{ width: 88, height: 88, borderRadius: "50%", background: `linear-gradient(135deg,${T.gold},${T.success})`, margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${T.goldGlowStrong}`, animation: "goldGlow 3s ease-in-out infinite" }}>
        <CheckCircle size={42} color="#ffffff" />
      </div>
      <h2 style={{ fontSize: 30, fontWeight: 900, color: T.cream, marginBottom: 8, letterSpacing: "-0.02em" }}>You're Booked!</h2>
      <p style={{ color: T.creamMid, marginBottom: 6, fontSize: 15 }}>{service.name}</p>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 36, fontSize: 15 }}>{fmtDate(selectedDate)} at {selectedTime}</p>
      <Btn onClick={() => setPage("home")} style={{ padding: "14px 32px", fontSize: 15 }}>Back to Home</Btn>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
      <button onClick={() => setPage("services")} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 28, fontWeight: 700, fontSize: 14 }}>
        <ArrowLeft size={16} /> Back to Services
      </button>

      {/* Service summary card */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 18, padding: "18px 22px", display: "flex", alignItems: "center", gap: 18, marginBottom: 30 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: service.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "white", fontSize: 18, flexShrink: 0 }}>{service.providerAvatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: T.cream, letterSpacing: "-0.01em" }}>{service.name}</div>
          <div style={{ fontSize: 13, color: T.creamMid, marginTop: 2 }}>by {service.provider} · {service.duration}</div>
        </div>
        <div style={{ fontWeight: 900, fontSize: 22, color: T.gold }}>${service.price}</div>
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 30 }}>
        {["Date", "Time", "Confirm"].map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < 2 ? 1 : "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: step > i + 1 ? T.success : step === i + 1 ? `linear-gradient(135deg,${T.gold},${T.goldDark})` : T.bgCardAlt, color: step >= i + 1 ? "#ffffff" : T.muted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0, boxShadow: step === i + 1 ? `0 0 12px ${T.goldGlow}` : "none" }}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 13, color: step === i + 1 ? T.cream : T.muted, fontWeight: step === i + 1 ? 700 : 400 }}>{label}</span>
            {i < 2 && <div style={{ flex: 1, height: 1, background: T.borderMid }} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Date */}
      {step === 1 && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <h3 style={{ color: T.cream, fontWeight: 800, fontSize: 17, marginBottom: 18, letterSpacing: "-0.01em" }}>Select a Date</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
            {days.map((day, i) => {
              const sel = selectedDate?.toDateString() === day.toDateString();
              return (
                <button key={i} onClick={() => { setSelectedDate(day); setStep(2); }} style={{
                  background: sel ? `linear-gradient(135deg,${T.gold},${T.goldDark})` : T.bgCard,
                  color: sel ? "#ffffff" : T.cream,
                  border: `1px solid ${sel ? T.gold : T.borderMid}`,
                  borderRadius: 12, padding: "10px 4px", cursor: "pointer", textAlign: "center",
                  boxShadow: sel ? `0 0 14px ${T.goldGlow}` : "none", transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.75, letterSpacing: "0.04em" }}>{DAY_NAMES[day.getDay()]}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 2 }}>{day.getDate()}</div>
                  <div style={{ fontSize: 9, opacity: 0.6, marginTop: 1 }}>{MON_NAMES[day.getMonth()]}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2 — Time */}
      {step === 2 && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <h3 style={{ color: T.cream, fontWeight: 800, fontSize: 17, marginBottom: 18, letterSpacing: "-0.01em" }}>Select a Time — {fmtDate(selectedDate)}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {TIME_SLOTS.map(time => {
              const na = UNAVAIL.includes(time);
              const sel = selectedTime === time;
              return (
                <button key={time} onClick={() => !na && setSelectedTime(time)} disabled={na} style={{
                  background: sel ? `linear-gradient(135deg,${T.purple},${T.purpleDark})` : na ? T.bgCardAlt : T.bgCard,
                  color: na ? T.muted : T.cream,
                  border: `1px solid ${sel ? T.purple : na ? T.border : T.borderMid}`,
                  borderRadius: 12, padding: "13px 6px", cursor: na ? "not-allowed" : "pointer",
                  fontWeight: 700, fontSize: 13, opacity: na ? 0.45 : 1, textAlign: "center",
                  boxShadow: sel ? `0 0 14px ${T.purpleGlow}` : "none", transition: "all 0.2s",
                }}>
                  {time}
                  {na && <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>Taken</div>}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <Btn onClick={() => setStep(1)} variant="outline">Back</Btn>
            <Btn onClick={() => setStep(3)} disabled={!selectedTime} style={{ flex: 1 }}>Continue</Btn>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <h3 style={{ color: T.cream, fontWeight: 800, fontSize: 17, marginBottom: 22, letterSpacing: "-0.01em" }}>Confirm Your Booking</h3>
          <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 18, padding: 22, marginBottom: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {[["Service", service.name], ["Provider", service.provider], ["Date", fmtDate(selectedDate)], ["Time", selectedTime], ["Duration", service.duration], ["Total", `$${service.price}`]].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, color: label === "Total" ? T.gold : T.cream, fontSize: label === "Total" ? 20 : 14 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 18, padding: 22, marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <CreditCard size={16} color={T.gold} />
              <span style={{ fontWeight: 700, color: T.cream, fontSize: 15 }}>Payment</span>
              <span style={{ marginLeft: "auto", fontSize: 10, background: T.purpleDeep, color: T.gold, padding: "3px 10px", borderRadius: 8, border: `1px solid ${T.purple}33`, letterSpacing: "0.03em" }}>🔒 Secured by Stripe</span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <Input placeholder="Card number" value="" onChange={() => {}} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input placeholder="MM / YY" value="" onChange={() => {}} />
                <Input placeholder="CVC" value="" onChange={() => {}} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setStep(2)} variant="outline">Back</Btn>
            <Btn onClick={() => setBooked(true)} style={{ flex: 1, padding: "14px", fontSize: 15 }}>Confirm & Pay ${service.price}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BUSINESS STOREFRONT
// ─────────────────────────────────────────────────────────────
function StarRow({ rating, size = 14 }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize:size, color: n <= rating ? T.gold : T.border }}>★</span>
      ))}
    </span>
  );
}

function ReviewsSection({ business, user, onAuthOpen }) {
  const reviews     = REVIEWS[business.id] || [];
  const [showForm,   setShowForm]   = useState(false);
  const [allReviews, setAllReviews] = useState(reviews);
  const [helpful,    setHelpful]    = useState({});
  const [newReview,  setNewReview]  = useState({ rating: 5, subject: "", text: "", author: "" });
  const [submitted,  setSubmitted]  = useState(false);
  const [displayAs,  setDisplayAs]  = useState("name"); // "name" | "initials"

  const handleWriteReview = () => {
    if (!user) { onAuthOpen(); return; }
    setShowForm(s => !s);
  };

  // Derive the display label based on user's preference
  const userInitials = user ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "";
  const resolvedAuthor = user
    ? (displayAs === "initials" ? userInitials : user.name)
    : newReview.author;

  // Rating breakdown
  const breakdown = [5,4,3,2,1].map(star => ({
    star,
    count: allReviews.filter(r => r.rating === star).length,
    pct: allReviews.length ? Math.round(allReviews.filter(r => r.rating === star).length / allReviews.length * 100) : 0,
  }));
  const avg = allReviews.length ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1) : "—";

  const submitReview = () => {
    if (!newReview.text.trim() || !resolvedAuthor.trim()) return;
    const entry = {
      id: Date.now(), author: resolvedAuthor,
      initials: resolvedAuthor.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
      rating: newReview.rating, date: "Today",
      subject: newReview.subject || "General",
      text: newReview.text, helpful: 0,
    };
    setAllReviews(prev => [entry, ...prev]);
    setSubmitted(true);
    setTimeout(() => { setShowForm(false); setSubmitted(false); setNewReview({ rating:5, subject:"", text:"", author:"" }); setDisplayAs("name"); }, 2200);
  };

  return (
    <div>
      <style>{`@keyframes reviewIn { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>

      {/* Summary header */}
      <div style={{ display:"flex", gap:32, alignItems:"flex-start", marginBottom:28, flexWrap:"wrap" }}>
        {/* Big average */}
        <div style={{ textAlign:"center", minWidth:100 }}>
          <div style={{ fontSize:56, fontWeight:900, color:T.gold, lineHeight:1 }}>{avg}</div>
          <StarRow rating={Math.round(parseFloat(avg))} size={18} />
          <div style={{ fontSize:12, color:T.muted, marginTop:6 }}>{allReviews.length} reviews</div>
        </div>

        {/* Bar breakdown */}
        <div style={{ flex:1, minWidth:200 }}>
          {breakdown.map(({ star, count, pct }) => (
            <div key={star} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
              <span style={{ fontSize:12, color:T.muted, width:14, textAlign:"right", flexShrink:0 }}>{star}</span>
              <span style={{ fontSize:12, color:T.gold, flexShrink:0 }}>★</span>
              <div style={{ flex:1, height:6, background:T.bgCardAlt, borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg,${T.gold},${T.goldLight})`, borderRadius:3, transition:"width 0.6s ease" }} />
              </div>
              <span style={{ fontSize:12, color:T.muted, width:26, textAlign:"right", flexShrink:0 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Write review CTA */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <Btn onClick={handleWriteReview} variant={showForm ? "outline" : "gold"} style={{ padding:"10px 20px" }}>
            {showForm ? "Cancel" : "✏️ Write a Review"}
          </Btn>
          {!user && (
            <div style={{ fontSize:11, color:T.muted, textAlign:"center", maxWidth:120 }}>
              Sign in to leave a review
            </div>
          )}
        </div>
      </div>

      {/* Write review form */}
      {showForm && !submitted && (
        <div style={{ background:T.bgCardAlt, border:`1.5px solid ${T.borderMid}`, borderRadius:16, padding:24, marginBottom:24, animation:"reviewIn 0.3s ease" }}>
          <h3 style={{ color:T.cream, fontWeight:800, fontSize:15, marginBottom:16 }}>Share Your Experience</h3>

          {/* Star picker */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:T.muted, marginBottom:8 }}>Your Rating</div>
            <div style={{ display:"flex", gap:6 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setNewReview(r => ({ ...r, rating:n }))}
                  style={{ fontSize:28, background:"none", border:"none", cursor:"pointer", color: n <= newReview.rating ? T.gold : T.border, transition:"color 0.15s" }}>★</button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            {user ? (
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:11, color:T.muted, marginBottom:7, fontWeight:600 }}>POSTING AS</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"white", flexShrink:0 }}>
                    {userInitials}
                  </div>
                  <span style={{ color:T.cream, fontSize:14, fontWeight:700 }}>{resolvedAuthor}</span>
                  <span style={{ fontSize:11, color:T.success, marginLeft:"auto" }}>✓ Verified</span>
                </div>
                {/* Toggle */}
                <div style={{ display:"flex", background:T.bgCardAlt, borderRadius:8, padding:3, gap:3 }}>
                  {[{ val:"name", label:"Full Name" }, { val:"initials", label:"Initials Only" }].map(opt => (
                    <button key={opt.val} onClick={() => setDisplayAs(opt.val)} style={{
                      flex:1, background: displayAs === opt.val ? T.purpleDeep : "transparent",
                      border: `1px solid ${displayAs === opt.val ? T.purple : "transparent"}`,
                      borderRadius:6, padding:"5px 0", cursor:"pointer",
                      color: displayAs === opt.val ? T.goldLight : T.muted,
                      fontSize:11, fontWeight:700, transition:"all 0.15s"
                    }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <Input placeholder="Your name" value={newReview.author} onChange={e => setNewReview(r => ({ ...r, author: e.target.value }))} />
            )}
            <Input placeholder="Product or service reviewed (optional)" value={newReview.subject} onChange={e => setNewReview(r => ({ ...r, subject: e.target.value }))} />
          </div>
          <textarea
            placeholder="Tell others about your experience…"
            value={newReview.text}
            onChange={e => setNewReview(r => ({ ...r, text: e.target.value }))}
            rows={4}
            style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:10, padding:"12px 14px", color:T.cream, outline:"none", fontSize:14, width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", marginBottom:14 }}
          />
          <Btn onClick={submitReview} disabled={!newReview.text.trim() || !newReview.author.trim()}>
            Post Review
          </Btn>
        </div>
      )}

      {/* Success state */}
      {submitted && (
        <div style={{ background:"linear-gradient(135deg,#0A1F0A,#0D1A0D)", border:`1px solid ${T.success}`, borderRadius:14, padding:"18px 24px", marginBottom:24, display:"flex", alignItems:"center", gap:12, animation:"reviewIn 0.3s ease" }}>
          <CheckCircle size={20} color={T.success} />
          <div style={{ fontWeight:700, color:T.success }}>Review posted — thank you!</div>
        </div>
      )}

      {/* Review cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {allReviews.map((r, i) => (
          <div key={r.id} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:14, padding:"18px 20px", animation: i === 0 && !reviews.includes(r) ? "reviewIn 0.4s ease" : "none" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
              {/* Avatar */}
              <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${T.purple},${T.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"white", flexShrink:0 }}>
                {r.initials}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, color:T.cream, fontSize:14 }}>{r.author}</span>
                  <StarRow rating={r.rating} size={12} />
                  <span style={{ fontSize:11, color:T.muted }}>{r.date}</span>
                </div>
                {r.subject && (
                  <div style={{ fontSize:11, color:T.gold, marginTop:2 }}>re: {r.subject}</div>
                )}
              </div>
            </div>
            <p style={{ color:T.creamMid, fontSize:14, lineHeight:1.6, margin:"0 0 12px" }}>{r.text}</p>
            <button
              onClick={() => setHelpful(h => ({ ...h, [r.id]: true }))}
              disabled={helpful[r.id]}
              style={{ background:"none", border:`1px solid ${T.borderMid}`, borderRadius:20, padding:"4px 12px", cursor: helpful[r.id] ? "default" : "pointer", color: helpful[r.id] ? T.success : T.muted, fontSize:12, fontWeight:600, transition:"all 0.2s" }}>
              👍 Helpful ({r.helpful + (helpful[r.id] ? 1 : 0)})
            </button>
          </div>
        ))}
      </div>

      {allReviews.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px" }}>
          <div style={{ fontSize:44, marginBottom:12 }}>💬</div>
          <h3 style={{ color:T.cream, fontWeight:800, marginBottom:6 }}>No reviews yet</h3>
          <p style={{ color:T.muted }}>Be the first to share your experience.</p>
        </div>
      )}
    </div>
  );
}

function BusinessPage({ business, cart, setCart, setPage, setSelectedService, user, onAuthOpen, products = PRODUCTS, services = SERVICES }) {
  const [tab, setTab] = useState("products");
  const { isMobile, isTablet } = useBreakpoint();
  if (!business) return null;

  const bizProducts = products.filter(p => p.businessId === business.id);
  const bizServices = services.filter(s => s.businessId === business.id);
  const reviewCount = (REVIEWS[business.id] || []).length;

  const addToCart = product => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      return ex ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...product, qty: 1 }];
    });
  };

  return (
    <div>
      {/* Hero cover */}
      <div style={{ height: isMobile ? 200 : 240, background: business.gradient, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(3,3,5,0.7) 100%)" }} />
        <button onClick={() => setPage("home")} style={{ position: "absolute", top: 18, left: 18, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 10, padding: "8px 16px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13, zIndex: 2 }}>
          <ArrowLeft size={15} /> Back
        </button>
        {/* Avatar anchored to bottom-left */}
        <div style={{ position: "absolute", bottom: -28, left: 28, zIndex: 2 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "white", border: `2.5px solid rgba(255,255,255,0.25)`, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            {business.initials}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "44px 16px 28px" : "48px 24px 32px" }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: T.cream, marginBottom: 5, letterSpacing: "-0.02em" }}>{business.name}</h1>
        <p style={{ color: T.creamMid, marginBottom: 14, fontSize: 14, lineHeight: 1.6 }}>{business.description}</p>

        {/* Meta row */}
        <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
          <button onClick={() => setTab("reviews")} style={{ background: "none", border: "none", cursor: "pointer", color: T.gold, fontWeight: 700, padding: 0, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
            <Star size={13} fill={T.gold} color={T.gold} /> {business.rating} <span style={{ color: T.muted, fontWeight: 400 }}>({business.reviews})</span>
          </button>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.creamMid }}><MapPin size={13} /> {business.location}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.creamMid }}><Clock size={13} /> {business.deliveryTime}</span>
          {business.deliveryFee > 0
            ? <span style={{ color: T.creamMid }}>${business.deliveryFee} delivery</span>
            : <span style={{ color: T.success, fontWeight: 600 }}>Free Delivery</span>}
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 7, marginBottom: 28, flexWrap: "wrap" }}>
          {business.tags.map(tag => <span key={tag} style={{ background: T.glass, backdropFilter: "blur(8px)", color: T.creamMid, border: `1px solid ${T.glassBorder}`, borderRadius: 20, padding: "4px 13px", fontSize: 12, fontWeight: 600 }}>{tag}</span>)}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.borderMid}`, marginBottom: 26 }}>
          {[
            { id: "products", label: `Products (${bizProducts.length})` },
            { id: "services", label: `Services (${bizServices.length})` },
            { id: "reviews",  label: `Reviews (${reviewCount})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "transparent", border: "none",
              borderBottom: tab === t.id ? `2px solid ${T.gold}` : "2px solid transparent",
              color: tab === t.id ? T.gold : T.muted,
              padding: "12px 22px", cursor: "pointer",
              fontWeight: tab === t.id ? 700 : 500, fontSize: 14, marginBottom: -1,
              transition: "color 0.2s",
            }}>{t.label}</button>
          ))}
        </div>

        {tab === "products" && (
          bizProducts.length > 0
            ? <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(4,1fr)", gap: 16 }}>
                {bizProducts.map(p => <ProductCard key={p.id} product={p} onAddToCart={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />)}
              </div>
            : <p style={{ color: T.muted, padding: "24px 0" }}>No products listed yet.</p>
        )}
        {tab === "services" && (
          bizServices.length > 0
            ? <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 18 }}>
                {bizServices.map(svc => <ServiceCard key={svc.id} service={svc} onClick={() => { setSelectedService(svc); setPage("booking"); }} />)}
              </div>
            : <p style={{ color: T.muted, padding: "24px 0" }}>No services listed yet.</p>
        )}
        {tab === "reviews" && <ReviewsSection business={business} user={user} onAuthOpen={onAuthOpen} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRAND DIRECTORY PAGE
// ─────────────────────────────────────────────────────────────
function BrandDirectoryPage({ setPage, setSelectedBrand, brandPartners = BRAND_PARTNERS }) {
  const { isMobile, isTablet } = useBreakpoint();
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "24px 16px" : "36px 24px" }}>
      <button onClick={() => setPage("shop")} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 28, fontWeight: 700, fontSize: 14 }}>
        <ArrowLeft size={16} /> Back to Shop
      </button>

      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, color: T.cream, marginBottom: 6, letterSpacing: "-0.02em" }}>🌐 National Brand Partners</h1>
        <p style={{ color: T.creamMid, fontSize: 14 }}>Independent brands shipping specialty products directly to your door.</p>
      </div>

      {/* Fulfillment explainer */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 36 }}>
        {[
          { icon: "📦", title: "Ships to You",   desc: "Brand packs and ships from their location. Arrives in 2–7 days.", color: "#60A5FA", glow: "rgba(96,165,250,0.15)" },
          { icon: "🚀", title: "Dropship",        desc: "Order through Oshun, brand fulfills directly. Free shipping.",     color: T.success,   glow: "rgba(34,197,94,0.12)"  },
          { icon: "⚡", title: "Hub Delivery",    desc: "Coming soon — same-day on-demand from Oshun regional hubs.",       color: T.goldLight, glow: T.goldGlow               },
        ].map(f => (
          <div key={f.title} style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 16, padding: "18px 20px", boxShadow: `inset 0 0 40px ${f.glow}` }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, color: f.color, fontSize: 14, marginBottom: 5 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: T.creamMid, lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 18 }}>
        {brandPartners.map(b => <BrandCard key={b.id} brand={b} onClick={() => { setSelectedBrand(b); setPage("brand"); }} />)}
      </div>

      {/* Hub teaser */}
      <div style={{ marginTop: 40, background: `linear-gradient(135deg,${T.purpleDeep},#0D0D18)`, border: `1.5px dashed ${T.purple}55`, borderRadius: 18, padding: "24px 28px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ fontSize: 36 }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: T.cream, fontSize: 16, marginBottom: 5, letterSpacing: "-0.01em" }}>Hub Delivery — Coming Soon</div>
          <div style={{ color: T.creamMid, fontSize: 13, lineHeight: 1.6 }}>Brands ship inventory to Oshun regional hubs. Once stocked, their products become available for on-demand, same-day delivery — same speed as your local stores.</div>
        </div>
        <Btn variant="outline" style={{ padding: "10px 22px", whiteSpace: "nowrap" }}>Get Notified</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRAND STOREFRONT PAGE
// ─────────────────────────────────────────────────────────────
function BrandStorefrontPage({ brand, cart, setCart, setPage, brandProducts = BRAND_PRODUCTS }) {
  const { isMobile, isTablet } = useBreakpoint();
  if (!brand) return null;
  const products  = brandProducts.filter(p => p.brandId === brand.id);

  const addToCart = p => setCart(prev => {
    const ex = prev.find(i => i.id === p.id);
    return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
  });

  const fulfillColor = brand.fulfillmentType === "dropship" ? T.success : "#60A5FA";
  const fulfillLabel = brand.fulfillmentType === "dropship"
    ? `Fulfilled by ${brand.name} · Free shipping`
    : `Ships from ${brand.location} · ${brand.shippingDays} business days`;

  return (
    <div>
      {/* Hero cover */}
      <div style={{ height: isMobile ? 200 : 240, background: brand.gradient, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(3,3,5,0.65) 100%)" }} />
        <button onClick={() => setPage("brands")} style={{ position: "absolute", top: 18, left: 18, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 10, padding: "8px 16px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13, zIndex: 2 }}>
          <ArrowLeft size={15} /> Brand Partners
        </button>
        <span style={{ position: "absolute", top: 18, right: 18, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: `1px solid rgba(255,255,255,0.1)`, color: T.goldLight, fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 8, letterSpacing: "0.05em", zIndex: 2 }}>
          🌐 NATIONAL BRAND
        </span>
        <div style={{ position: "absolute", bottom: -28, left: 28, zIndex: 2 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "white", border: `2.5px solid rgba(255,255,255,0.25)`, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            {brand.initials}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "44px 16px 28px" : "48px 24px 32px" }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: T.cream, marginBottom: 5, letterSpacing: "-0.02em" }}>{brand.name}</h1>
        <p style={{ color: T.creamMid, marginBottom: 14, fontSize: 14, lineHeight: 1.6 }}>{brand.description}</p>

        {/* Meta row */}
        <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={13} fill={T.gold} color={T.gold} /> <span style={{ color: T.gold, fontWeight: 700 }}>{brand.rating}</span> <span style={{ color: T.muted }}>({brand.reviews})</span></span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.creamMid }}><MapPin size={13} /> {brand.location}</span>
        </div>

        {/* Fulfillment banner */}
        <div style={{ background: T.bgCard, border: `1px solid ${fulfillColor}33`, borderRadius: 14, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <FulfillmentBadge type={brand.fulfillmentType} shippingDays={brand.shippingDays} />
          <span style={{ fontSize: 13, color: T.creamMid }}>{fulfillLabel}</span>
          {brand.fulfillmentType === "dropship" && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: T.muted }}>Orders routed to brand via Oshun</span>
          )}
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 7, marginBottom: 32, flexWrap: "wrap" }}>
          {brand.tags.map(tag => <span key={tag} style={{ background: T.glass, backdropFilter: "blur(8px)", color: T.creamMid, border: `1px solid ${T.glassBorder}`, borderRadius: 20, padding: "4px 13px", fontSize: 12, fontWeight: 600 }}>{tag}</span>)}
        </div>

        {/* Products grid */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.cream, marginBottom: 18, letterSpacing: "-0.01em" }}>Products ({products.length})</h2>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 18 }}>
          {products.map(p => <BrandProductCard key={p.id} product={p} onAddToCart={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />)}
        </div>

        {/* Hub teaser */}
        <div style={{ marginTop: 40, background: `linear-gradient(135deg,${T.purpleDeep},#0D0D18)`, border: `1px dashed ${T.purple}55`, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 28 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: T.cream, fontSize: 14, marginBottom: 4 }}>Want {brand.name} available for same-day delivery?</div>
            <div style={{ color: T.creamMid, fontSize: 12, lineHeight: 1.6 }}>When {brand.name} ships inventory to the Oshun DC hub, their products become available for on-demand delivery — same speed as your local stores.</div>
          </div>
          <Btn variant="outline" style={{ padding: "9px 18px", fontSize: 12, whiteSpace: "nowrap" }}>Request Hub</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRAND DASHBOARD
// ─────────────────────────────────────────────────────────────
function BrandDashboard({ user, requestTab }) {
  const [tab, setTab] = useState("storefront");
  useEffect(() => { if (requestTab) setTab(requestTab); }, [requestTab]);

  // ── Orders (preserved) ───────────────────────────────────────
  const [orders, setOrders] = useState([
    { id:"BO-2201", customer:"Kezia L.",   city:"Washington, DC",  items:"24K Rosehip Face Oil ×1",       total:68.00,  status:"Pending",   time:"12 min ago", fulfillment:"ship"     },
    { id:"BO-2200", customer:"Priya S.",   city:"Chicago, IL",     items:"Blue Tansy Calming Serum ×1",   total:84.00,  status:"Shipped",   time:"1 hr ago",   fulfillment:"ship"     },
    { id:"BO-2199", customer:"Amara S.",   city:"Houston, TX",     items:"Squalane Body Elixir ×2",       total:104.00, status:"Shipped",   time:"3 hrs ago",  fulfillment:"ship"     },
    { id:"BO-2197", customer:"Jade W.",    city:"New York, NY",    items:"24K Rosehip Face Oil ×1",       total:68.00,  status:"Delivered", time:"Yesterday",  fulfillment:"ship"     },
    { id:"BO-2194", customer:"Nadia M.",   city:"Los Angeles, CA", items:"Hyperpigmentation Corrector ×1",total:58.00,  status:"Pending",   time:"22 min ago", fulfillment:"dropship" },
    { id:"BO-2193", customer:"Simone A.",  city:"Miami, FL",       items:"Melanin Glow Moisturizer ×1",   total:44.00,  status:"Shipped",   time:"2 hrs ago",  fulfillment:"dropship" },
  ]);

  const statusColor = { Pending:T.gold, Shipped:"#60A5FA", Delivered:T.success, Cancelled:T.error };
  const ORDER_FLOW  = ["Pending","Shipped","Delivered"];

  const advanceOrder = id => setOrders(prev => prev.map(o => {
    if (o.id !== id) return o;
    const idx  = ORDER_FLOW.indexOf(o.status);
    const next = ORDER_FLOW[Math.min(idx + 1, ORDER_FLOW.length - 1)];
    return { ...o, status: next };
  }));

  // ── Hub Request workflow state ───────────────────────────────
  const [hubModal, setHubModal] = useState(false);        // open/close
  const [hubStep,  setHubStep]  = useState(1);            // 1 = pick city, 2 = select products, 3 = confirm
  const [hubForm,  setHubForm]  = useState({
    city: "", business: "", products: [], notes: "",
  });
  const [hubSuccess, setHubSuccess] = useState(false);    // submitted

  const HUB_CITIES = [
    { city:"Washington, DC",  hubs:["Crown & Glory Beauty","Luxe Skin Studio","Bombshell Beauty Supply"] },
    { city:"Atlanta, GA",     hubs:["The Melanin Market","Gold Standard Beauty","Royale Beauty Bar"] },
    { city:"Chicago, IL",     hubs:["Bombshell Beauty Supply","South Side Glow Studio"] },
    { city:"Houston, TX",     hubs:["Luxe Skin Studio — Houston","The Glow Lab"] },
    { city:"Miami, FL",       hubs:["The Beauty Bar","Island Glow Studio"] },
  ];

  const submitHubRequest = () => {
    setHubStep(3);
    setTimeout(() => { setHubModal(false); setHubStep(1); setHubForm({ city:"", business:"", products:[], notes:"" }); setHubSuccess(true); setTimeout(() => setHubSuccess(false), 4000); }, 1400);
  };

  // ── Order Fulfillment workflow state ─────────────────────────
  const [fulfillOrder,  setFulfillOrder]  = useState(null);  // order being confirmed
  const [stockChecking, setStockChecking] = useState(false); // loading state
  const [stockResult,   setStockResult]   = useState(null);  // { sufficient: bool, items: [] }

  const openFulfillModal = (order) => {
    setFulfillOrder(order);
    setStockChecking(true);
    setStockResult(null);
    // Simulate stock check (1s delay)
    setTimeout(() => {
      // Parse "Product ×qty" from order.items string
      const lines = order.items.split(",").map(s => s.trim());
      const checked = lines.map(line => {
        const match = line.match(/^(.+?) ×(\d+)$/) || line.match(/^(.+?)$/);
        const name = match?.[1]?.trim() || line;
        const qty  = parseInt(match?.[2] || "1");
        const prod = products.find(p => p.name.toLowerCase().includes(name.toLowerCase().split(" ")[0]));
        return { name, qty, inStock: prod ? prod.stock : 0, sufficient: prod ? prod.stock >= qty : false };
      });
      setStockChecking(false);
      setStockResult({ sufficient: checked.every(i => i.sufficient), items: checked });
    }, 900);
  };

  const confirmFulfillment = () => {
    if (!fulfillOrder) return;
    advanceOrder(fulfillOrder.id);
    setFulfillOrder(null);
    setStockResult(null);
  };

  // ── Storefront state ─────────────────────────────────────────
  const [editingProfile, setEditingProfile] = useState(false);
  const [brandInfo, setBrandInfo] = useState({
    name:     "Melanin Magic Co.",
    tagline:  "Clean beauty formulated for melanin-rich skin",
    website:  "melaninmagic.com",
    category: "Skincare",
    founded:  "2021",
    hq:       "Atlanta, GA",
  });
  const [socialLinks, setSocialLinks] = useState({ ig:"@melaninmagicco", tiktok:"@melaninmagic", facebook:"" });
  const [socialModal, setSocialModal] = useState(null);
  const [socialInput,  setSocialInput]  = useState("");

  const ACTIVE_PLACEMENTS = [
    { id:1, hub:"Crown & Glory Beauty",   city:"Washington, DC", products:"24K Rosehip Face Oil, Blue Tansy Serum", monthly:840,  since:"Mar 2025", status:"Active"  },
    { id:2, hub:"Bombshell Beauty Supply",city:"Chicago, IL",    products:"Melanin Glow Moisturizer",               monthly:520,  since:"Jan 2025", status:"Active"  },
    { id:3, hub:"Luxe Skin Studio",       city:"Houston, TX",    products:"Hyperpigmentation Corrector",            monthly:390,  since:"Apr 2025", status:"Active"  },
    { id:4, hub:"Gold Standard Beauty",   city:"Atlanta, GA",    products:"Full product line (6 SKUs)",             monthly:1240, since:"Nov 2024", status:"Active"  },
    { id:5, hub:"The Beauty Bar",         city:"Miami, FL",      products:"Squalane Body Elixir",                   monthly:270,  since:"—",        status:"Pending" },
  ];

  // ── Products state ───────────────────────────────────────────
  const [products] = useState([
    { id:1, name:"24K Rosehip Face Oil",          sku:"MМ-RFO-1",  price:68,  stock:142, status:"Active"  },
    { id:2, name:"Blue Tansy Calming Serum",       sku:"MМ-BTS-1",  price:84,  stock:98,  status:"Active"  },
    { id:3, name:"Squalane Body Elixir",           sku:"MМ-SBE-2",  price:52,  stock:67,  status:"Active"  },
    { id:4, name:"Melanin Glow Moisturizer",       sku:"MМ-MGM-1",  price:44,  stock:211, status:"Active"  },
    { id:5, name:"Hyperpigmentation Corrector",    sku:"MМ-HPC-1",  price:58,  stock:33,  status:"Active"  },
    { id:6, name:"Vitamin C Brightening Mask",     sku:"MМ-VCM-1",  price:39,  stock:0,   status:"Out of Stock" },
  ]);

  // ── Analytics ────────────────────────────────────────────────
  const weekRev  = [1240, 1680, 1120, 2040, 1890, 2310, 1760];
  const weekDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const maxRev   = Math.max(...weekRev);

  const tabBtnStyle = active => ({
    padding:"10px 20px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
    background: active ? T.gold : T.bgCardAlt,
    color:      active ? T.bg   : T.creamMid,
    transition: "all 0.15s",
  });
  const inputStyle = {
    width:"100%", background:T.bgCardAlt, border:`1px solid ${T.borderMid}`,
    borderRadius:10, padding:"11px 14px", color:T.cream, fontSize:13, outline:"none",
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.cream }}>
      {/* Social modal */}
      {socialModal && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:20, padding:"32px 28px", maxWidth:420, width:"100%", position:"relative" }}>
            <button onClick={() => { setSocialModal(null); setSocialInput(""); }} style={{ position:"absolute", top:14, right:14, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:8, width:30, height:30, cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", justifyContent:"center" }}><X size={14}/></button>
            <div style={{ fontSize:28, marginBottom:8 }}>{socialModal==="ig"?"📸":socialModal==="tiktok"?"🎵":"👥"}</div>
            <h3 style={{ fontSize:18, fontWeight:800, color:T.cream, marginBottom:16 }}>
              Update {socialModal==="ig"?"Instagram":socialModal==="tiktok"?"TikTok":"Facebook"}
            </h3>
            <label style={{ fontSize:12, fontWeight:600, color:T.creamMid, marginBottom:5, display:"block" }}>@Username / Page URL</label>
            <input value={socialInput} onChange={e => setSocialInput(e.target.value)} style={{ ...inputStyle, marginBottom:20 }} placeholder="@yourbrand"/>
            <Btn style={{ width:"100%", padding:13 }} onClick={() => { setSocialLinks(p=>({...p,[socialModal]:socialInput})); setSocialModal(null); setSocialInput(""); }}>Save</Btn>
          </div>
        </div>
      )}

      {/* ── Hub Request Modal ── */}
      {hubModal && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:24, padding:"32px 28px", maxWidth:520, width:"100%", position:"relative", boxShadow:`0 24px 80px rgba(0,0,0,0.7)` }}>
            <button onClick={() => { setHubModal(false); setHubStep(1); }} style={{ position:"absolute", top:14, right:14, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:8, width:30, height:30, cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", justifyContent:"center" }}><X size={14}/></button>

            {/* Step indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
              {["Select City","Choose Products","Confirm"].map((label, i) => (
                <React.Fragment key={label}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background: hubStep > i+1 ? T.success : hubStep === i+1 ? T.purple : T.bgCardAlt, border:`1.5px solid ${hubStep >= i+1 ? (hubStep > i+1 ? T.success : T.purple) : T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color: hubStep >= i+1 ? "#fff" : T.muted }}>
                      {hubStep > i+1 ? "✓" : i+1}
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color: hubStep === i+1 ? T.cream : T.muted }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ flex:1, height:1, background:T.borderMid }}/>}
                </React.Fragment>
              ))}
            </div>

            {hubStep === 1 && (
              <div>
                <h3 style={{ fontSize:18, fontWeight:800, color:T.cream, marginBottom:6 }}>Request a New Hub Placement</h3>
                <p style={{ fontSize:13, color:T.creamMid, marginBottom:20, lineHeight:1.5 }}>Choose a city and partner location where you'd like your products stocked for same-day delivery.</p>
                <label style={{ fontSize:12, fontWeight:700, color:T.creamMid, marginBottom:8, display:"block", textTransform:"uppercase", letterSpacing:"0.06em" }}>Target City</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                  {HUB_CITIES.map(({ city }) => (
                    <button key={city} onClick={() => setHubForm(p => ({ ...p, city, business:"" }))} style={{ padding:"12px 14px", borderRadius:12, border:`1.5px solid ${hubForm.city===city?T.purple:T.borderMid}`, background: hubForm.city===city?`${T.purpleDeep}`:T.bgCardAlt, color: hubForm.city===city?T.cream:T.creamMid, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                      {city}
                    </button>
                  ))}
                </div>
                {hubForm.city && (
                  <>
                    <label style={{ fontSize:12, fontWeight:700, color:T.creamMid, marginBottom:8, display:"block", textTransform:"uppercase", letterSpacing:"0.06em" }}>Partner Hub</label>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
                      {HUB_CITIES.find(h => h.city === hubForm.city)?.hubs.map(hub => (
                        <button key={hub} onClick={() => setHubForm(p => ({ ...p, business:hub }))} style={{ padding:"12px 16px", borderRadius:12, border:`1.5px solid ${hubForm.business===hub?T.purple:T.borderMid}`, background: hubForm.business===hub?`${T.purpleDeep}`:T.bgCardAlt, color: hubForm.business===hub?T.cream:T.creamMid, fontSize:13, fontWeight:500, cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                          {hub}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <Btn style={{ width:"100%", padding:13 }} onClick={() => hubForm.city && hubForm.business && setHubStep(2)}>
                  Continue →
                </Btn>
              </div>
            )}

            {hubStep === 2 && (
              <div>
                <h3 style={{ fontSize:18, fontWeight:800, color:T.cream, marginBottom:6 }}>Select Products for {hubForm.business}</h3>
                <p style={{ fontSize:13, color:T.creamMid, marginBottom:20, lineHeight:1.5 }}>Choose which of your SKUs to stock at this location. You'll ship the initial batch to the hub.</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
                  {products.filter(p => p.status === "Active").map(prod => {
                    const selected = hubForm.products.includes(prod.id);
                    return (
                      <button key={prod.id} onClick={() => setHubForm(p => ({ ...p, products: selected ? p.products.filter(x => x !== prod.id) : [...p.products, prod.id] }))} style={{ padding:"12px 16px", borderRadius:12, border:`1.5px solid ${selected?T.purple:T.borderMid}`, background: selected?`${T.purpleDeep}`:T.bgCardAlt, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
                        <div style={{ textAlign:"left" }}>
                          <div style={{ fontSize:13, fontWeight:600, color:T.cream }}>{prod.name}</div>
                          <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>SKU: {prod.sku}  ·  ${prod.price}  ·  {prod.stock} in stock</div>
                        </div>
                        <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${selected?T.purple:T.borderMid}`, background:selected?T.purple:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {selected && <span style={{ color:"#fff", fontSize:12 }}>✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:T.creamMid, marginBottom:6, display:"block", textTransform:"uppercase", letterSpacing:"0.06em" }}>Notes (optional)</label>
                  <textarea value={hubForm.notes} onChange={e => setHubForm(p=>({...p,notes:e.target.value}))} rows={2} style={{ width:"100%", padding:"11px 14px", borderRadius:12, border:`1.5px solid ${T.borderMid}`, background:T.bgCardAlt, color:T.cream, fontSize:13, outline:"none", fontFamily:"inherit", resize:"none", boxSizing:"border-box" }} placeholder="Any special instructions for the hub team…"/>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setHubStep(1)} style={{ flex:1, padding:13, borderRadius:12, border:`1px solid ${T.borderMid}`, background:T.bgCardAlt, color:T.creamMid, fontSize:13, fontWeight:600, cursor:"pointer" }}>← Back</button>
                  <Btn style={{ flex:2, padding:13 }} onClick={() => hubForm.products.length > 0 && submitHubRequest()}>
                    {hubStep === 3 ? "Submitting…" : `Submit Request (${hubForm.products.length} SKU${hubForm.products.length !== 1 ? "s" : ""})`}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Hub Request Success Toast ── */}
      {hubSuccess && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:1100, background:T.success, color:"#fff", padding:"14px 28px", borderRadius:16, fontSize:14, fontWeight:700, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", display:"flex", alignItems:"center", gap:10 }}>
          ✓ Hub request submitted — Oshun team will review within 48 hrs
        </div>
      )}

      {/* ── Order Fulfillment Modal ── */}
      {fulfillOrder && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:24, padding:"32px 28px", maxWidth:460, width:"100%", position:"relative", boxShadow:`0 24px 80px rgba(0,0,0,0.7)` }}>
            <button onClick={() => { setFulfillOrder(null); setStockResult(null); }} style={{ position:"absolute", top:14, right:14, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:8, width:30, height:30, cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", justifyContent:"center" }}><X size={14}/></button>

            <div style={{ fontSize:20, marginBottom:4 }}>📦</div>
            <h3 style={{ fontSize:18, fontWeight:800, color:T.cream, marginBottom:4 }}>Fulfill Order {fulfillOrder.id}</h3>
            <p style={{ fontSize:13, color:T.creamMid, marginBottom:20 }}>{fulfillOrder.customer} · {fulfillOrder.city} · <span style={{ color:T.gold }}>${fulfillOrder.total.toFixed(2)}</span></p>

            {/* Items */}
            <div style={{ background:T.bgCardAlt, borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Order Items</div>
              <div style={{ fontSize:13, color:T.cream }}>{fulfillOrder.items}</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:6 }}>{fulfillOrder.fulfillment === "ship" ? "🚚 Customer shipping — you pack & ship" : "📦 Dropship — Oshun routes to your fulfillment"}</div>
            </div>

            {/* Stock check */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.creamMid, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Stock Verification</div>
              {stockChecking && (
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:T.bgCardAlt, borderRadius:12 }}>
                  <div style={{ width:18, height:18, border:`3px solid ${T.purple}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }}/>
                  <span style={{ fontSize:13, color:T.creamMid }}>Checking inventory levels…</span>
                </div>
              )}
              {!stockChecking && stockResult && stockResult.items.map((item, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background: item.sufficient ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)", border:`1px solid ${item.sufficient ? T.success : T.error}33`, borderRadius:10, marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:13, color:T.cream, fontWeight:600 }}>{item.name}</div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Ordered: {item.qty}  ·  In stock: {item.inStock}</div>
                  </div>
                  <span style={{ fontSize:18 }}>{item.sufficient ? "✅" : "❌"}</span>
                </div>
              ))}
              {!stockChecking && stockResult && !stockResult.sufficient && (
                <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:`1px solid ${T.error}44`, borderRadius:10, fontSize:12, color:T.error, marginTop:4 }}>
                  ⚠  Insufficient stock for one or more items. Fulfill when restocked, or contact the customer.
                </div>
              )}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setFulfillOrder(null); setStockResult(null); }} style={{ flex:1, padding:13, borderRadius:12, border:`1px solid ${T.borderMid}`, background:T.bgCardAlt, color:T.creamMid, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <Btn style={{ flex:2, padding:13, opacity: (!stockResult || !stockResult.sufficient || stockChecking) ? 0.45 : 1 }}
                onClick={() => stockResult?.sufficient && confirmFulfillment()}>
                {stockChecking ? "Checking…" : stockResult?.sufficient ? "✓ Confirm & Mark Shipped" : "Insufficient Stock"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:T.bgCard, borderBottom:`1px solid ${T.borderMid}`, padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.purple, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:3 }}>Brand Hub</div>
          <h2 style={{ fontSize:20, fontWeight:900, color:T.cream, letterSpacing:"-0.02em" }}>{brandInfo.name}</h2>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[
            { key:"storefront", label:"🏬 Storefront" },
            { key:"orders",     label:"🧾 Orders"     },
            { key:"analytics",  label:"📊 Analytics"  },
            { key:"products",   label:"🧴 Products"   },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tabBtnStyle(tab===t.key)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"28px 20px" }}>

        {/* ═══════════════ STOREFRONT ═══════════════ */}
        {tab === "storefront" && (
          <div>
            {/* Brand hero */}
            <div style={{ background:`linear-gradient(135deg, ${T.bgCardAlt} 0%, #0a0a1a 100%)`, border:`1px solid ${T.borderMid}`, borderRadius:20, padding:"28px 28px 24px", marginBottom:24, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:T.purpleGlow, filter:"blur(40px)" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
                <div style={{ width:64, height:64, borderRadius:16, background:`linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:900, color:"#fff", flexShrink:0 }}>
                  MM
                </div>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
                    <h3 style={{ fontSize:20, fontWeight:900, color:T.cream, margin:0 }}>{brandInfo.name}</h3>
                    <span style={{ fontSize:11, fontWeight:700, color:T.purple, background:"rgba(107,107,158,0.12)", border:"1px solid rgba(107,107,158,0.3)", padding:"2px 10px", borderRadius:20 }}>● Verified Brand</span>
                  </div>
                  <p style={{ fontSize:13, color:T.creamMid, margin:0 }}>{brandInfo.tagline}</p>
                </div>
                <Btn variant="outline" style={{ padding:"9px 18px", fontSize:12 }} onClick={() => setEditingProfile(!editingProfile)}>
                  <Edit3 size={13}/> {editingProfile ? "Save" : "Edit Profile"}
                </Btn>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:20, marginBottom:24 }}>
              {/* Brand details */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:18 }}>Brand Details</div>
                {[
                  { key:"website",  label:"Website",  icon:"🌐" },
                  { key:"category", label:"Category", icon:"🏷️" },
                  { key:"founded",  label:"Founded",  icon:"📅" },
                  { key:"hq",       label:"HQ City",  icon:"📍" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, color:T.muted, marginBottom:3 }}>{f.icon} {f.label}</div>
                    {editingProfile ? (
                      <input value={brandInfo[f.key]} onChange={e => setBrandInfo(p=>({...p,[f.key]:e.target.value}))} style={{ ...inputStyle, fontSize:12, padding:"8px 12px" }}/>
                    ) : (
                      <div style={{ fontSize:13, color:T.cream }}>{brandInfo[f.key]}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:18 }}>Social & Web Links</div>
                {[
                  { key:"ig",       label:"Instagram",  icon:"📸", color:"#E1306C" },
                  { key:"tiktok",   label:"TikTok",     icon:"🎵", color:"#00F7EF" },
                  { key:"facebook", label:"Facebook",   icon:"👥", color:"#1877F2" },
                ].map(s => (
                  <div key={s.key} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{s.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.cream }}>{s.label}</div>
                      <div style={{ fontSize:11, color: socialLinks[s.key]?s.color:T.muted }}>{socialLinks[s.key] || "Not connected"}</div>
                    </div>
                    <button onClick={() => { setSocialModal(s.key); setSocialInput(socialLinks[s.key]||""); }}
                      style={{ background:socialLinks[s.key]?T.bgCardAlt:"rgba(107,107,158,0.1)", border:`1px solid ${socialLinks[s.key]?T.borderMid:T.purple}`, borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:socialLinks[s.key]?T.creamMid:T.purple, cursor:"pointer" }}>
                      {socialLinks[s.key] ? "Edit" : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Oshun placements */}
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.cream }}>Active Oshun Placements</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>Your products currently stocked at partner business hubs</div>
                </div>
                <Btn variant="outline" style={{ padding:"7px 14px", fontSize:11 }} onClick={() => setHubModal(true)}>+ Request Hub</Btn>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${T.borderMid}` }}>
                      {["Hub / Store","City","Products","Monthly Rev","Since","Status"].map(h => (
                        <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:11, fontWeight:700, color:T.muted, whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ACTIVE_PLACEMENTS.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: i < ACTIVE_PLACEMENTS.length-1 ? `1px solid ${T.border}` : "none" }}>
                        <td style={{ padding:"12px 12px", color:T.cream, fontWeight:600, whiteSpace:"nowrap" }}>{p.hub}</td>
                        <td style={{ padding:"12px 12px", color:T.creamMid, whiteSpace:"nowrap" }}>{p.city}</td>
                        <td style={{ padding:"12px 12px", color:T.creamMid, maxWidth:200 }}>{p.products}</td>
                        <td style={{ padding:"12px 12px", color:T.gold, fontWeight:700, whiteSpace:"nowrap" }}>${p.monthly.toLocaleString()}</td>
                        <td style={{ padding:"12px 12px", color:T.muted, whiteSpace:"nowrap" }}>{p.since}</td>
                        <td style={{ padding:"12px 12px" }}>
                          <span style={{ fontSize:10, fontWeight:700, color: p.status==="Active"?T.success:T.gold, background: p.status==="Active"?"rgba(34,197,94,0.1)":"rgba(0,207,196,0.1)", padding:"3px 10px", borderRadius:20 }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ ORDERS ═══════════════ */}
        {tab === "orders" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:16 }}>
            {orders.map(order => {
              const idx  = ORDER_FLOW.indexOf(order.status);
              const done = order.status === "Delivered";
              return (
                <div key={order.id} style={{ background:T.bgCard, border:`1px solid ${done?T.borderMid:T.borderGlow}`, borderRadius:16, padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:T.cream }}>{order.id}</div>
                      <div style={{ fontSize:12, color:T.creamMid }}>{order.customer} · {order.city}</div>
                      <div style={{ fontSize:11, color:T.muted }}>{order.time}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:statusColor[order.status], background:`${statusColor[order.status]}18`, border:`1px solid ${statusColor[order.status]}33`, padding:"3px 10px", borderRadius:20, height:"fit-content" }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{ fontSize:12, color:T.creamMid, marginBottom:4 }}>{order.items}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:T.gold }}>${order.total.toFixed(2)}</span>
                    <span style={{ fontSize:11, color:T.muted, background:T.bgCardAlt, padding:"2px 8px", borderRadius:8 }}>
                      {order.fulfillment === "ship" ? "🚚 Ship" : "📦 Dropship"}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:4, marginBottom:12 }}>
                    {ORDER_FLOW.map((s, i) => (
                      <div key={s} style={{ flex:1, height:3, borderRadius:4, background: i<=idx?T.purple:T.borderMid, transition:"background 0.3s" }}/>
                    ))}
                  </div>
                  {!done && order.status === "Pending" && (
                    <Btn style={{ width:"100%", padding:"9px", fontSize:12 }} onClick={() => openFulfillModal(order)}>
                      🔍 Verify Stock & Fulfill
                    </Btn>
                  )}
                  {!done && order.status === "Shipped" && (
                    <Btn style={{ width:"100%", padding:"9px", fontSize:12 }} onClick={() => advanceOrder(order.id)}>
                      ✓ Mark as Delivered
                    </Btn>
                  )}
                  {done && <div style={{ fontSize:12, color:T.success, fontWeight:700, textAlign:"center" }}>✓ Delivered</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════ ANALYTICS ═══════════════ */}
        {tab === "analytics" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(170px,1fr))", gap:16, marginBottom:24 }}>
              {[
                { label:"Revenue (7d)",    value:"$12,060", delta:"+23%", icon:"💰" },
                { label:"Orders (7d)",     value:"138",     delta:"+17%", icon:"📦" },
                { label:"Active Hubs",     value:"4",       delta:"",     icon:"🏪" },
                { label:"Avg Order Value", value:"$87.39",  delta:"+9%",  icon:"📈" },
              ].map(s => (
                <div key={s.label} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:20 }}>
                  <div style={{ fontSize:20, marginBottom:10 }}>{s.icon}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:T.cream, letterSpacing:"-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{s.label}</div>
                  {s.delta && <div style={{ fontSize:11, fontWeight:700, color:T.success, marginTop:6 }}>{s.delta}</div>}
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:20 }}>
              {/* Revenue chart */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:20 }}>Weekly Revenue by Hub</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:140 }}>
                  {weekRev.map((v, i) => (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                      <div style={{ fontSize:9, color:T.muted }}>${(v/1000).toFixed(1)}k</div>
                      <div style={{ width:"100%", borderRadius:"4px 4px 0 0", background:`linear-gradient(180deg, ${T.purple}, ${T.purpleDark})`, height:`${(v/maxRev)*110}px`, transition:"height 0.4s" }}/>
                      <div style={{ fontSize:10, color:T.muted }}>{weekDays[i]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top products */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:16 }}>Revenue by Product</div>
                {[
                  { name:"24K Rosehip Face Oil",     pct:35, rev:4221 },
                  { name:"Blue Tansy Serum",          pct:27, rev:3256 },
                  { name:"Melanin Glow Moisturizer",  pct:19, rev:2291 },
                  { name:"Hyperpigmentation Corrector",pct:13,rev:1568 },
                  { name:"Squalane Body Elixir",      pct:6,  rev:724  },
                ].map(p => (
                  <div key={p.name} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:12, color:T.cream }}>{p.name}</span>
                      <span style={{ fontSize:12, color:T.gold, fontWeight:700 }}>${p.rev.toLocaleString()}</span>
                    </div>
                    <div style={{ background:T.borderMid, borderRadius:4, height:5, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${p.pct}%`, background:`linear-gradient(90deg, ${T.purple}, #9B8BC4)`, borderRadius:4 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ PRODUCTS ═══════════════ */}
        {tab === "products" && (
          <div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
              <Btn style={{ padding:"10px 20px", fontSize:13 }}>+ Add Product</Btn>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:16 }}>
              {products.map(p => (
                <div key={p.id} style={{ background:T.bgCard, border:`1px solid ${p.status==="Out of Stock"?"rgba(239,68,68,0.3)":T.borderMid}`, borderRadius:16, padding:20 }} className="oshun-card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg, ${T.purple}33, ${T.purpleDark}33)`, border:`1px solid ${T.purple}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🧴</div>
                    <span style={{ fontSize:10, fontWeight:700, color: p.status==="Active"?T.success:T.error, background: p.status==="Active"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", padding:"3px 10px", borderRadius:20 }}>
                      {p.status}
                    </span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:4, lineHeight:1.3 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:T.muted, marginBottom:12 }}>SKU: {p.sku}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:16, fontWeight:900, color:T.gold }}>${p.price}</span>
                    <span style={{ fontSize:12, color: p.stock < 20 ? T.error : T.creamMid }}>
                      {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// CART PAGE
// ─────────────────────────────────────────────────────────────
function CartPage({ cart, setCart, setPage }) {
  const { isMobile } = useBreakpoint();
  const subtotal    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = cart.length > 0 ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE) : 0;
  const total       = subtotal + deliveryFee;

  const updateQty = (id, delta) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "24px 16px" : "36px 24px" }}>
      <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: T.cream, marginBottom: 20, letterSpacing: "-0.02em" }}>Your Cart</h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: 64, marginBottom: 18 }}>🛒</div>
          <h3 style={{ color: T.cream, fontWeight: 800, marginBottom: 8 }}>Your cart is empty</h3>
          <p style={{ color: T.muted, marginBottom: 28 }}>Browse products and services to get started.</p>
          <Btn onClick={() => setPage("shop")} style={{ padding: "13px 28px", fontSize: 15 }}>Start Shopping</Btn>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 24 }}>
          <div>
            {/* Free delivery progress */}
            {subtotal < FREE_DELIVERY_THRESHOLD ? (
              <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 14, padding: "14px 18px", marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 10 }}>
                  <span style={{ color: T.creamMid }}>Add <strong style={{ color: T.gold }}>${(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)}</strong> more for free delivery</span>
                  <span style={{ color: T.muted }}>${subtotal.toFixed(2)} / $40</span>
                </div>
                <div style={{ height: 6, background: T.bgCardAlt, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(subtotal / FREE_DELIVERY_THRESHOLD * 100, 100)}%`, height: "100%", background: `linear-gradient(90deg,${T.gold},${T.goldLight})`, borderRadius: 3, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(34,197,94,0.08)", border: `1px solid ${T.success}44`, borderRadius: 14, padding: "12px 18px", marginBottom: 18, fontSize: 13, color: T.success, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={16} /> Free delivery unlocked!
              </div>
            )}

            {/* Cart items */}
            {cart.map(item => (
              <div key={item.id} style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 16, padding: "16px 18px", marginBottom: 12, display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 13, background: item.gradient, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 100%)" }} />
                  {item.fulfillmentType && item.fulfillmentType !== "local" && (
                    <span style={{ position: "absolute", bottom: -4, right: -4, fontSize: 16 }}>{item.fulfillmentType === "dropship" ? "🚀" : "📦"}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{item.brand}</div>
                  <div style={{ fontWeight: 700, color: T.cream, marginBottom: 4, fontSize: 14, lineHeight: 1.3 }}>{item.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, color: T.gold, fontSize: 15 }}>${item.price.toFixed(2)}</span>
                    {item.fulfillmentType && item.fulfillmentType !== "local" && (
                      <span style={{ fontSize: 10, color: T.creamMid, background: T.bgCardAlt, borderRadius: 4, padding: "1px 6px" }}>Ships {item.shippingDays}d</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ background: T.bgCardAlt, border: `1px solid ${T.borderMid}`, borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: T.cream, display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={13} /></button>
                  <span style={{ color: T.cream, fontWeight: 800, width: 22, textAlign: "center", fontSize: 15 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ background: T.bgCardAlt, border: `1px solid ${T.borderMid}`, borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: T.cream, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={13} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary panel */}
          <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 20, padding: 22, height: "fit-content" }}>
            <h3 style={{ color: T.cream, fontWeight: 800, fontSize: 16, marginBottom: 20, letterSpacing: "-0.01em" }}>Order Summary</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: T.creamMid }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: deliveryFee === 0 ? T.success : T.creamMid }}>
              <span>Delivery</span>
              <span style={{ fontWeight: deliveryFee === 0 ? 700 : 400 }}>{deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}</span>
            </div>
            <div style={{ height: 1, background: T.borderMid, margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontWeight: 800, fontSize: 17 }}>
              <span style={{ color: T.cream }}>Total</span>
              <span style={{ color: T.gold }}>${total.toFixed(2)}</span>
            </div>
            <div style={{ background: T.bgCardAlt, borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: T.creamMid, display: "flex", alignItems: "center", gap: 8 }}>
              <Truck size={13} color={T.gold} /> Estimated: 25–40 min
            </div>
            <Btn onClick={() => setPage("checkout")} style={{ width: "100%", padding: "14px", fontSize: 15 }}>Proceed to Checkout</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHECKOUT PAGE
// ─────────────────────────────────────────────────────────────
function CheckoutPage({ cart, setCart, setPage, setActiveOrder }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", address: "", apt: "", city: "", zip: "" });

  // Split cart into fulfillment groups
  const localItems    = cart.filter(i => !i.fulfillmentType || i.fulfillmentType === "local" || i.fulfillmentType === "warehouse");
  const shippedItems  = cart.filter(i => i.fulfillmentType === "ship");
  const dropshipItems = cart.filter(i => i.fulfillmentType === "dropship");
  const hasLocal      = localItems.length > 0;
  const hasShipped    = shippedItems.length > 0 || dropshipItems.length > 0;

  const localSubtotal    = localItems.reduce((s, i) => s + i.price * i.qty, 0);
  const shippedSubtotal  = [...shippedItems, ...dropshipItems].reduce((s, i) => s + i.price * i.qty, 0);
  const localSubtotalCheck = localItems.reduce((s, i) => s + i.price * i.qty, 0);
  const localDelivery    = hasLocal ? (localSubtotalCheck >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE) : 0;
  const shippingFee      = shippedItems.reduce((s, i) => {
    const bp = BRAND_PARTNERS.find(b => b.id === i.brandId);
    return s + (bp?.shippingFee || 0);
  }, 0);
  const dropshipFee      = 0; // always free for dropship
  const total            = localSubtotal + shippedSubtotal + localDelivery + shippingFee;

  const placeOrder = () => {
    if (hasLocal) {
      const orderId = `OSH-${4826 + Math.floor(Math.random() * 10)}`;
      setActiveOrder({ id: orderId, items: localItems, total: localSubtotal + localDelivery, eta: 32, startStatus: 0, address: `${form.address}, ${form.city}` });
    }
    // Shipped / dropship orders are routed to brand fulfillment (stub)
    if (hasShipped) {
      console.log("[Oshun Fulfillment] Routing shipped/dropship items to brand partners:", [...shippedItems, ...dropshipItems].map(i => i.name));
    }
    setCart([]);
    setPage(hasLocal ? "tracking" : "home");
  };

  const field = (key, label, span) => (
    <Input key={key} placeholder={label} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ gridColumn: span ? "1 / -1" : undefined }} />
  );

  // Fulfillment group row in sidebar
  const FulfillmentGroup = ({ label, items, fee, feeLabel, badgeType, shippingDays }) => items.length === 0 ? null : (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <FulfillmentBadge type={badgeType} shippingDays={shippingDays} />
      </div>
      {items.map(item => (
        <div key={item.id} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"center" }}>
          <div style={{ width:32, height:32, borderRadius:7, background:item.gradient, flexShrink:0 }} />
          <div style={{ flex:1, fontSize:11 }}>
            <div style={{ color:T.cream, fontWeight:600, lineHeight:1.3 }}>{item.name}</div>
            <div style={{ color:T.muted }}>×{item.qty}</div>
          </div>
          <span style={{ color:T.gold, fontWeight:700, fontSize:11 }}>${(item.price * item.qty).toFixed(2)}</span>
        </div>
      ))}
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.muted, paddingTop:6, borderTop:`1px solid ${T.borderMid}` }}>
        <span>{feeLabel}</span><span style={{ color: fee === 0 ? T.success : T.creamMid }}>{fee === 0 ? "FREE" : `$${fee.toFixed(2)}`}</span>
      </div>
    </div>
  );

  const { isMobile } = useBreakpoint();
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: isMobile ? "24px 16px" : "36px 24px" }}>
      <button onClick={() => setPage("cart")} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 28, fontWeight: 700, fontSize: 14 }}>
        <ArrowLeft size={16} /> Back to Cart
      </button>
      <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: T.cream, marginBottom: 30, letterSpacing: "-0.02em" }}>Checkout</h1>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 24 }}>
        <div>
          {step === 1 && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <h3 style={{ color: T.cream, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 16 }}>
                <Truck size={17} color={T.gold} /> {hasLocal ? "Delivery" : "Shipping"} Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {field("name", "Full Name", false)}
                {field("email", "Email address", false)}
                {field("address", "Street Address", true)}
                {field("apt", "Apt / Suite (optional)", false)}
                {field("city", "City", false)}
                {field("zip", "ZIP Code", false)}
              </div>
              <Btn onClick={() => setStep(2)} style={{ marginTop: 22, padding: "13px 24px", fontSize: 15 }}>Continue to Payment</Btn>
            </div>
          )}
          {step === 2 && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <h3 style={{ color: T.cream, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 16 }}>
                <CreditCard size={17} color={T.gold} /> Payment Details
                <span style={{ marginLeft: "auto", fontSize: 10, background: T.purpleDeep, color: T.gold, padding: "3px 10px", borderRadius: 8, border: `1px solid ${T.purple}33`, letterSpacing: "0.03em" }}>🔒 Secured by Stripe</span>
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                <Input placeholder="Cardholder name" value="" onChange={() => {}} />
                <Input placeholder="Card number"     value="" onChange={() => {}} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input placeholder="MM / YY" value="" onChange={() => {}} />
                  <Input placeholder="CVC"     value="" onChange={() => {}} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <Btn onClick={() => setStep(1)} variant="outline">Back</Btn>
                <Btn onClick={placeOrder} style={{ flex: 1, padding: "14px", fontSize: 15 }}>Place Order — ${total.toFixed(2)}</Btn>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 20, padding: 22, height: "fit-content" }}>
          <h3 style={{ color: T.cream, fontWeight: 800, fontSize: 15, marginBottom: 18, letterSpacing: "-0.01em" }}>Order Summary</h3>

          <FulfillmentGroup label="Local" items={localItems}    fee={localDelivery}  feeLabel="On-demand delivery" badgeType="local"     shippingDays="—" />
          {localItems.length > 0 && (shippedItems.length > 0 || dropshipItems.length > 0) && <div style={{ height: 1, background: T.borderMid, margin: "14px 0" }} />}
          <FulfillmentGroup label="Ship"  items={shippedItems}  fee={shippingFee}    feeLabel="Shipping fee"       badgeType="ship"      shippingDays="3-5" />
          <FulfillmentGroup label="Drop"  items={dropshipItems} fee={dropshipFee}    feeLabel="Dropship shipping"  badgeType="dropship"  shippingDays="5-7" />

          <div style={{ height: 1, background: T.borderMid, margin: "14px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}>
            <span style={{ color: T.cream }}>Total</span>
            <span style={{ color: T.gold }}>${total.toFixed(2)}</span>
          </div>

          {hasLocal && hasShipped && (
            <div style={{ marginTop: 14, background: T.bgCardAlt, border: `1px solid ${T.borderMid}`, borderRadius: 10, padding: "11px 14px", fontSize: 11, color: T.creamMid, lineHeight: 1.6 }}>
              ℹ️ Mixed cart: local items deliver in 25–40 min, shipped items route directly to the brand.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONSUMER PROFILE
// ─────────────────────────────────────────────────────────────
function ProfilePage({ user, setPage }) {
  const orders = [
    { id: "#OS-1042", date: "Apr 9, 2026",  items: "Curl Defining Gel, Rosemary Mint Oil", total: 37.98, status: "Delivered" },
    { id: "#OS-1031", date: "Apr 3, 2026",  items: "Pro Filt'r Foundation",               total: 40.00, status: "Delivered" },
    { id: "#OS-1028", date: "Mar 28, 2026", items: "Black Girl Sunscreen x2",             total: 37.98, status: "Delivered" },
  ];
  const bookings = [
    { id: "#BK-221", service: "Silk Press",        provider: "Crown & Glory Beauty", date: "Apr 14, 2026", time: "11:00 AM", price: 110 },
    { id: "#BK-198", service: "Full Set Acrylics", provider: "Polished By Design",   date: "Apr 19, 2026", time: "2:00 PM",  price: 65  },
  ];
  const savedStores = BUSINESSES.slice(0, 3);

  const [subscribed, setSubscribed] = useState(false);
  const [tab, setTab] = useState("orders");

  // Simulate member since date — in production this comes from user object
  const memberSince   = "January 2026";
  const memberMonths  = 3;
  const rewardPoints  = 1240;
  const rewardTier    = rewardPoints >= 1000 ? "Gold" : rewardPoints >= 500 ? "Silver" : "Bronze";
  const tierColor     = rewardTier === "Gold" ? T.gold : rewardTier === "Silver" ? T.creamMid : "#CD7F32";

  const { isMobile } = useBreakpoint();
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "24px 16px" : "36px 24px" }}>

      {/* ── Profile Header ── */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 22, padding: "26px 26px 22px", marginBottom: 20 }}>
        <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
          {/* Avatar with gold glow */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:900, color:"#ffffff", boxShadow:`0 0 24px ${T.goldGlow}` }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div style={{ position:"absolute", bottom:-2, right:-2, width:20, height:20, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.goldDark})`, border:`2px solid ${T.bg}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>✦</div>
          </div>
          {/* Name + email */}
          <div style={{ flex:1, minWidth:150 }}>
            <div style={{ fontWeight:900, fontSize:22, color:T.cream, letterSpacing:"-0.02em" }}>{user?.name || "Guest"}</div>
            <div style={{ color:T.muted, fontSize:13, marginTop:3 }}>{user?.email || "—"}</div>
          </div>
          <Btn onClick={() => {}} variant="ghost" style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", flexShrink:0 }}><Edit3 size={14} /> Edit</Btn>
        </div>

        {/* Member badge row */}
        <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, background:`linear-gradient(135deg,${T.gold}14,${T.gold}08)`, border:`1px solid ${T.gold}33`, borderRadius:10, padding:"7px 14px" }}>
            <span style={{ fontSize:14 }}>⭐</span>
            <div>
              <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:"0.04em" }}>MEMBER SINCE</div>
              <div style={{ fontSize:12, color:T.goldLight, fontWeight:700 }}>{memberSince}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, background:`${tierColor}10`, border:`1px solid ${tierColor}33`, borderRadius:10, padding:"7px 14px" }}>
            <span style={{ fontSize:14 }}>🏆</span>
            <div>
              <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:"0.04em" }}>REWARD TIER</div>
              <div style={{ fontSize:12, color:tierColor, fontWeight:700 }}>{rewardTier} Member · {memberMonths} months</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, background:`${T.purple}10`, border:`1px solid ${T.purple}33`, borderRadius:10, padding:"7px 14px" }}>
            <span style={{ fontSize:14 }}>💎</span>
            <div>
              <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:"0.04em" }}>POINTS</div>
              <div style={{ fontSize:12, color:T.purple, fontWeight:700 }}>{rewardPoints.toLocaleString()} pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Oshun Black Upsell ── */}
      {!subscribed ? (
        <div style={{ background:`linear-gradient(135deg,${T.purpleDeep},#0D0D18)`, border:`1.5px solid ${T.purple}55`, borderRadius:18, padding:"18px 22px", marginBottom:20, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", boxShadow:`0 0 40px ${T.purpleGlow}` }}>
          <span style={{ fontSize:28 }}>⭐</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, color:T.cream, fontSize:14, marginBottom:3 }}>Oshun Black — <span style={{ color:T.gold }}>$9.99/mo</span></div>
            <div style={{ fontSize:12, color:T.creamMid, lineHeight:1.5 }}>Free delivery · Priority booking · Founding Member badge</div>
          </div>
          <Btn onClick={() => setSubscribed(true)} style={{ padding:"9px 18px", whiteSpace:"nowrap", fontSize:13 }}>Subscribe</Btn>
        </div>
      ) : (
        <div style={{ background:"rgba(34,197,94,0.06)", border:`1.5px solid ${T.success}33`, borderRadius:14, padding:"12px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <CheckCircle size={17} color={T.success} />
          <span style={{ fontWeight:700, color:T.success }}>Oshun Black · Active</span>
          <span style={{ fontSize:12, color:T.muted }}>Free delivery on all orders</span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="oshun-hscroll" style={{ display:"flex", borderBottom:`1px solid ${T.borderMid}`, marginBottom:22, overflowX:"auto" }}>
        {[["orders","📦 Orders"],["rewards","🏆 Rewards"],["saved","❤️ Saved"],["settings","⚙️ Settings"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background:"transparent", border:"none",
            borderBottom: tab===id ? `2px solid ${T.gold}` : "2px solid transparent",
            color: tab===id ? T.gold : T.muted,
            padding:"11px 18px", cursor:"pointer",
            fontWeight: tab===id ? 700 : 500, fontSize:14,
            marginBottom:-1, whiteSpace:"nowrap", transition:"color 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {/* ── Orders Tab ── */}
      {tab === "orders" && (
        <div>
          <h3 style={{ color:T.cream, fontWeight:800, fontSize:16, marginBottom:14 }}>Recent Orders</h3>
          {orders.map(o => (
            <div key={o.id} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:15, padding:"15px 20px", marginBottom:10, display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Package size={17} color={T.gold} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:T.cream, fontSize:14 }}>{o.id} <span style={{ color:T.muted, fontWeight:400, fontSize:12 }}>· {o.date}</span></div>
                <div style={{ color:T.muted, fontSize:12, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.items}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ color:T.gold, fontWeight:800, fontSize:15 }}>${o.total.toFixed(2)}</div>
                <div style={{ fontSize:11, color:T.success, marginTop:2, fontWeight:600 }}>{o.status}</div>
              </div>
            </div>
          ))}
          <h3 style={{ color:T.cream, fontWeight:800, fontSize:16, margin:"24px 0 14px" }}>Upcoming Bookings</h3>
          {bookings.map(b => (
            <div key={b.id} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:15, padding:"15px 20px", marginBottom:10, display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Calendar size={17} color={T.purple} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:T.cream, fontSize:14 }}>{b.service}</div>
                <div style={{ color:T.muted, fontSize:12, marginTop:2 }}>by {b.provider} · {b.date} at {b.time}</div>
              </div>
              <div style={{ color:T.gold, fontWeight:800, fontSize:15, flexShrink:0 }}>${b.price}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Rewards Tab ── */}
      {tab === "rewards" && (
        <div>
          {/* Points progress bar */}
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:18, padding:"22px 24px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:900, fontSize:28, color:tierColor, letterSpacing:"-0.02em" }}>{rewardPoints.toLocaleString()}</div>
                <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>Oshun Points</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, color:tierColor, fontSize:14 }}>{rewardTier} Tier</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>260 pts to Platinum</div>
              </div>
            </div>
            <div style={{ background:T.bgCardAlt, borderRadius:6, height:8, overflow:"hidden" }}>
              <div style={{ width:`${Math.min(100,(rewardPoints/1500)*100).toFixed(0)}%`, height:"100%", background:`linear-gradient(90deg,${tierColor},${T.gold})`, borderRadius:6, transition:"width 0.6s ease" }} />
            </div>
          </div>
          {/* Earn + Redeem */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            {[
              { icon:"🛍️", label:"Earn Points", desc:"1 pt per $1 spent on orders" },
              { icon:"💅", label:"Booking Bonus", desc:"+50 pts per service booked" },
              { icon:"⭐", label:"Leave a Review", desc:"+25 pts per review posted" },
              { icon:"🎁", label:"Redeem Rewards", desc:"500 pts = $5 off your order" },
            ].map(r => (
              <div key={r.label} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:14, padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{r.icon}</span>
                <div>
                  <div style={{ fontWeight:700, color:T.cream, fontSize:13 }}>{r.label}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:3, lineHeight:1.4 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <Btn style={{ width:"100%", padding:"13px" }}>Redeem 500 pts for $5 off</Btn>

          {/* ── Beauty Passport ── */}
          <div style={{ marginTop:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14 }}>
              <h3 style={{ color:T.cream, fontWeight:800, fontSize:16, margin:0 }}>Beauty Passport 💅</h3>
              <span style={{ fontSize:12, color:T.muted }}>Stamp 10 visits → earn a free service</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {BUSINESSES.map((biz, bizIdx) => {
                const stamps = [3,7,2,10][bizIdx] || 0;
                const done   = stamps >= 10;
                return (
                  <div key={biz.id} style={{ background:T.bgCard, border:`1px solid ${done ? T.gold : T.borderMid}`, borderRadius:16, padding:"16px 18px", boxShadow: done ? `0 0 18px ${T.goldGlow}` : "none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:biz.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"white" }}>{biz.initials}</div>
                        <div>
                          <div style={{ fontWeight:700, color:T.cream, fontSize:13 }}>{biz.name}</div>
                          <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{stamps}/10 visits</div>
                        </div>
                      </div>
                      {done
                        ? <span style={{ fontSize:11, color:T.gold, fontWeight:700, background:`${T.gold}1A`, border:`1px solid ${T.gold}44`, padding:"4px 10px", borderRadius:20 }}>🎁 Free service!</span>
                        : <span style={{ fontSize:11, color:T.muted }}>{10-stamps} more to go</span>
                      }
                    </div>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      {Array.from({length:10},(_,i) => (
                        <div key={i} style={{
                          width:24, height:24, borderRadius:"50%",
                          background: i < stamps ? `linear-gradient(135deg,${T.gold},${T.goldDark})` : T.bgCardAlt,
                          border: `1.5px solid ${i < stamps ? T.gold : T.borderMid}`,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:11,
                          boxShadow: i < stamps ? `0 0 8px ${T.goldGlow}` : "none",
                          transition:"all 0.2s"
                        }}>
                          {i < stamps && <span style={{ color:"#ffffff", fontWeight:900, fontSize:10 }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Referral Program ── */}
          <div style={{ marginTop:24 }}>
            <h3 style={{ color:T.cream, fontWeight:800, fontSize:16, marginBottom:14 }}>Referral Program 🎁</h3>
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:"20px 22px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontWeight:900, color:T.cream, fontSize:16 }}>Share Oshun, earn together</div>
                  <div style={{ fontSize:13, color:T.muted, marginTop:4, lineHeight:1.5 }}>You get <span style={{ color:T.gold }}>$10 credit</span> + your friend gets <span style={{ color:T.gold }}>$10 off</span> their first order.</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:900, fontSize:22, color:T.gold }}>$20</div>
                  <div style={{ fontSize:11, color:T.muted }}>earned so far</div>
                </div>
              </div>
              {/* Referral code */}
              <div style={{ background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:12, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:"0.04em", marginBottom:3 }}>YOUR CODE</div>
                  <div style={{ fontWeight:900, color:T.goldLight, fontSize:16, letterSpacing:"0.08em" }}>OSHUN-{user?.name?.slice(0,5)?.toUpperCase() || "GUEST"}</div>
                </div>
                <Btn variant="outline" style={{ padding:"7px 14px", fontSize:12 }}>Copy Link</Btn>
              </div>
              {/* Progress */}
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:T.muted }}>2 friends joined · Refer 3 more for a free Oshun Black month</span>
              </div>
              <div style={{ background:T.bgCardAlt, borderRadius:6, height:6 }}>
                <div style={{ width:"40%", height:"100%", background:`linear-gradient(90deg,${T.gold},${T.rose})`, borderRadius:6 }} />
              </div>
              <div style={{ textAlign:"center", marginTop:14 }}>
                <Btn style={{ padding:"10px 28px" }}>Share Referral Link</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Saved Stores Tab ── */}
      {tab === "saved" && (
        <div>
          <h3 style={{ color:T.cream, fontWeight:800, fontSize:16, marginBottom:14 }}>Saved Stores</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {savedStores.map(biz => (
              <div key={biz.id} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:biz.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"white", flexShrink:0, boxShadow:"0 2px 12px rgba(0,0,0,0.4)" }}>
                  {biz.initials}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:T.cream, fontSize:14 }}>{biz.name}</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{biz.category} · {biz.location}</div>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:11, color:T.gold, fontWeight:700 }}>★ {biz.rating}</span>
                  <button style={{ background:"none", border:"none", cursor:"pointer", color:T.error, fontSize:16 }}>♥</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:20 }}>
            <Btn variant="outline" onClick={() => setPage("shop")} style={{ padding:"10px 24px" }}>Discover More Stores</Btn>
          </div>
        </div>
      )}

      {/* ── Settings Tab ── */}
      {tab === "settings" && (
        <div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, overflow:"hidden", marginBottom:16 }}>
            <div style={{ padding:"13px 20px", fontWeight:700, color:T.muted, fontSize:11, letterSpacing:"0.05em", background:T.bgCardAlt }}>ACCOUNT</div>
            {[
              { icon:"👤", label:"Edit Profile",       sub:"Name, photo, pronouns"     },
              { icon:"🔑", label:"Change Password",    sub:"Last changed 30 days ago"  },
              { icon:"📍", label:"Saved Addresses",    sub:"2 addresses saved"         },
              { icon:"💳", label:"Payment Methods",    sub:"Visa ending in 4242"       },
            ].map((item, i, arr) => (
              <button key={item.label} style={{ width:"100%", background:"none", border:"none", borderBottom: i < arr.length-1 ? `1px solid ${T.borderMid}` : "none", cursor:"pointer", padding:"14px 20px", display:"flex", alignItems:"center", gap:14, textAlign:"left" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{item.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color:T.cream, fontSize:14 }}>{item.label}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{item.sub}</div>
                </div>
                <ChevronRight size={16} color={T.muted} />
              </button>
            ))}
          </div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, overflow:"hidden", marginBottom:16 }}>
            <div style={{ padding:"13px 20px", fontWeight:700, color:T.muted, fontSize:11, letterSpacing:"0.05em", background:T.bgCardAlt }}>NOTIFICATIONS</div>
            {[
              { icon:"🔔", label:"Order Updates",       sub:"SMS and push notifications" },
              { icon:"🎯", label:"Promo Alerts",        sub:"Bi-daily deals and offers"  },
              { icon:"💬", label:"Booking Reminders",   sub:"48hr and 1hr reminders"     },
            ].map((item, i, arr) => (
              <button key={item.label} style={{ width:"100%", background:"none", border:"none", borderBottom: i < arr.length-1 ? `1px solid ${T.borderMid}` : "none", cursor:"pointer", padding:"14px 20px", display:"flex", alignItems:"center", gap:14, textAlign:"left" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{item.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color:T.cream, fontSize:14 }}>{item.label}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{item.sub}</div>
                </div>
                <div style={{ width:40, height:22, borderRadius:11, background:`linear-gradient(135deg,${T.gold},${T.goldDark})`, display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"0 3px", flexShrink:0, boxShadow:`0 0 8px ${T.goldGlow}` }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", background:"white" }} />
                </div>
              </button>
            ))}
          </div>
          <button style={{ width:"100%", background:"none", border:`1px solid ${T.error}33`, borderRadius:12, cursor:"pointer", padding:"13px 20px", color:T.error, fontWeight:700, fontSize:14 }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRODUCT UPLOAD FLOW
// ─────────────────────────────────────────────────────────────
function ProductUploadFlow({ onClose, onAdd }) {
  const [mode,       setMode]       = useState(null);  // null | 'camera' | 'manual' | 'bulk'
  const [bulkTab,    setBulkTab]    = useState("csv"); // 'csv' | 'photos'
  const [imgSrc,     setImgSrc]     = useState(null);
  const [analyzing,  setAnalyzing]  = useState(false);
  const [cameraForm, setCameraForm] = useState({ name:"", brand:"", category:"hair", price:"", description:"", stock:"" });
  const [manForm,    setManForm]    = useState({ name:"", brand:"", category:"hair", price:"", description:"", stock:"", imgSrc:null });
  const [csvRows,    setCsvRows]    = useState([]);
  const [batchItems, setBatchItems] = useState([]);
  const [saved,      setSaved]      = useState(false);
  const [csvDone,    setCsvDone]    = useState(false);

  const AI_LIBRARY = [
    { name:"Curl Defining Cream",    brand:"Cantu",            category:"hair",     price:"9.99",  description:"Rich cream that defines and elongates natural curls without crunch.",    stock:"30" },
    { name:"Argan Oil Treatment",    brand:"OGX",              category:"hair",     price:"11.99", description:"Lightweight argan oil for shine and frizz control.",                    stock:"25" },
    { name:"Brightening Eye Cream",  brand:"Olay",             category:"skincare", price:"24.99", description:"Targets dark circles and puffiness around the eyes.",                   stock:"15" },
    { name:"Matte Bronzer Palette",  brand:"e.l.f. Cosmetics", category:"makeup",   price:"14.00", description:"Buildable matte bronzer in four complementary shades.",                 stock:"40" },
    { name:"Nail Strengthener",      brand:"Sally Hansen",     category:"nails",    price:"8.50",  description:"Fortifying base coat that repairs and protects weak nails.",             stock:"60" },
    { name:"Vitamin C Brightening Serum", brand:"TruSkin",     category:"skincare", price:"19.99", description:"Brightening serum with vitamin C and hyaluronic acid.",                stock:"20" },
    { name:"Edge Control Gel",       brand:"Got2b",            category:"hair",     price:"7.99",  description:"Ultra-strong hold gel for sleek edges and baby hairs.",                 stock:"45" },
    { name:"Scalp Scrub",            brand:"Head & Shoulders", category:"hair",     price:"13.49", description:"Exfoliating scalp scrub that removes buildup and soothes dryness.",     stock:"35" },
    { name:"Setting Powder",         brand:"Laura Mercier",    category:"makeup",   price:"42.00", description:"Translucent baking powder for a smooth, long-wear finish.",             stock:"18" },
    { name:"Gel Top Coat",           brand:"OPI",              category:"nails",    price:"12.00", description:"High-gloss top coat that extends manicure wear.",                       stock:"55" },
  ];

  const GRADIENTS = [
    "linear-gradient(135deg,#C96B8A,#8B35A8)",
    "linear-gradient(135deg,#D4AF37,#E07B54)",
    "linear-gradient(135deg,#3A6B8B,#2D9E6B)",
    "linear-gradient(135deg,#8B35A8,#C96B8A)",
    "linear-gradient(135deg,#E07B54,#C96B8A)",
    "linear-gradient(135deg,#A8891A,#D4AF37)",
  ];

  const rndProduct  = () => AI_LIBRARY[Math.floor(Math.random() * AI_LIBRARY.length)];
  const rndGradient = () => GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

  const handlePhotoSelect = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImgSrc(ev.target.result);
      setAnalyzing(true);
      setTimeout(() => { setCameraForm(rndProduct()); setAnalyzing(false); }, 2400);
    };
    reader.readAsDataURL(file);
  };

  const handleCSVUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      const rows = lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = line.split(",");
        return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i]?.trim() || "" }), {});
      });
      setCsvRows(rows);
    };
    reader.readAsText(file);
  };

  const handleBatchPhotos = e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const initial = files.map(f => ({ src: URL.createObjectURL(f), analyzing: true, product: null }));
    setBatchItems(initial);
    files.forEach((_, i) => {
      setTimeout(() => setBatchItems(prev => prev.map((p, j) => j === i ? { ...p, analyzing: false, product: rndProduct() } : p)), 1400 + i * 900);
    });
  };

  const downloadTemplate = () => {
    const csv = [
      "name,brand,category,price,description,stock",
      "Curl Defining Gel,Pattern Beauty,hair,24.99,Lightweight gel for natural curls,50",
      "Hydra Vizor SPF 30,Fenty Skin,skincare,38.00,Invisible moisturizer + sunscreen,25",
      "Pro Filt'r Foundation,Fenty Beauty,makeup,40.00,50 inclusive shades full coverage,30",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "oshun_product_template.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const saveProduct = form => {
    onAdd({ id: Date.now(), ...form, price: parseFloat(form.price) || 0, reviews: 0, rating: 5.0, gradient: rndGradient(), businessId: 1, tags: [] });
    setSaved(true);
    setTimeout(() => { setSaved(false); setMode(null); setImgSrc(null); setCameraForm({ name:"", brand:"", category:"hair", price:"", description:"", stock:"" }); setManForm({ name:"", brand:"", category:"hair", price:"", description:"", stock:"", imgSrc:null }); }, 1800);
  };

  const saveBulkCSV = () => {
    csvRows.forEach(row => onAdd({ id: Date.now() + Math.random(), name:row.name, brand:row.brand, category:row.category, price:parseFloat(row.price)||0, description:row.description, stock:row.stock, reviews:0, rating:5.0, gradient:rndGradient(), businessId:1, tags:[] }));
    setCsvDone(true);
    setTimeout(() => { setCsvDone(false); setCsvRows([]); setMode(null); }, 2000);
  };

  const saveBatchPhotos = () => {
    batchItems.filter(i => i.product).forEach(item => onAdd({ id: Date.now() + Math.random(), ...item.product, price:parseFloat(item.product.price)||0, reviews:0, rating:5.0, gradient:rndGradient(), businessId:1, tags:[] }));
    setSaved(true);
    setTimeout(() => { setSaved(false); setBatchItems([]); setMode(null); }, 2000);
  };

  const resetCamera = () => { setImgSrc(null); setAnalyzing(false); setCameraForm({ name:"", brand:"", category:"hair", price:"", description:"", stock:"" }); };

  const catSelect = (val, setter) => (
    <select value={val} onChange={e => setter(f => ({ ...f, category: e.target.value }))}
      style={{ background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:10, padding:"12px 14px", color:T.cream, outline:"none", fontSize:14, width:"100%" }}>
      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
    </select>
  );

  // ── SUCCESS ───────────────────────────────────────────────
  if (saved || csvDone) return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.success})`, margin:"0 auto 20px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <CheckCircle size={36} color="white" />
      </div>
      <h3 style={{ color:T.cream, fontWeight:800, marginBottom:8 }}>
        {csvDone ? `${csvRows.length} Products Imported!` : "Product Saved!"}
      </h3>
      <p style={{ color:T.muted, fontSize:14 }}>
        {csvDone ? "Your catalog has been updated." : "Now visible in your product inventory."}
      </p>
    </div>
  );

  // ── MODE SELECTION ────────────────────────────────────────
  if (!mode) return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h3 style={{ color:T.cream, fontWeight:800, fontSize:18 }}>Add Products</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted }}><X size={20} /></button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {[
          { id:"camera", emoji:"📸", title:"Camera / Photo",  desc:"Take a photo or upload an image — AI detects the product and fills in the details automatically." },
          { id:"manual", emoji:"✏️",  title:"Manual Entry",    desc:"Fill in product details yourself. Perfect for items that don't scan or when you need full control." },
          { id:"bulk",   emoji:"📦", title:"Bulk Upload",      desc:"Import many products at once via a CSV spreadsheet or by uploading a batch of product photos." },
        ].map(opt => (
          <button key={opt.id} onClick={() => setMode(opt.id)} style={{ background:T.bgCard, border:`1.5px solid ${T.borderMid}`, borderRadius:16, padding:"28px 20px", cursor:"pointer", textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:14 }}>{opt.emoji}</div>
            <div style={{ fontWeight:800, color:T.cream, marginBottom:10, fontSize:15 }}>{opt.title}</div>
            <div style={{ fontSize:12, color:T.muted, lineHeight:1.6 }}>{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── CAMERA FLOW ───────────────────────────────────────────
  if (mode === "camera") return (
    <div>
      <button onClick={() => { setMode(null); resetCamera(); }} style={{ background:"none", border:"none", color:T.gold, cursor:"pointer", display:"flex", alignItems:"center", gap:6, marginBottom:20, fontWeight:600 }}>
        <ArrowLeft size={15} /> Back
      </button>
      <h3 style={{ color:T.cream, fontWeight:800, fontSize:17, marginBottom:20 }}>Camera / Photo Upload</h3>

      {/* Step 1 — No photo yet */}
      {!imgSrc && (
        <div style={{ border:`2px dashed ${T.borderMid}`, borderRadius:16, padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:14 }}>📸</div>
          <p style={{ color:T.creamMid, marginBottom:6, fontSize:15, fontWeight:600 }}>Take or upload a product photo</p>
          <p style={{ color:T.muted, fontSize:13, marginBottom:24 }}>AI will scan it and fill in the product details for you</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <label style={{ cursor:"pointer" }}>
              <div style={{ background:`linear-gradient(135deg,${T.gold},${T.goldDark})`, color:"#1A0D05", borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:8 }}>
                📷 Take Photo
              </div>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display:"none" }} />
            </label>
            <label style={{ cursor:"pointer" }}>
              <div style={{ background:"transparent", border:`1.5px solid ${T.gold}`, color:T.gold, borderRadius:10, padding:"11px 22px", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:8 }}>
                🖼 Choose from Library
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display:"none" }} />
            </label>
          </div>
        </div>
      )}

      {/* Step 2 — Analyzing */}
      {imgSrc && analyzing && (
        <div style={{ textAlign:"center", padding:"40px 20px" }}>
          <div style={{ width:100, height:100, borderRadius:16, overflow:"hidden", margin:"0 auto 24px", position:"relative" }}>
            <img src={imgSrc} alt="product" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.5 }} />
          </div>
          <div style={{ width:52, height:52, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.purple})`, margin:"0 auto 18px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, animation:"oshunSpin 1.2s linear infinite" }}>
            ✦
          </div>
          <p style={{ color:T.cream, fontWeight:700, fontSize:16, marginBottom:6 }}>AI is scanning your product...</p>
          <p style={{ color:T.muted, fontSize:13 }}>Detecting name, brand, category, and price</p>
          <style>{`@keyframes oshunSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Step 3 — AI filled form */}
      {imgSrc && !analyzing && cameraForm.name && (
        <div>
          <div style={{ display:"flex", gap:16, marginBottom:20, alignItems:"flex-start", background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:12, padding:14 }}>
            <img src={imgSrc} alt="product" style={{ width:72, height:72, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:12, background:`${T.success}22`, color:T.success, padding:"3px 10px", borderRadius:20, fontWeight:700 }}>✓ AI Detected</span>
              </div>
              <p style={{ color:T.muted, fontSize:12, lineHeight:1.5 }}>Fields have been pre-filled from your photo. Review and adjust anything before saving.</p>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input placeholder="Product Name"  value={cameraForm.name}        onChange={e => setCameraForm(f=>({...f,name:e.target.value}))}        style={{ gridColumn:"1/-1" }} />
            <Input placeholder="Brand"         value={cameraForm.brand}       onChange={e => setCameraForm(f=>({...f,brand:e.target.value}))} />
            {catSelect(cameraForm.category, setCameraForm)}
            <Input placeholder="Price ($)"     value={cameraForm.price}       onChange={e => setCameraForm(f=>({...f,price:e.target.value}))}       type="number" />
            <Input placeholder="Stock qty"     value={cameraForm.stock}       onChange={e => setCameraForm(f=>({...f,stock:e.target.value}))}       type="number" />
            <Input placeholder="Description"   value={cameraForm.description} onChange={e => setCameraForm(f=>({...f,description:e.target.value}))} style={{ gridColumn:"1/-1" }} />
          </div>
          <div style={{ display:"flex", gap:10, marginTop:18 }}>
            <Btn onClick={resetCamera} variant="outline">Retake Photo</Btn>
            <Btn onClick={() => saveProduct(cameraForm)} style={{ flex:1 }}>Save Product</Btn>
          </div>
        </div>
      )}
    </div>
  );

  // ── MANUAL ENTRY ──────────────────────────────────────────
  if (mode === "manual") return (
    <div>
      <button onClick={() => setMode(null)} style={{ background:"none", border:"none", color:T.gold, cursor:"pointer", display:"flex", alignItems:"center", gap:6, marginBottom:20, fontWeight:600 }}>
        <ArrowLeft size={15} /> Back
      </button>
      <h3 style={{ color:T.cream, fontWeight:800, fontSize:17, marginBottom:20 }}>Manual Product Entry</h3>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Input placeholder="Product Name"  value={manForm.name}        onChange={e => setManForm(f=>({...f,name:e.target.value}))}        style={{ gridColumn:"1/-1" }} />
        <Input placeholder="Brand"         value={manForm.brand}       onChange={e => setManForm(f=>({...f,brand:e.target.value}))} />
        {catSelect(manForm.category, setManForm)}
        <Input placeholder="Price ($)"     value={manForm.price}       onChange={e => setManForm(f=>({...f,price:e.target.value}))}       type="number" />
        <Input placeholder="Stock qty"     value={manForm.stock}       onChange={e => setManForm(f=>({...f,stock:e.target.value}))}       type="number" />
        <Input placeholder="Description"   value={manForm.description} onChange={e => setManForm(f=>({...f,description:e.target.value}))} style={{ gridColumn:"1/-1" }} />
        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ cursor:"pointer", display:"block" }}>
            <div style={{ border:`1.5px dashed ${T.borderMid}`, borderRadius:10, padding:14, textAlign:"center", color:T.muted, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              📷 Add a product photo <span style={{ color:T.muted, fontWeight:400 }}>(optional)</span>
            </div>
            <input type="file" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f){const r=new FileReader();r.onload=ev=>setManForm(fm=>({...fm,imgSrc:ev.target.result}));r.readAsDataURL(f);}}} style={{ display:"none" }} />
          </label>
          {manForm.imgSrc && <img src={manForm.imgSrc} alt="preview" style={{ width:80, height:80, borderRadius:10, objectFit:"cover", marginTop:10, border:`2px solid ${T.borderMid}` }} />}
        </div>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:20 }}>
        <Btn onClick={() => setMode(null)} variant="outline">Cancel</Btn>
        <Btn onClick={() => saveProduct(manForm)} disabled={!manForm.name || !manForm.price} style={{ flex:1 }}>Save Product</Btn>
      </div>
    </div>
  );

  // ── BULK UPLOAD ───────────────────────────────────────────
  if (mode === "bulk") return (
    <div>
      <button onClick={() => { setMode(null); setCsvRows([]); setBatchItems([]); }} style={{ background:"none", border:"none", color:T.gold, cursor:"pointer", display:"flex", alignItems:"center", gap:6, marginBottom:20, fontWeight:600 }}>
        <ArrowLeft size={15} /> Back
      </button>
      <h3 style={{ color:T.cream, fontWeight:800, fontSize:17, marginBottom:20 }}>Bulk Upload</h3>

      {/* Sub-tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${T.borderMid}`, marginBottom:24 }}>
        {[["csv","📋  CSV / Spreadsheet"],["photos","📸  Multi-Photo Batch"]].map(([id,label]) => (
          <button key={id} onClick={() => setBulkTab(id)} style={{ background:"transparent", border:"none", borderBottom:bulkTab===id?`2px solid ${T.gold}`:"2px solid transparent", color:bulkTab===id?T.gold:T.muted, padding:"10px 22px", cursor:"pointer", fontWeight:bulkTab===id?700:500, fontSize:14, marginBottom:-1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CSV sub-tab ── */}
      {bulkTab === "csv" && (
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <p style={{ color:T.creamMid, fontSize:14 }}>Download our template, fill it in, then upload it back here.</p>
            <Btn onClick={downloadTemplate} variant="outline" style={{ fontSize:12, padding:"8px 14px", borderRadius:8, flexShrink:0 }}>
              ⬇ Download Template
            </Btn>
          </div>

          {csvRows.length === 0 ? (
            <label style={{ cursor:"pointer", display:"block" }}>
              <div style={{ border:`2px dashed ${T.borderMid}`, borderRadius:14, padding:"48px 24px", textAlign:"center" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📂</div>
                <p style={{ color:T.creamMid, fontWeight:600, marginBottom:4 }}>Drop your CSV here or click to browse</p>
                <p style={{ color:T.muted, fontSize:12 }}>Accepts .csv files only</p>
              </div>
              <input type="file" accept=".csv,text/csv" onChange={handleCSVUpload} style={{ display:"none" }} />
            </label>
          ) : (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ color:T.success, fontWeight:700 }}>✓ {csvRows.length} products detected</span>
                <Btn onClick={() => setCsvRows([])} variant="ghost" style={{ fontSize:12, padding:"6px 12px" }}>Clear</Btn>
              </div>
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:12, overflow:"hidden", maxHeight:300, overflowY:"auto" }}>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr", padding:"10px 18px", borderBottom:`1px solid ${T.borderMid}`, fontSize:11, color:T.muted, fontWeight:700, letterSpacing:"0.5px", position:"sticky", top:0, background:T.bgCard }}>
                  {["PRODUCT NAME","BRAND","CATEGORY","PRICE"].map(h => <span key={h}>{h}</span>)}
                </div>
                {csvRows.map((row, i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr", padding:"11px 18px", borderBottom:i<csvRows.length-1?`1px solid ${T.borderMid}`:"none", fontSize:13, alignItems:"center" }}>
                    <span style={{ color:T.cream, fontWeight:600 }}>{row.name || "—"}</span>
                    <span style={{ color:T.muted }}>{row.brand || "—"}</span>
                    <span style={{ color:T.creamMid, textTransform:"capitalize" }}>{row.category || "—"}</span>
                    <span style={{ color:T.gold, fontWeight:700 }}>${row.price || "—"}</span>
                  </div>
                ))}
              </div>
              <Btn onClick={saveBulkCSV} style={{ marginTop:16, width:"100%" }}>
                Import {csvRows.length} Products to Inventory
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* ── Multi-photo sub-tab ── */}
      {bulkTab === "photos" && (
        <div>
          <p style={{ color:T.creamMid, fontSize:14, marginBottom:18 }}>
            Upload multiple product photos at once. AI detects and fills in details for each one — review before publishing.
          </p>

          {batchItems.length === 0 ? (
            <label style={{ cursor:"pointer", display:"block" }}>
              <div style={{ border:`2px dashed ${T.borderMid}`, borderRadius:14, padding:"48px 24px", textAlign:"center" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🖼️</div>
                <p style={{ color:T.creamMid, fontWeight:600, marginBottom:4 }}>Select multiple product photos</p>
                <p style={{ color:T.muted, fontSize:12 }}>Hold Ctrl / Cmd to select multiple files at once</p>
              </div>
              <input type="file" accept="image/*" multiple onChange={handleBatchPhotos} style={{ display:"none" }} />
            </label>
          ) : (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <span style={{ color:T.creamMid, fontSize:14, fontWeight:600 }}>{batchItems.length} photos uploaded</span>
                <span style={{ fontSize:13, color:T.muted }}>
                  {batchItems.filter(i => !i.analyzing && i.product).length} of {batchItems.length} analyzed
                </span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
                {batchItems.map((item, i) => (
                  <div key={i} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:12, overflow:"hidden" }}>
                    <div style={{ height:110, backgroundImage:`url(${item.src})`, backgroundSize:"cover", backgroundPosition:"center", position:"relative" }}>
                      {item.analyzing && (
                        <div style={{ position:"absolute", inset:0, background:"rgba(11,8,18,0.75)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, animation:"oshunSpin 1.2s linear infinite" }}>✦</div>
                          <span style={{ fontSize:11, color:T.cream, fontWeight:600 }}>Analyzing...</span>
                        </div>
                      )}
                      {!item.analyzing && item.product && (
                        <div style={{ position:"absolute", top:8, right:8, background:T.success, borderRadius:"50%", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <CheckCircle size={13} color="white" />
                        </div>
                      )}
                    </div>
                    <div style={{ padding:"10px 12px" }}>
                      {item.analyzing
                        ? <div style={{ fontSize:12, color:T.muted }}>Processing image...</div>
                        : item.product
                          ? <>
                              <div style={{ fontWeight:700, color:T.cream, fontSize:13, marginBottom:2 }}>{item.product.name}</div>
                              <div style={{ fontSize:11, color:T.muted, marginBottom:4 }}>{item.product.brand}</div>
                              <div style={{ display:"flex", justifyContent:"space-between" }}>
                                <span style={{ fontSize:13, color:T.gold, fontWeight:800 }}>${item.product.price}</span>
                                <span style={{ fontSize:11, color:T.success }}>Stock: {item.product.stock}</span>
                              </div>
                            </>
                          : <div style={{ fontSize:12, color:T.error }}>Detection failed</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
              {batchItems.every(i => !i.analyzing) && (
                <Btn onClick={saveBatchPhotos} style={{ width:"100%" }}>
                  Publish {batchItems.filter(i => i.product).length} Products to Inventory
                </Btn>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────
// BUSINESS DASHBOARD
// ─────────────────────────────────────────────────────────────
function BusinessDashboard({ user, activeOrder, advanceActiveOrderStatus, dispatchDelivery, requestTab }) {
  const [tab, setTab] = useState("storefront");
  useEffect(() => { if (requestTab) setTab(requestTab); }, [requestTab]);

  // ── Orders state (preserved from original) ──────────────────
  const ORDER_FLOW = ["New", "Preparing", "Ready for Pickup", "Dispatched", "Delivered"];
  const [orders, setOrders] = useState(() => ([
    { id: "#OS-1045", customer: "Aaliyah J.",  items: "Curl Defining Gel ×2",    total: 49.98, status: "New",       time: "5 min ago",  address: "3100 14th St NW, Washington DC"     },
    { id: "#OS-1044", customer: "Maya T.",     items: "Rosemary Mint Oil ×1",    total: 12.99, status: "Preparing", time: "18 min ago", address: "620 Columbia Rd NW, Washington DC"  },
    { id: "#OS-1043", customer: "Destiny R.",  items: "Deep Moisture Mask ×3",   total: 44.97, status: "Delivered", time: "42 min ago", address: "2112 Georgia Ave NW, Washington DC" },
    { id: "#OS-1040", customer: "Imani W.",    items: "Edge Control ×2, Gel ×1", total: 38.97, status: "Delivered", time: "1 hr ago",   address: "1440 U St NW, Washington DC"        },
  ]));
  const [dispatchToast, setDispatchToast]   = useState(null);
  const [dispatchingId, setDispatchingId]   = useState(null);

  useEffect(() => {
    if (!activeOrder) return;
    setOrders(prev => {
      const exists = prev.find(o => o.id === activeOrder.id);
      if (exists) return prev.map(o => o.id === activeOrder.id ? { ...o, status: activeOrder.status } : o);
      return [{ id: activeOrder.id, customer: activeOrder.customer, items: activeOrder.items, total: activeOrder.total, status: activeOrder.status, time: "Just now", address: activeOrder.address ?? "DC Metro Area" }, ...prev];
    });
  }, [activeOrder]);

  const advanceOrder = id => setOrders(prev => prev.map(o => {
    if (o.id !== id) return o;
    const idx = ORDER_FLOW.indexOf(o.status);
    const next = ORDER_FLOW[Math.min(idx + 1, ORDER_FLOW.length - 1)];
    if (next === "Dispatched" && activeOrder?.id === id && advanceActiveOrderStatus) advanceActiveOrderStatus(3);
    if (next === "Delivered"  && activeOrder?.id === id && advanceActiveOrderStatus) advanceActiveOrderStatus(5);
    return { ...o, status: next };
  }));

  const handleDispatch = id => {
    setDispatchingId(id);
    setTimeout(() => {
      if (dispatchDelivery) dispatchDelivery(id);
      setDispatchingId(null);
      setDispatchToast(id);
      setTimeout(() => setDispatchToast(null), 3500);
      advanceOrder(id);
    }, 1800);
  };

  // ── Storefront state ─────────────────────────────────────────
  const [editingField, setEditingField] = useState(null);
  const [bizInfo, setBizInfo] = useState({
    name:     user?.businessName || "Crown & Glory Beauty",
    tagline:  "Your neighborhood beauty hub — curated products, expert services",
    phone:    "(202) 555-0187",
    address:  "3214 Georgia Ave NW, Washington DC 20010",
    category: "Beauty Supply & Salon",
    hours:    "Mon–Fri 9am–8pm · Sat 10am–6pm · Sun Closed",
  });

  // ── Edit Profile Modal state ──────────────────────────────────
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileDraft,     setProfileDraft]     = useState(null);
  const [profilePicPreview,setProfilePicPreview]= useState(null);

  const openProfileModal = () => {
    setProfileDraft({ ...bizInfo });
    setProfilePicPreview(null);
    setProfileModalOpen(true);
  };
  const saveProfileModal = () => {
    setBizInfo({ ...profileDraft });
    setProfileModalOpen(false);
    toast.success("Profile updated ✓");
  };
  const handleProfilePicChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProfilePicPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Business Community state ──────────────────────────────────
  const [bizPosts,       setBizPosts]       = useState([]);
  const [bizPostContent, setBizPostContent] = useState("");
  const [bizPostCategory,setBizPostCategory]= useState("update");
  const [bizPostLoading, setBizPostLoading] = useState(false);

  const BIZ_POST_TYPES = [
    { id:"update",    label:"📢 Update"   },
    { id:"promotion", label:"🏷️ Promo"   },
    { id:"tip",       label:"💡 Beauty Tip"},
    { id:"event",     label:"🗓️ Event"   },
  ];

  const submitBizPost = async () => {
    if (!bizPostContent.trim()) { toast.error("Write something first"); return; }
    setBizPostLoading(true);
    try {
      await createCommunityPost({ content: bizPostContent, category: bizPostCategory, type: "business" });
      setBizPosts(prev => [{ id: Date.now(), content: bizPostContent, category: bizPostCategory, author: bizInfo.name, created_at: new Date().toISOString(), likes_count: 0, community_comments: [] }, ...prev]);
      setBizPostContent("");
      toast.success("Posted to community ✓");
    } catch (_) {
      // Optimistic fallback while backend isn't wired
      setBizPosts(prev => [{ id: Date.now(), content: bizPostContent, category: bizPostCategory, author: bizInfo.name, created_at: new Date().toISOString(), likes_count: 0, community_comments: [] }, ...prev]);
      setBizPostContent("");
      toast.success("Posted ✓");
    } finally {
      setBizPostLoading(false);
    }
  };
  const [socialLinks, setSocialLinks] = useState({ ig: "", tiktok: "", facebook: "" });
  const [socialModal, setSocialModal] = useState(null);
  const [socialInput,  setSocialInput]  = useState("");
  const FEATURED_BRANDS = [
    { id: 1, name: "Melanin Magic",    category: "Skincare",  logo: "MM", color: "#C9A84C", active: true  },
    { id: 2, name: "Curl Goddess",     category: "Hair Care", logo: "CG", color: "#007A75", active: true  },
    { id: 3, name: "Royal Noir",       category: "Makeup",    logo: "RN", color: "#7B5EA7", active: false },
  ];

  // ── Inventory state ──────────────────────────────────────────
  const [invMode,       setInvMode]       = useState("manual");
  const [invItems,      setInvItems]      = useState([
    { id: 1, name: "Curl Defining Gel",   sku: "CDG-001", price: 24.99, qty: 18, category: "Hair Care"  },
    { id: 2, name: "Rosemary Mint Oil",   sku: "RMO-004", price: 12.99, qty: 34, category: "Hair Care"  },
    { id: 3, name: "Deep Moisture Mask",  sku: "DMM-007", price: 14.99, qty:  9, category: "Hair Care"  },
    { id: 4, name: "Edge Control Wax",    sku: "ECW-002", price: 11.99, qty: 22, category: "Styling"    },
    { id: 5, name: "Vitamin C Serum",     sku: "VCS-010", price: 34.99, qty:  5, category: "Skincare"   },
  ]);
  const [manualForm,    setManualForm]    = useState({ name:"", sku:"", price:"", qty:"", category:"Hair Care", description:"" });
  const [manualErrors,  setManualErrors]  = useState({});
  const [scanState,     setScanState]     = useState("idle"); // idle | scanning | result
  const [scanResult,    setScanResult]    = useState(null);
  const [csvPreview,    setCsvPreview]    = useState(null);
  const [csvImporting,  setCsvImporting]  = useState(false);
  const [invToast,      setInvToast]      = useState(null);
  const csvInputRef = useRef(null);

  const PRODUCT_CATS = ["Hair Care","Skincare","Makeup","Styling","Nails","Fragrance","Tools","Other"];

  const showInvToast = msg => { setInvToast(msg); setTimeout(() => setInvToast(null), 3000); };

  const validateManual = () => {
    const e = {};
    if (!manualForm.name.trim())  e.name  = "Required";
    if (!manualForm.sku.trim())   e.sku   = "Required";
    if (!manualForm.price || isNaN(manualForm.price) || +manualForm.price <= 0) e.price = "Enter valid price";
    if (!manualForm.qty   || isNaN(manualForm.qty)   || +manualForm.qty   <  0) e.qty   = "Enter valid qty";
    setManualErrors(e);
    return Object.keys(e).length === 0;
  };

  const addManualItem = () => {
    if (!validateManual()) return;
    setInvItems(prev => [...prev, { id: Date.now(), name: manualForm.name, sku: manualForm.sku, price: +manualForm.price, qty: +manualForm.qty, category: manualForm.category }]);
    setManualForm({ name:"", sku:"", price:"", qty:"", category:"Hair Care", description:"" });
    setManualErrors({});
    showInvToast("✓ Item added to inventory");
  };

  const startScan = () => {
    setScanState("scanning");
    setScanResult(null);
    setTimeout(() => {
      setScanResult({ name: "Shea Moisture Jamaican Black Castor Oil", sku: "SM-JBCO-8OZ", price: 13.99, qty: 1, category: "Hair Care" });
      setScanState("result");
    }, 2200);
  };

  const confirmScan = () => {
    if (!scanResult) return;
    setInvItems(prev => [...prev, { id: Date.now(), ...scanResult }]);
    setScanState("idle");
    setScanResult(null);
    showInvToast("✓ Scanned item added to inventory");
  };

  const handleCsvFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target.result;
      const lines = text.trim().split("\n").map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g,"")));
      if (lines.length < 2) return;
      const headers = lines[0];
      const rows = lines.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
        return obj;
      });
      setCsvPreview({ headers, rows: rows.slice(0, 5), total: rows.length, all: rows });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const importCsv = () => {
    if (!csvPreview) return;
    setCsvImporting(true);
    setTimeout(() => {
      const imported = csvPreview.all.map((row, i) => ({
        id: Date.now() + i,
        name:     row["name"]     || row["Name"]     || row["Product Name"] || "Unnamed",
        sku:      row["sku"]      || row["SKU"]       || `IMP-${i+1}`,
        price:    +(row["price"]  || row["Price"]     || 0),
        qty:      +(row["qty"]    || row["Qty"]       || row["Quantity"] || 0),
        category: row["category"] || row["Category"]  || "Other",
      }));
      setInvItems(prev => [...prev, ...imported]);
      setCsvImporting(false);
      setCsvPreview(null);
      showInvToast(`✓ ${imported.length} items imported from CSV`);
    }, 1400);
  };

  // ── Analytics state ──────────────────────────────────────────
  const weekRevenue = [312, 448, 276, 591, 683, 420, 734];
  const weekDays    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const maxRev      = Math.max(...weekRevenue);
  const topProducts = [
    { name: "Curl Defining Gel",  sales: 42, revenue: 1049.58 },
    { name: "Rosemary Mint Oil",  sales: 37, revenue:  480.63 },
    { name: "Edge Control Wax",   sales: 29, revenue:  347.71 },
    { name: "Deep Moisture Mask", sales: 21, revenue:  314.79 },
    { name: "Vitamin C Serum",    sales: 14, revenue:  489.86 },
  ];

  const statusColor = {
    New: T.gold, Preparing: "#60A5FA", "Ready for Pickup": "#F59E0B",
    Dispatched: T.purple, Delivered: T.success,
  };

  const inputStyle = err => ({
    width:"100%", background:T.bgCardAlt, border:`1px solid ${err ? T.error : T.borderMid}`,
    borderRadius:10, padding:"11px 14px", color:T.cream, fontSize:13, outline:"none",
  });
  const labelStyle = { fontSize:12, fontWeight:600, color:T.creamMid, marginBottom:5, display:"block" };
  const tabBtnStyle = active => ({
    padding:"10px 20px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
    background: active ? T.gold : T.bgCardAlt,
    color:      active ? T.bg   : T.creamMid,
    transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.cream }}>
      {/* Dispatch toast */}
      {dispatchToast && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", zIndex:999, background:T.success, color:"#fff", borderRadius:12, padding:"12px 24px", fontWeight:700, fontSize:14, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"fadeUp 0.25s ease" }}>
          🚗 Driver dispatched successfully!
        </div>
      )}
      {invToast && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", zIndex:999, background:T.bgCard, border:`1px solid ${T.gold}`, color:T.gold, borderRadius:12, padding:"12px 24px", fontWeight:700, fontSize:14, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"fadeUp 0.25s ease" }}>
          {invToast}
        </div>
      )}

      {/* Social connect modal */}
      {socialModal && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:20, padding:"32px 28px", maxWidth:420, width:"100%", position:"relative" }}>
            <button onClick={() => { setSocialModal(null); setSocialInput(""); }} style={{ position:"absolute", top:14, right:14, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:8, width:30, height:30, cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", justifyContent:"center" }}><X size={14}/></button>
            <div style={{ fontSize:28, marginBottom:8 }}>{socialModal==="ig"?"📸":socialModal==="tiktok"?"🎵":"👥"}</div>
            <h3 style={{ fontSize:18, fontWeight:800, color:T.cream, marginBottom:6 }}>
              Connect {socialModal==="ig"?"Instagram":socialModal==="tiktok"?"TikTok":"Facebook"}
            </h3>
            <p style={{ fontSize:13, color:T.creamMid, marginBottom:20, lineHeight:1.5 }}>
              Enter your {socialModal==="ig"?"@username":socialModal==="tiktok"?"@username":"page name or URL"} to link your profile to your storefront.
            </p>
            <label style={labelStyle}>Profile {socialModal==="facebook"?"URL / Page Name":"@Username"}</label>
            <input
              value={socialInput}
              onChange={e => setSocialInput(e.target.value)}
              placeholder={socialModal==="ig"?"@crownglory_beauty":socialModal==="tiktok"?"@crownglory_dc":"Crown & Glory Beauty"}
              style={{ ...inputStyle(false), marginBottom:20 }}
            />
            <Btn style={{ width:"100%", padding:"13px" }} onClick={() => {
              setSocialLinks(prev => ({ ...prev, [socialModal]: socialInput }));
              setSocialModal(null); setSocialInput("");
            }}>Connect Profile</Btn>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:T.bgCard, borderBottom:`1px solid ${T.borderMid}`, padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.gold, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:3 }}>Business Hub</div>
          <h2 style={{ fontSize:20, fontWeight:900, color:T.cream, letterSpacing:"-0.02em" }}>{bizInfo.name}</h2>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[
            { key:"storefront", label:"🏪 Storefront" },
            { key:"inventory",  label:"📦 Inventory"  },
            { key:"orders",     label:"🧾 Orders"     },
            { key:"analytics",  label:"📊 Analytics"  },
            { key:"community",  label:"💬 Community"  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tabBtnStyle(tab===t.key)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"28px 20px" }}>

        {/* ═══════════════ STOREFRONT TAB ═══════════════ */}
        {tab === "storefront" && (
          <div>
            {/* Banner */}
            <div style={{ background:`linear-gradient(135deg, ${T.bgCardAlt} 0%, #0d0d1a 100%)`, border:`1px solid ${T.borderMid}`, borderRadius:20, padding:"28px 28px 24px", marginBottom:24, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:T.goldGlow, filter:"blur(40px)" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
                <div style={{ width:64, height:64, borderRadius:16, background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:900, color:T.bg, flexShrink:0 }}>
                  {bizInfo.name.charAt(0)}
                </div>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
                    <h3 style={{ fontSize:20, fontWeight:900, color:T.cream, margin:0 }}>{bizInfo.name}</h3>
                    <span style={{ fontSize:11, fontWeight:700, color:T.success, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", padding:"2px 10px", borderRadius:20 }}>● Live on Oshun</span>
                  </div>
                  <p style={{ fontSize:13, color:T.creamMid, margin:0 }}>{bizInfo.tagline}</p>
                </div>
                <Btn variant="outline" style={{ padding:"9px 18px", fontSize:12 }} onClick={openProfileModal}>
                  <Edit3 size={13}/> Edit Profile
                </Btn>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:20, marginBottom:24 }}>
              {/* Business Info Card */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:T.cream }}>Business Info</span>
                  <button onClick={() => setEditingField(editingField?"none":"all")} style={{ background:"none", border:"none", cursor:"pointer", color:T.gold, fontSize:12, fontWeight:600 }}>
                    {editingField ? "Save ✓" : "Edit"}
                  </button>
                </div>
                {[
                  { key:"phone",    label:"Phone",    icon:"📞" },
                  { key:"address",  label:"Address",  icon:"📍" },
                  { key:"category", label:"Category", icon:"🏷️" },
                  { key:"hours",    label:"Hours",    icon:"🕐" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, color:T.muted, marginBottom:3 }}>{f.icon} {f.label}</div>
                    {editingField ? (
                      <input
                        value={bizInfo[f.key]}
                        onChange={e => setBizInfo(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ ...inputStyle(false), fontSize:12, padding:"8px 12px" }}
                      />
                    ) : (
                      <div style={{ fontSize:13, color:T.cream, lineHeight:1.4 }}>{bizInfo[f.key]}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Social Profiles Card */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:18 }}>Social Profiles</div>
                {[
                  { key:"ig",       label:"Instagram",  icon:"📸", color:"#E1306C", placeholder:"Not connected" },
                  { key:"tiktok",   label:"TikTok",     icon:"🎵", color:"#00F7EF", placeholder:"Not connected" },
                  { key:"facebook", label:"Facebook",   icon:"👥", color:"#1877F2", placeholder:"Not connected" },
                ].map(s => (
                  <div key={s.key} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{s.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.cream }}>{s.label}</div>
                      <div style={{ fontSize:11, color: socialLinks[s.key] ? s.color : T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {socialLinks[s.key] || s.placeholder}
                      </div>
                    </div>
                    <button onClick={() => { setSocialModal(s.key); setSocialInput(socialLinks[s.key]||""); }}
                      style={{ background:socialLinks[s.key]?T.bgCardAlt:"rgba(0,207,196,0.08)", border:`1px solid ${socialLinks[s.key]?T.borderMid:T.gold}`, borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:socialLinks[s.key]?T.creamMid:T.gold, cursor:"pointer", whiteSpace:"nowrap" }}>
                      {socialLinks[s.key] ? "Edit" : "Connect"}
                    </button>
                  </div>
                ))}
                <p style={{ fontSize:11, color:T.muted, marginTop:14, lineHeight:1.5 }}>
                  Connected profiles display on your Oshun storefront page, helping customers find and follow you.
                </p>
              </div>
            </div>

            {/* Featured Brands */}
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <span style={{ fontSize:14, fontWeight:700, color:T.cream }}>Featured Brand Partners</span>
                <Btn variant="outline" style={{ padding:"7px 14px", fontSize:11 }}>+ Add Brand</Btn>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:14 }}>
                {FEATURED_BRANDS.map(b => (
                  <div key={b.id} style={{ background:T.bgCardAlt, border:`1px solid ${b.active ? T.borderGlow : T.borderMid}`, borderRadius:14, padding:16, display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${b.color}22`, border:`1px solid ${b.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:b.color, flexShrink:0 }}>{b.logo}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</div>
                      <div style={{ fontSize:11, color:T.muted }}>{b.category}</div>
                      <div style={{ fontSize:10, fontWeight:700, color: b.active ? T.success : T.muted, marginTop:3 }}>{b.active ? "● Active" : "○ Inactive"}</div>
                    </div>
                  </div>
                ))}
                <div style={{ background:"rgba(0,207,196,0.03)", border:`1px dashed ${T.borderMid}`, borderRadius:14, padding:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer", minHeight:82 }}>
                  <Plus size={20} color={T.muted}/>
                  <span style={{ fontSize:12, color:T.muted }}>Add brand</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ INVENTORY TAB ═══════════════ */}
        {tab === "inventory" && (
          <div>
            {/* Mode selector */}
            <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
              {[
                { key:"manual", label:"✏️  Manual Entry" },
                { key:"scan",   label:"📷  Scan by Phone" },
                { key:"csv",    label:"📁  Bulk CSV Upload" },
              ].map(m => (
                <button key={m.key} onClick={() => setInvMode(m.key)} style={{ padding:"10px 20px", borderRadius:10, border:`1px solid ${invMode===m.key?T.gold:T.borderMid}`, background: invMode===m.key ? "rgba(0,207,196,0.1)" : T.bgCard, color: invMode===m.key ? T.gold : T.creamMid, fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Manual entry */}
            {invMode === "manual" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:20, marginBottom:24 }}>
                <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:20 }}>Add New Item</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={labelStyle}>Product Name *</label>
                      <input value={manualForm.name} onChange={e => setManualForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Jamaican Black Castor Oil" style={inputStyle(manualErrors.name)}/>
                      {manualErrors.name && <div style={{ fontSize:11, color:T.error, marginTop:4 }}>{manualErrors.name}</div>}
                    </div>
                    <div>
                      <label style={labelStyle}>SKU *</label>
                      <input value={manualForm.sku} onChange={e => setManualForm(p=>({...p,sku:e.target.value}))} placeholder="e.g. JBCO-8OZ" style={inputStyle(manualErrors.sku)}/>
                      {manualErrors.sku && <div style={{ fontSize:11, color:T.error, marginTop:4 }}>{manualErrors.sku}</div>}
                    </div>
                    <div>
                      <label style={labelStyle}>Price ($) *</label>
                      <input type="number" value={manualForm.price} onChange={e => setManualForm(p=>({...p,price:e.target.value}))} placeholder="13.99" style={inputStyle(manualErrors.price)}/>
                      {manualErrors.price && <div style={{ fontSize:11, color:T.error, marginTop:4 }}>{manualErrors.price}</div>}
                    </div>
                    <div>
                      <label style={labelStyle}>Qty in Stock *</label>
                      <input type="number" value={manualForm.qty} onChange={e => setManualForm(p=>({...p,qty:e.target.value}))} placeholder="24" style={inputStyle(manualErrors.qty)}/>
                      {manualErrors.qty && <div style={{ fontSize:11, color:T.error, marginTop:4 }}>{manualErrors.qty}</div>}
                    </div>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={labelStyle}>Category</label>
                      <select value={manualForm.category} onChange={e => setManualForm(p=>({...p,category:e.target.value}))} style={{ ...inputStyle(false), appearance:"none" }}>
                        {PRODUCT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={labelStyle}>Description (optional)</label>
                      <textarea value={manualForm.description} onChange={e => setManualForm(p=>({...p,description:e.target.value}))} placeholder="Brief product description..." rows={2} style={{ ...inputStyle(false), resize:"vertical", lineHeight:1.5 }}/>
                    </div>
                  </div>
                  <Btn style={{ width:"100%", padding:13 }} onClick={addManualItem}>
                    <Plus size={14}/> Add to Inventory
                  </Btn>
                </div>

                {/* Live inventory table */}
                <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:16 }}>Current Inventory <span style={{ fontSize:12, color:T.muted, fontWeight:400 }}>({invItems.length} items)</span></div>
                  <div style={{ overflow:"auto", maxHeight:340 }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ borderBottom:`1px solid ${T.borderMid}` }}>
                          {["Product","SKU","Price","Qty"].map(h => <th key={h} style={{ textAlign:"left", fontSize:11, fontWeight:700, color:T.muted, padding:"6px 8px", whiteSpace:"nowrap" }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {invItems.map((item, i) => (
                          <tr key={item.id} style={{ borderBottom: i < invItems.length-1 ? `1px solid ${T.border}` : "none" }}>
                            <td style={{ padding:"10px 8px", fontSize:12, color:T.cream, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</td>
                            <td style={{ padding:"10px 8px", fontSize:11, color:T.muted, whiteSpace:"nowrap" }}>{item.sku}</td>
                            <td style={{ padding:"10px 8px", fontSize:12, color:T.gold, whiteSpace:"nowrap" }}>${item.price.toFixed(2)}</td>
                            <td style={{ padding:"10px 8px" }}>
                              <span style={{ fontSize:11, fontWeight:700, color: item.qty < 10 ? T.error : T.success, background: item.qty < 10 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", padding:"2px 8px", borderRadius:20 }}>{item.qty}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


            {/* ── Brand Partner Inventory in Stock ── */}
            <div style={{ marginTop:28 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:T.cream, letterSpacing:"-0.01em" }}>Brand Partner Inventory</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>Products from Oshun brand partners currently stocked at your location</div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:T.purple, background:`${T.purple}18`, border:`1px solid ${T.purple}33`, padding:"4px 12px", borderRadius:20 }}>3 brands active</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:14 }}>
                {[
                  { brand:"Soleil Botanics",    sku:"SB-001", name:"24K Rosehip Face Oil",     qty:12, low:5,  price:68.00, avatar:"SB", color:T.gold    },
                  { brand:"Soleil Botanics",    sku:"SB-002", name:"Squalane Body Elixir",      qty: 8, low:5,  price:52.00, avatar:"SB", color:T.gold    },
                  { brand:"Melanin Apothecary", sku:"MA-004", name:"Bakuchiol Glow Serum",      qty: 3, low:5,  price:58.00, avatar:"MA", color:T.purple  },
                  { brand:"Melanin Apothecary", sku:"MA-007", name:"Barrier Repair Night Cream",qty:15, low:5,  price:62.00, avatar:"MA", color:T.purple  },
                  { brand:"NatureLocked Hair",  sku:"NL-012", name:"Grow & Thrive Scalp Elixir",qty: 0, low:5,  price:34.00, avatar:"NL", color:T.muted   },
                  { brand:"NatureLocked Hair",  sku:"NL-015", name:"Moisture Seal Leave-In",    qty:21, low:5,  price:28.00, avatar:"NL", color:T.muted   },
                ].map((item, i) => (
                  <div key={i} style={{ background:T.bgCard, border:`1px solid ${item.qty === 0 ? T.error+"44" : item.qty <= item.low ? T.gold+"55" : T.borderMid}`, borderRadius:14, padding:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${item.color}33,${item.color}55)`, border:`1px solid ${item.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:item.color, flexShrink:0 }}>{item.avatar}</div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:11, color:T.muted, marginBottom:1 }}>{item.brand}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.cream, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:11, color:T.muted }}>SKU: {item.sku}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:T.gold, marginTop:2 }}>${item.price.toFixed(2)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10, color:T.muted, marginBottom:3 }}>IN STOCK</div>
                        <span style={{ fontSize:13, fontWeight:800, color: item.qty === 0 ? T.error : item.qty <= item.low ? "#E67E00" : T.success, background: item.qty === 0 ? "rgba(239,68,68,0.12)" : item.qty <= item.low ? "rgba(230,126,0,0.12)" : "rgba(34,197,94,0.12)", border:`1px solid ${item.qty === 0 ? T.error : item.qty <= item.low ? "#E67E00" : T.success}33`, padding:"3px 10px", borderRadius:20 }}>
                          {item.qty === 0 ? "Out" : item.qty} {item.qty > 0 ? "units" : "of stock"}
                        </span>
                      </div>
                    </div>
                    {(item.qty === 0 || item.qty <= item.low) && item.qty > 0 && (
                      <div style={{ marginTop:10, padding:"6px 10px", background:`rgba(230,126,0,0.08)`, border:`1px solid rgba(230,126,0,0.25)`, borderRadius:8, fontSize:11, color:"#E67E00" }}>
                        ⚠  Low stock — contact Oshun to reorder
                      </div>
                    )}
                    {item.qty === 0 && (
                      <div style={{ marginTop:10, padding:"6px 10px", background:`rgba(239,68,68,0.08)`, border:`1px solid rgba(239,68,68,0.25)`, borderRadius:8, fontSize:11, color:T.error }}>
                        ✕  Out of stock — reorder request sent to brand
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Scan mode */}
            {invMode === "scan" && (
              <div style={{ maxWidth:440, margin:"0 auto" }}>
                <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:20, padding:28, textAlign:"center" }}>
                  {scanState === "idle" && (
                    <>
                      <div style={{ width:80, height:80, borderRadius:20, background:`linear-gradient(135deg, ${T.gold}22, ${T.gold}44)`, border:`1px solid ${T.gold}44`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                        <Camera size={36} color={T.gold}/>
                      </div>
                      <h3 style={{ fontSize:18, fontWeight:800, color:T.cream, marginBottom:8 }}>Scan Barcode</h3>
                      <p style={{ fontSize:13, color:T.creamMid, marginBottom:24, lineHeight:1.5 }}>
                        Point your phone camera at a product barcode. We'll auto-fill the product details for you.
                      </p>
                      <Btn style={{ padding:"13px 32px", fontSize:14 }} onClick={startScan}>
                        <Camera size={15}/> Start Scanner
                      </Btn>
                    </>
                  )}
                  {scanState === "scanning" && (
                    <>
                      <div style={{ position:"relative", width:220, height:160, margin:"0 auto 24px", background:"#000", borderRadius:16, overflow:"hidden", border:`2px solid ${T.gold}` }}>
                        <div style={{ position:"absolute", inset:0, background:"rgba(0,207,196,0.05)" }}/>
                        {/* Corner markers */}
                        {[{top:8,left:8},{top:8,right:8},{bottom:8,left:8},{bottom:8,right:8}].map((pos,i) => (
                          <div key={i} style={{ position:"absolute", ...pos, width:20, height:20, borderTop: (pos.top!==undefined)?`3px solid ${T.gold}`:"none", borderBottom:(pos.bottom!==undefined)?`3px solid ${T.gold}`:"none", borderLeft:(pos.left!==undefined)?`3px solid ${T.gold}`:"none", borderRight:(pos.right!==undefined)?`3px solid ${T.gold}`:"none" }}/>
                        ))}
                        {/* Scan line */}
                        <div style={{ position:"absolute", left:16, right:16, height:2, background:`linear-gradient(90deg, transparent, ${T.gold}, transparent)`, top:"50%", animation:"shimmer 1.5s infinite" }}/>
                        <div style={{ position:"absolute", bottom:12, left:0, right:0, textAlign:"center", fontSize:11, color:T.gold, fontWeight:600 }}>Scanning...</div>
                      </div>
                      <p style={{ fontSize:13, color:T.creamMid }}>Hold steady — reading barcode</p>
                    </>
                  )}
                  {scanState === "result" && scanResult && (
                    <>
                      <div style={{ background:T.bgCardAlt, border:`1px solid ${T.borderGlow}`, borderRadius:14, padding:20, marginBottom:20, textAlign:"left" }}>
                        <div style={{ fontSize:11, color:T.gold, fontWeight:700, marginBottom:10 }}>✓ Product Found</div>
                        {[
                          { label:"Name",     val: scanResult.name     },
                          { label:"SKU",      val: scanResult.sku      },
                          { label:"Price",    val: `$${scanResult.price}` },
                          { label:"Category", val: scanResult.category },
                        ].map(f => (
                          <div key={f.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                            <span style={{ fontSize:12, color:T.muted }}>{f.label}</span>
                            <span style={{ fontSize:12, color:T.cream, fontWeight:600 }}>{f.val}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:10 }}>
                        <button onClick={() => { setScanState("idle"); setScanResult(null); }} style={{ flex:1, padding:"11px", borderRadius:10, border:`1px solid ${T.borderMid}`, background:T.bgCardAlt, color:T.creamMid, fontSize:13, fontWeight:600, cursor:"pointer" }}>Rescan</button>
                        <Btn style={{ flex:1, padding:"11px" }} onClick={confirmScan}>Add to Inventory</Btn>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CSV upload */}
            {invMode === "csv" && (
              <div style={{ maxWidth:600, margin:"0 auto" }}>
                <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:20, padding:28 }}>
                  <h3 style={{ fontSize:16, fontWeight:800, color:T.cream, marginBottom:6 }}>Bulk CSV Upload</h3>
                  <p style={{ fontSize:13, color:T.creamMid, marginBottom:20, lineHeight:1.5 }}>
                    Upload a <strong style={{ color:T.cream }}>.csv file</strong> with columns: <code style={{ color:T.gold, background:T.bgCardAlt, padding:"1px 6px", borderRadius:4 }}>name, sku, price, qty, category</code>
                  </p>

                  {!csvPreview && (
                    <div
                      onClick={() => csvInputRef.current?.click()}
                      style={{ border:`2px dashed ${T.borderMid}`, borderRadius:16, padding:"40px 20px", textAlign:"center", cursor:"pointer", transition:"border-color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor=T.gold}
                      onMouseLeave={e => e.currentTarget.style.borderColor=T.borderMid}
                    >
                      <div style={{ fontSize:36, marginBottom:12 }}>📁</div>
                      <div style={{ fontSize:14, fontWeight:600, color:T.cream, marginBottom:6 }}>Drop CSV file here or click to browse</div>
                      <div style={{ fontSize:12, color:T.muted }}>Supports .csv files up to 5MB</div>
                      <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCsvFile} style={{ display:"none" }}/>
                    </div>
                  )}

                  {csvPreview && (
                    <div>
                      <div style={{ fontSize:13, color:T.success, fontWeight:700, marginBottom:14 }}>
                        ✓ File loaded — {csvPreview.total} items detected
                        {csvPreview.total > 5 && <span style={{ color:T.muted, fontWeight:400 }}> (showing first 5)</span>}
                      </div>
                      <div style={{ overflowX:"auto", marginBottom:20 }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                          <thead>
                            <tr style={{ borderBottom:`1px solid ${T.borderMid}` }}>
                              {csvPreview.headers.map(h => (
                                <th key={h} style={{ textAlign:"left", padding:"8px 10px", color:T.muted, fontWeight:700, whiteSpace:"nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.rows.map((row, i) => (
                              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                                {csvPreview.headers.map(h => (
                                  <td key={h} style={{ padding:"8px 10px", color:T.cream, whiteSpace:"nowrap", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis" }}>{row[h]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display:"flex", gap:10 }}>
                        <button onClick={() => setCsvPreview(null)} style={{ flex:1, padding:"11px", borderRadius:10, border:`1px solid ${T.borderMid}`, background:T.bgCardAlt, color:T.creamMid, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
                        <Btn style={{ flex:2, padding:"11px" }} onClick={importCsv} disabled={csvImporting}>
                          {csvImporting ? "Importing..." : `Import ${csvPreview.total} Items`}
                        </Btn>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop:24, padding:"14px 16px", background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:12 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.creamMid, marginBottom:8 }}>CSV Format Example</div>
                    <div style={{ fontFamily:"monospace", fontSize:11, color:T.muted, lineHeight:1.8 }}>
                      name,sku,price,qty,category<br/>
                      Curl Defining Gel,CDG-001,24.99,18,Hair Care<br/>
                      Rosemary Mint Oil,RMO-004,12.99,34,Hair Care
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ ORDERS TAB ═══════════════ */}
        {tab === "orders" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:16 }}>
              {orders.map(order => {
                const idx  = ORDER_FLOW.indexOf(order.status);
                const done = order.status === "Delivered";
                const dispatching = dispatchingId === order.id;
                return (
                  <div key={order.id} style={{ background:T.bgCard, border:`1px solid ${done?T.borderMid:T.borderGlow}`, borderRadius:16, padding:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:800, color:T.cream }}>{order.id}</div>
                        <div style={{ fontSize:12, color:T.creamMid }}>{order.customer} · {order.time}</div>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color: statusColor[order.status]||T.muted, background:`${statusColor[order.status]||T.muted}18`, border:`1px solid ${statusColor[order.status]||T.muted}33`, padding:"3px 10px", borderRadius:20 }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:T.creamMid, marginBottom:4 }}>{order.items}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.gold, marginBottom:12 }}>${order.total.toFixed(2)}</div>
                    <div style={{ fontSize:11, color:T.muted, marginBottom:14 }}>📍 {order.address}</div>
                    {/* Progress bar */}
                    <div style={{ display:"flex", gap:4, marginBottom:14 }}>
                      {ORDER_FLOW.map((s, i) => (
                        <div key={s} style={{ flex:1, height:3, borderRadius:4, background: i <= idx ? T.gold : T.borderMid, transition:"background 0.3s" }}/>
                      ))}
                    </div>
                    {!done && (
                      <div style={{ display:"flex", gap:8 }}>
                        {order.status === "Ready for Pickup" ? (
                          <Btn style={{ flex:1, padding:"9px", fontSize:12 }} onClick={() => handleDispatch(order.id)} disabled={dispatching}>
                            {dispatching ? "Dispatching..." : "🚗 Dispatch Driver"}
                          </Btn>
                        ) : (
                          <Btn style={{ flex:1, padding:"9px", fontSize:12 }} onClick={() => advanceOrder(order.id)}>
                            Advance → {ORDER_FLOW[Math.min(idx+1, ORDER_FLOW.length-1)]}
                          </Btn>
                        )}
                      </div>
                    )}
                    {done && <div style={{ fontSize:12, color:T.success, fontWeight:700, textAlign:"center" }}>✓ Order Complete</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
        {tab === "analytics" && (
          <div>
            {/* KPI stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:16, marginBottom:24 }}>
              {[
                { label:"Revenue (7d)",   value:"$3,464",  delta:"+18%", icon:"💰" },
                { label:"Orders (7d)",    value:"47",      delta:"+12%", icon:"🧾" },
                { label:"Avg Order",      value:"$73.71",  delta:"+5%",  icon:"📈" },
                { label:"Low Stock",      value:"2 items", delta:"",     icon:"⚠️", warn:true },
              ].map(s => (
                <div key={s.label} style={{ background:T.bgCard, border:`1px solid ${s.warn?"rgba(239,68,68,0.3)":T.borderMid}`, borderRadius:16, padding:20 }}>
                  <div style={{ fontSize:20, marginBottom:10 }}>{s.icon}</div>
                  <div style={{ fontSize:22, fontWeight:900, color: s.warn?T.error:T.cream, letterSpacing:"-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{s.label}</div>
                  {s.delta && <div style={{ fontSize:11, fontWeight:700, color:T.success, marginTop:6 }}>{s.delta} vs last week</div>}
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:20 }}>
              {/* Revenue bar chart */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:20 }}>7-Day Revenue</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:140 }}>
                  {weekRevenue.map((v, i) => (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                      <div style={{ fontSize:9, color:T.muted }}>${v}</div>
                      <div style={{ width:"100%", borderRadius:"4px 4px 0 0", background:`linear-gradient(180deg, ${T.gold}, ${T.goldDark})`, height: `${(v/maxRev)*110}px`, transition:"height 0.4s" }}/>
                      <div style={{ fontSize:10, color:T.muted }}>{weekDays[i]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top products */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:16 }}>Top Products</div>
                {topProducts.map((p, i) => (
                  <div key={p.name} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:12, color:T.cream, fontWeight: i===0?700:400 }}>{p.name}</span>
                      <span style={{ fontSize:12, color:T.gold, fontWeight:700 }}>${p.revenue.toFixed(0)}</span>
                    </div>
                    <div style={{ background:T.borderMid, borderRadius:4, height:5, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(p.sales/topProducts[0].sales)*100}%`, background:`linear-gradient(90deg, ${T.gold}, ${T.goldLight})`, borderRadius:4, transition:"width 0.6s" }}/>
                    </div>
                    <div style={{ fontSize:10, color:T.muted, marginTop:3 }}>{p.sales} units sold</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ COMMUNITY TAB ═══════════════ */}
        {tab === "community" && (
          <div>
            {/* Header */}
            <div style={{ marginBottom:24 }}>
              <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:22, fontWeight:700, color:T.cream, margin:"0 0 6px" }}>Business Community</h3>
              <p style={{ fontSize:13, color:T.muted, margin:0 }}>Share updates, promos, and tips directly with your Oshun customers.</p>
            </div>

            {/* Compose box */}
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderGlow}`, borderRadius:18, padding:24, marginBottom:24 }}>
              <div style={{ display:"flex", gap:12, marginBottom:16 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${T.gold},${T.goldDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:T.bg, flexShrink:0 }}>
                  {bizInfo.name.charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.cream }}>{bizInfo.name}</div>
                  <div style={{ fontSize:11, color:T.gold }}>Business · Verified Partner</div>
                </div>
              </div>

              {/* Post type selector */}
              <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                {BIZ_POST_TYPES.map(pt => (
                  <button key={pt.id} onClick={() => setBizPostCategory(pt.id)}
                    style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${bizPostCategory===pt.id ? T.gold : T.borderMid}`, background: bizPostCategory===pt.id ? `rgba(200,168,75,0.15)` : T.bgCardAlt, color: bizPostCategory===pt.id ? T.gold : T.creamMid, transition:"all 0.15s" }}>
                    {pt.label}
                  </button>
                ))}
              </div>

              <textarea
                value={bizPostContent}
                onChange={e => setBizPostContent(e.target.value)}
                placeholder="Share a promotion, beauty tip, or business update with the Oshun community..."
                rows={4}
                style={{ width:"100%", background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:12, padding:"13px 16px", color:T.cream, fontSize:14, outline:"none", resize:"vertical", fontFamily:'"Jost",sans-serif', lineHeight:1.6, boxSizing:"border-box" }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14 }}>
                <span style={{ fontSize:11, color:T.muted }}>{bizPostContent.length}/500 characters</span>
                <Btn onClick={submitBizPost} disabled={bizPostLoading || !bizPostContent.trim()} style={{ padding:"10px 22px" }}>
                  {bizPostLoading ? "Posting…" : <><Send size={13}/> Post to Community</>}
                </Btn>
              </div>
            </div>

            {/* Community tips */}
            <div style={{ background:`rgba(74,171,191,0.06)`, border:`1px solid rgba(74,171,191,0.2)`, borderRadius:14, padding:"14px 18px", marginBottom:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.seafoam, marginBottom:6 }}>💡 Community Tips</div>
              <div style={{ fontSize:12, color:T.creamMid, lineHeight:1.6 }}>
                Posts from verified businesses get priority placement in the "For You" feed. Promos with discount codes get 2× engagement. Beauty tips build long-term follower trust.
              </div>
            </div>

            {/* Your posts */}
            {bizPosts.length > 0 && (
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:14 }}>Your Posts</div>
                {bizPosts.map(post => (
                  <div key={post.id} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:20, marginBottom:14 }}>
                    <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${T.gold},${T.goldDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:T.bg, flexShrink:0 }}>
                        {bizInfo.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.cream }}>{bizInfo.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{BIZ_POST_TYPES.find(p=>p.id===post.category)?.label || "Update"} · just now</div>
                      </div>
                    </div>
                    <p style={{ fontSize:14, color:T.cream, lineHeight:1.6, margin:"0 0 12px" }}>{post.content}</p>
                    <div style={{ display:"flex", gap:16 }}>
                      <span style={{ fontSize:12, color:T.muted }}><Heart size={12} style={{ marginRight:4 }}/>{post.likes_count} likes</span>
                      <span style={{ fontSize:12, color:T.muted }}><MessageCircle size={12} style={{ marginRight:4 }}/>{(post.community_comments||[]).length} comments</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bizPosts.length === 0 && (
              <div style={{ textAlign:"center", padding:"40px 20px", background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16 }}>
                <div style={{ fontSize:32, marginBottom:10 }}>📢</div>
                <div style={{ fontSize:15, fontWeight:700, color:T.cream, marginBottom:6 }}>No posts yet</div>
                <div style={{ fontSize:13, color:T.muted }}>Write your first update above to connect with the Oshun community.</div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ═══════════════ EDIT PROFILE MODAL ═══════════════ */}
      {profileModalOpen && profileDraft && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderGlow}`, borderRadius:22, padding:"28px 28px 24px", maxWidth:520, width:"100%", maxHeight:"90vh", overflowY:"auto", position:"relative", boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }}>
            {/* Close */}
            <button onClick={() => setProfileModalOpen(false)} style={{ position:"absolute", top:14, right:14, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:8, width:32, height:32, cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", justifyContent:"center" }}><X size={14}/></button>

            <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:20, fontWeight:700, color:T.cream, marginBottom:4 }}>Edit Profile</h3>
            <p style={{ fontSize:13, color:T.muted, marginBottom:22 }}>Update your business info and profile picture.</p>

            {/* Profile Picture */}
            <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:24, padding:18, background:T.bgCardAlt, borderRadius:14, border:`1px solid ${T.borderMid}` }}>
              <div style={{ width:72, height:72, borderRadius:16, background:`linear-gradient(135deg,${T.gold},${T.goldDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:900, color:T.bg, flexShrink:0, overflow:"hidden" }}>
                {profilePicPreview ? <img src={profilePicPreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : bizInfo.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.cream, marginBottom:4 }}>Business Photo</div>
                <div style={{ fontSize:12, color:T.muted, marginBottom:10 }}>Appears on your Oshun storefront and community posts.</div>
                <label style={{ cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7, padding:"8px 14px", background:`rgba(200,168,75,0.12)`, border:`1px solid rgba(200,168,75,0.35)`, borderRadius:8, fontSize:12, fontWeight:600, color:T.gold }}>
                  <Camera size={13}/> Upload Photo
                  <input type="file" accept="image/*" onChange={handleProfilePicChange} style={{ display:"none" }}/>
                </label>
              </div>
            </div>

            {/* Fields */}
            {[
              { key:"name",     label:"Business Name",   placeholder:"Crown & Glory Beauty"                       },
              { key:"tagline",  label:"Tagline",          placeholder:"Your neighborhood beauty hub…"              },
              { key:"phone",    label:"Phone",            placeholder:"(202) 555-0000"                             },
              { key:"address",  label:"Address",          placeholder:"123 Main St, Washington DC 20001"           },
              { key:"category", label:"Category",         placeholder:"Beauty Supply & Salon"                      },
              { key:"hours",    label:"Business Hours",   placeholder:"Mon–Fri 9am–8pm · Sat 10am–6pm"             },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:16 }}>
                <label style={{ ...labelStyle, marginBottom:6 }}>{f.label}</label>
                <input
                  value={profileDraft[f.key] || ""}
                  onChange={e => setProfileDraft(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ ...inputStyle(false), fontSize:13 }}
                />
              </div>
            ))}

            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              <button onClick={() => setProfileModalOpen(false)} style={{ flex:1, padding:"12px", background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:10, color:T.creamMid, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <Btn onClick={saveProfileModal} style={{ flex:2, padding:"12px" }}>Save Changes</Btn>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ORDER TRACKING PAGE
// ─────────────────────────────────────────────────────────────
const DELIVERY_STATUSES = [
  { label: "Order Placed",    icon: "📋", detail: "Your order has been received by the store."        },
  { label: "Being Prepared",  icon: "🧴", detail: "The store is carefully packing your items."        },
  { label: "Driver Assigned", icon: "🚗", detail: "A driver has been assigned to your order."         },
  { label: "On the Way",      icon: "🛣️", detail: "Your order is heading to your location."           },
  { label: "Arriving Soon",   icon: "📍", detail: "Your driver is less than 5 minutes away!"          },
  { label: "Delivered",       icon: "✅", detail: "Your order has been delivered. Enjoy!"             },
];

const MOCK_DRIVER = { name: "Marcus J.", rating: 4.9, vehicle: "Black Honda Accord", plate: "DC-7842", avatar: "MJ" };

function TrackingPage({ order, setPage, setCart }) {
  // statusIdx reads from shared App state (order.statusIdx) so that
  // advances from BusinessDashboard or DriverDashboard are reflected here
  // in real time without any polling. The local sim-timer acts as a
  // demo fallback when neither dashboard is open.
  const externalStatus               = order?.statusIdx ?? 0;
  const [simStatus,  setSimStatus]   = useState(externalStatus);
  const statusIdx                    = Math.max(externalStatus, simStatus);
  const [eta,        setEta]         = useState(order?.eta ?? 32);
  const timerRef                     = useRef(null);
  const etaRef                       = useRef(null);

  // Keep simStatus in sync whenever the external status jumps ahead
  useEffect(() => {
    if (externalStatus > simStatus) setSimStatus(externalStatus);
  }, [externalStatus]);

  // Demo sim-timer — only fires if external hasn't already advanced
  useEffect(() => {
    if (statusIdx >= DELIVERY_STATUSES.length - 1) return;
    timerRef.current = setTimeout(() => setSimStatus(s => Math.min(s + 1, DELIVERY_STATUSES.length - 1)), 7000);
    return () => clearTimeout(timerRef.current);
  }, [statusIdx]);

  useEffect(() => {
    if (statusIdx >= DELIVERY_STATUSES.length - 1) { setEta(0); return; }
    etaRef.current = setInterval(() => setEta(e => Math.max(e - 1, 0)), 60000);
    return () => clearInterval(etaRef.current);
  }, [statusIdx]);

  const isDelivered = statusIdx === DELIVERY_STATUSES.length - 1;

  // SVG route map dimensions
  const mapW = 360, mapH = 160;
  const storeX = 52, storeY = 82;
  const homeX  = 310, homeY = 82;
  // Slightly curved midpoint
  const midX = (storeX + homeX) / 2, midY = 42;
  // Driver dot position along quadratic bezier based on status
  const t = isDelivered ? 1 : statusIdx / (DELIVERY_STATUSES.length - 1);
  const driverX = (1-t)*(1-t)*storeX + 2*(1-t)*t*midX + t*t*homeX;
  const driverY = (1-t)*(1-t)*storeY + 2*(1-t)*t*midY + t*t*homeY;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.25);opacity:0.7} }
        @keyframes slideIn { from{transform:translateX(-12px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes etaBlink { 0%,100%{color:${T.goldLight}} 50%{color:${T.gold}} }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
        <button onClick={() => setPage("home")} style={{ background:"none", border:"none", cursor:"pointer", color:T.gold, display:"flex", alignItems:"center", gap:5, fontWeight:600, fontSize:14 }}>
          <ArrowLeft size={16} /> Home
        </button>
        <div style={{ flex:1, textAlign:"center" }}>
          <h1 style={{ fontSize:22, fontWeight:900, color:T.cream, margin:0 }}>Live Tracking</h1>
          <div style={{ fontSize:12, color:T.muted }}>Order #{order?.id || "OSH-4821"}</div>
        </div>
        <div style={{ width:52 }} />
      </div>

      {/* Animated SVG Route Map */}
      <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:22, overflow:"hidden", marginBottom:20, boxShadow:"0 4px 24px rgba(0,0,0,0.4)" }}>
        <svg width="100%" viewBox={`0 0 ${mapW} ${mapH}`} style={{ display:"block", background:"#0C0C10" }}>
          {/* Road base */}
          <path d={`M ${storeX} ${storeY} Q ${midX} ${midY} ${homeX} ${homeY}`} fill="none" stroke="#1E1E28" strokeWidth={14} strokeLinecap="round" />
          {/* Dotted cyan route */}
          <path d={`M ${storeX} ${storeY} Q ${midX} ${midY} ${homeX} ${homeY}`} fill="none" stroke={T.gold} strokeWidth={2.5} strokeDasharray="6 6" strokeLinecap="round" style={{ opacity: 0.6 }} />
          {/* Completed route highlight */}
          {t > 0 && (
            <path d={`M ${storeX} ${storeY} Q ${midX} ${midY} ${homeX} ${homeY}`} fill="none" stroke={T.goldLight} strokeWidth={2.5} strokeLinecap="round"
              strokeDasharray={`${t * 380} 380`} style={{ opacity:0.9 }} />
          )}

          {/* Store pin */}
          <circle cx={storeX} cy={storeY} r={14} fill={T.purpleDeep} stroke={T.purple} strokeWidth={2} />
          <text x={storeX} y={storeY + 5} textAnchor="middle" fontSize={14}>🏪</text>

          {/* Home pin */}
          <circle cx={homeX} cy={homeY} r={14} fill={isDelivered ? "#1A3A1A" : T.purpleDeep} stroke={isDelivered ? T.success : T.borderMid} strokeWidth={2} />
          <text x={homeX} y={homeY + 5} textAnchor="middle" fontSize={14}>{isDelivered ? "✅" : "🏠"}</text>

          {/* Driver dot */}
          {!isDelivered && statusIdx >= 2 && (
            <>
              <circle cx={driverX} cy={driverY} r={18} fill={T.gold} style={{ opacity:0.15, animation:"pulse 1.5s ease-in-out infinite" }} />
              <circle cx={driverX} cy={driverY} r={10} fill={T.gold} stroke="#080808" strokeWidth={2} />
              <text x={driverX} y={driverY + 5} textAnchor="middle" fontSize={11}>🚗</text>
            </>
          )}

          {/* Labels */}
          <text x={storeX} y={storeY + 28} textAnchor="middle" fontSize={9} fill={T.muted}>Store</text>
          <text x={homeX} y={homeY + 28} textAnchor="middle" fontSize={9} fill={T.muted}>You</text>
        </svg>

        {/* ETA bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 20px", borderTop:`1px solid ${T.borderMid}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Radio size={14} color={isDelivered ? T.success : T.gold} style={isDelivered ? {} : { animation:"pulse 1.5s infinite" }} />
            <span style={{ fontSize:13, color:T.creamMid, fontWeight:600 }}>
              {isDelivered ? "Delivered!" : DELIVERY_STATUSES[statusIdx].label}
            </span>
          </div>
          {!isDelivered && (
            <div style={{ fontSize:13, fontWeight:800, color:T.goldLight }}>
              ETA {eta > 0 ? `~${eta} min` : "Arriving now"}
            </div>
          )}
        </div>
      </div>

      {/* Status Steps */}
      <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:18, padding:"6px 0", marginBottom:20 }}>
        {DELIVERY_STATUSES.map((s, i) => {
          const done    = i < statusIdx;
          const current = i === statusIdx;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 20px", opacity: i > statusIdx ? 0.35 : 1, transition:"opacity 0.4s" }}>
              {/* Step icon */}
              <div style={{
                width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0,
                background: done ? T.success : current ? T.gold : T.bgCardAlt,
                border: `2px solid ${done ? T.success : current ? T.goldDark : T.borderMid}`,
                animation: current ? "pulse 2s ease-in-out infinite" : "none",
              }}>
                {done ? <CheckCircle size={16} color="white" /> : s.icon}
              </div>
              <div style={{ flex:1, animation: current ? "slideIn 0.4s ease" : "none" }}>
                <div style={{ fontWeight:700, fontSize:14, color: done ? T.success : current ? T.cream : T.muted }}>{s.label}</div>
                {current && <div style={{ fontSize:12, color:T.creamMid, marginTop:2 }}>{s.detail}</div>}
              </div>
              {current && !isDelivered && (
                <div style={{ width:8, height:8, borderRadius:"50%", background:T.gold, animation:"pulse 1s ease-in-out infinite" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Driver info card (visible once driver assigned) */}
      {statusIdx >= 2 && !isDelivered && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:18, padding:"18px 22px", marginBottom:20, animation:"slideIn 0.4s ease", boxShadow:`0 0 24px ${T.purpleGlow}` }}>
          <div style={{ fontSize:11, color:T.muted, fontWeight:700, letterSpacing:"0.5px", marginBottom:12 }}>YOUR DRIVER</div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg,${T.purple},${T.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color:"white", border:`2px solid ${T.borderMid}` }}>
              {MOCK_DRIVER.avatar}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, color:T.cream, fontSize:15 }}>{MOCK_DRIVER.name}</div>
              <div style={{ fontSize:12, color:T.muted }}>{MOCK_DRIVER.vehicle} · {MOCK_DRIVER.plate}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontWeight:900, fontSize:18, color:T.gold }}>★ {MOCK_DRIVER.rating}</div>
              <div style={{ fontSize:10, color:T.muted }}>Rating</div>
            </div>
          </div>
        </div>
      )}

      {/* Delivered CTA */}
      {isDelivered && (
        <div style={{ background:"linear-gradient(135deg,rgba(34,197,94,0.08),rgba(0,0,0,0.0))", border:`1px solid ${T.success}55`, borderRadius:20, padding:"28px 24px", textAlign:"center", marginBottom:20, animation:"slideIn 0.4s ease", boxShadow:`0 0 40px rgba(34,197,94,0.12)` }}>
          <div style={{ fontSize:48, marginBottom:10 }}>🎉</div>
          <h2 style={{ color:T.success, fontWeight:900, fontSize:20, marginBottom:6 }}>Order Delivered!</h2>
          <p style={{ color:T.creamMid, fontSize:13, marginBottom:18 }}>Your beauty essentials have arrived. Enjoy!</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <Btn onClick={() => { setPage("home"); if (setCart) setCart([]); }}>Shop Again</Btn>
            <Btn variant="outline">Rate Driver</Btn>
          </div>
        </div>
      )}

      {/* Order detail */}
      {order?.items?.length > 0 && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:"16px 20px" }}>
          <div style={{ fontSize:11, color:T.muted, fontWeight:700, letterSpacing:"0.5px", marginBottom:12 }}>ORDER DETAILS</div>
          {order.items.map((item, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:i < order.items.length - 1 ? 10 : 0 }}>
              <div style={{ width:34, height:34, borderRadius:8, background:item.gradient, flexShrink:0 }} />
              <div style={{ flex:1, fontSize:13 }}>
                <div style={{ color:T.cream, fontWeight:600 }}>{item.name}</div>
                <div style={{ color:T.muted, fontSize:11 }}>×{item.qty}</div>
              </div>
              <span style={{ color:T.gold, fontWeight:700, fontSize:12 }}>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DRIVER DASHBOARD
// ─────────────────────────────────────────────────────────────
const AVAILABLE_PICKUPS = [
  { id: "OSH-4823", store: "Crown & Glory Beauty", pickup: "3214 Georgia Ave NW, DC", dropoff: "1.4 mi away", total: "$38.47", payout: "$7.20", items: 2, eta: "4 min to pickup" },
  { id: "OSH-4824", store: "Bombshell Beauty Supply", pickup: "2400 14th St NW, DC", dropoff: "2.2 mi away", total: "$62.10", payout: "$9.85", items: 3, eta: "8 min to pickup" },
  { id: "OSH-4825", store: "Luxe Skin Studio", pickup: "1740 U St NW, DC", dropoff: "0.9 mi away", total: "$21.99", payout: "$5.40", items: 1, eta: "3 min to pickup" },
];

function DriverDashboard({ user, activeOrder, advanceActiveOrderStatus }) {
  const [driverStatus,  setDriverStatus]  = useState("online");
  const [activeDelivery,setActiveDelivery]= useState(null);
  const [deliveryStatus,setDeliveryStatus]= useState(0);
  const [pickups,       setPickups]       = useState(AVAILABLE_PICKUPS);
  const [tab,           setTab]           = useState("home");

  const earnings = { today: 87.40, week: 342.15, trips: 14, rating: 4.9 };

  const DRIVER_TO_CONSUMER_STATUS = [2, 3, 3, 4, 5];

  useEffect(() => {
    if (!activeDelivery) return;
    if (deliveryStatus >= 4) return;
    const t = setTimeout(() => {
      const next = deliveryStatus + 1;
      setDeliveryStatus(next);
      if (advanceActiveOrderStatus) advanceActiveOrderStatus(DRIVER_TO_CONSUMER_STATUS[next]);
    }, 12000);
    return () => clearTimeout(t);
  }, [activeDelivery, deliveryStatus]);

  const DRIVER_STEPS = ["Heading to Store","Picked Up","On the Way","Arriving Soon","Delivered"];

  const statusConfig = {
    online: { label:"Online",  color:T.success, glow:"rgba(34,197,94,0.2)",  dot:"#22C55E" },
    busy:   { label:"Busy",    color:T.gold,    glow:T.goldGlow,              dot:T.gold    },
    offline:{ label:"Offline", color:T.muted,   glow:"rgba(66,66,78,0.2)",    dot:T.muted   },
  };
  const sc = statusConfig[driverStatus];

  const tabBtnStyle = active => ({
    padding:"10px 20px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
    background: active ? T.gold : T.bgCardAlt,
    color:      active ? T.bg   : T.creamMid,
    transition: "all 0.15s",
  });

  // Today's bonuses
  const BONUSES = [
    { label:"Peak Hours Bonus",     desc:"Drive 6–9 PM · Earn 1.5×",  earned:false, reward:"$12 bonus" },
    { label:"5-Trip Streak",        desc:"3 of 5 trips completed",     earned:false, reward:"$8 bonus"  },
    { label:"Morning Hustle",       desc:"Completed 8–10 AM window",   earned:true,  reward:"+$5 earned"},
  ];

  const RECENT_TRIPS = [
    { id:"OSH-4820", store:"Crown & Glory",        earned:"$7.20", time:"2:14 PM", rating:5   },
    { id:"OSH-4818", store:"Luxe Skin Studio",      earned:"$5.40", time:"11:38 AM",rating:5  },
    { id:"OSH-4815", store:"Bombshell Beauty",      earned:"$9.85", time:"10:02 AM",rating:4  },
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.cream }}>
      {/* Header */}
      <div style={{ background:T.bgCard, borderBottom:`1px solid ${T.borderMid}`, padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.gold, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:3 }}>Driver Hub</div>
          <h2 style={{ fontSize:20, fontWeight:900, color:T.cream, letterSpacing:"-0.02em" }}>{user?.name || "Driver"}</h2>
        </div>
        {/* Driver Hub — single view, no extra tabs shown per scope */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ padding:"8px 16px", borderRadius:10, background:T.gold, color:T.bg, fontSize:13, fontWeight:700 }}>🏠 Driver Hub</div>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"28px 20px" }}>

        {/* ═══════════════ HOME TAB ═══════════════ */}
        {tab === "home" && (
          <div>
            {/* Driver profile hero */}
            <div style={{ background:`linear-gradient(135deg, ${T.bgCardAlt} 0%, #0a0a14 100%)`, border:`1px solid ${T.borderMid}`, borderRadius:20, padding:"28px 28px 24px", marginBottom:24, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-40, right:-40, width:140, height:140, borderRadius:"50%", background:sc.glow, filter:"blur(50px)" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
                {/* Avatar */}
                <div style={{ position:"relative", flexShrink:0 }}>
                  <div style={{ width:70, height:70, borderRadius:"50%", background:`linear-gradient(135deg, ${T.gold}, ${T.goldDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:900, color:T.bg, border:`3px solid ${sc.dot}` }}>
                    {(user?.name||"D").charAt(0)}
                  </div>
                  <div style={{ position:"absolute", bottom:2, right:2, width:16, height:16, borderRadius:"50%", background:sc.dot, border:`2px solid ${T.bg}`, animation: driverStatus==="online"?"driverPulse 2s infinite":"none" }}/>
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontSize:18, fontWeight:900, color:T.cream, marginBottom:4 }}>{user?.name || "Marcus J."}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:12, color:"#FBBF24" }}>★ {earnings.rating}</span>
                    <span style={{ fontSize:11, color:T.muted }}>·</span>
                    <span style={{ fontSize:12, color:T.muted }}>{earnings.trips} trips this week</span>
                    <span style={{ fontSize:11, color:T.muted }}>·</span>
                    <span style={{ fontSize:11, fontWeight:700, color:T.gold, background:"rgba(0,207,196,0.1)", padding:"2px 10px", borderRadius:20 }}>Level 2 Driver</span>
                  </div>
                </div>
                {/* Status toggle */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>Status</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {["online","busy","offline"].map(s => (
                      <button key={s} onClick={() => setDriverStatus(s)} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${driverStatus===s?statusConfig[s].dot:T.borderMid}`, background: driverStatus===s?`${statusConfig[s].dot}22`:T.bgCardAlt, color: driverStatus===s?statusConfig[s].dot:T.muted, fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.15s", textTransform:"capitalize" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Today's stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:16, marginBottom:24 }}>
              {[
                { label:"Today's Earnings", value:`$${earnings.today.toFixed(2)}`, icon:"💵", color:T.success },
                { label:"Week Earnings",    value:`$${earnings.week.toFixed(2)}`,  icon:"💰", color:T.gold   },
                { label:"Trips Today",      value:"6",                              icon:"🚗", color:T.cream  },
                { label:"Acceptance Rate",  value:"94%",                            icon:"✅", color:T.success },
                { label:"Hours Online",     value:"4.2 hrs",                        icon:"⏱️", color:T.creamMid},
                { label:"Driver Rating",    value:`★ ${earnings.rating}`,           icon:"⭐", color:"#FBBF24" },
              ].map(s => (
                <div key={s.label} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:18 }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:s.color, letterSpacing:"-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:20, marginBottom:24 }}>
              {/* Service area */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:16 }}>Service Area</div>
                {/* Simulated DC zone map */}
                <div style={{ background:"#0a0a14", border:`1px solid ${T.borderMid}`, borderRadius:12, height:160, position:"relative", overflow:"hidden", marginBottom:14 }}>
                  {/* Grid lines */}
                  {[20,40,60,80].map(p => (
                    <div key={`h${p}`} style={{ position:"absolute", left:0, right:0, top:`${p}%`, height:1, background:T.border }}/>
                  ))}
                  {[20,40,60,80].map(p => (
                    <div key={`v${p}`} style={{ position:"absolute", top:0, bottom:0, left:`${p}%`, width:1, background:T.border }}/>
                  ))}
                  {/* Active zone highlight */}
                  <div style={{ position:"absolute", left:"25%", top:"20%", width:"50%", height:"60%", background:`${T.gold}10`, border:`1px solid ${T.gold}40`, borderRadius:8 }}/>
                  {/* Driver dot */}
                  <div style={{ position:"absolute", left:"52%", top:"47%", width:10, height:10, borderRadius:"50%", background:T.gold, boxShadow:`0 0 0 4px ${T.goldGlow}`, animation:"driverPulse 2s infinite" }}/>
                  <div style={{ position:"absolute", bottom:8, left:0, right:0, textAlign:"center", fontSize:10, color:T.muted }}>NW Washington, DC Metro Area</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ flex:1, background:T.bgCardAlt, borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, color:T.muted }}>Primary Zone</div>
                    <div style={{ fontSize:12, fontWeight:700, color:T.cream, marginTop:2 }}>NW Washington DC</div>
                  </div>
                  <div style={{ flex:1, background:T.bgCardAlt, borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, color:T.muted }}>Active Hubs</div>
                    <div style={{ fontSize:12, fontWeight:700, color:T.gold, marginTop:2 }}>6 nearby</div>
                  </div>
                </div>
              </div>

              {/* Active bonuses */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:16 }}>Today's Bonuses</div>
                {BONUSES.map((b, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom: i < BONUSES.length-1 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{ width:32, height:32, borderRadius:8, background: b.earned?"rgba(34,197,94,0.1)":"rgba(0,207,196,0.08)", border:`1px solid ${b.earned?"rgba(34,197,94,0.3)":T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                      {b.earned ? "✅" : "🎯"}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color: b.earned?T.success:T.cream }}>{b.label}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{b.desc}</div>
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color: b.earned?T.success:T.gold, whiteSpace:"nowrap" }}>{b.reward}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent trips */}
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:16 }}>Recent Trips</div>
              {RECENT_TRIPS.map((trip, i) => (
                <div key={trip.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom: i < RECENT_TRIPS.length-1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🛍️</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.cream }}>{trip.store}</div>
                    <div style={{ fontSize:11, color:T.muted }}>{trip.id} · {trip.time}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:T.success }}>{trip.earned}</div>
                    <div style={{ fontSize:11, color:"#FBBF24" }}>{"★".repeat(trip.rating)}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:14, textAlign:"center" }}>
                <button onClick={() => setTab("history")} style={{ background:"none", border:"none", cursor:"pointer", color:T.gold, fontSize:12, fontWeight:600 }}>View Full History →</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ PICKUPS TAB ═══════════════ */}
        {tab === "pickups" && (
          <div>
            <div style={{ marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:T.cream }}>Available Pickups</div>
                <div style={{ fontSize:13, color:T.muted, marginTop:2 }}>{pickups.length} orders near you</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:T.bgCard, border:`1px solid ${sc.dot}44`, borderRadius:12, padding:"8px 14px" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:sc.dot, animation: driverStatus==="online"?"pulse 2s infinite":"none" }}/>
                <span style={{ fontSize:12, fontWeight:700, color:sc.color }}>{sc.label}</span>
              </div>
            </div>
            {pickups.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px" }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
                <div style={{ fontSize:16, fontWeight:700, color:T.cream, marginBottom:8 }}>No pickups available right now</div>
                <div style={{ fontSize:13, color:T.muted }}>New orders will appear here automatically.</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:16 }}>
                {pickups.map(p => (
                  <div key={p.id} style={{ background:T.bgCard, border:`1px solid ${T.borderGlow}`, borderRadius:16, padding:20 }} className="oshun-card">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:800, color:T.cream }}>{p.store}</div>
                        <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{p.id}</div>
                      </div>
                      <span style={{ fontSize:14, fontWeight:900, color:T.success }}>{p.payout}</span>
                    </div>
                    {[
                      { icon:"📍", label:"Pickup",  val:p.pickup  },
                      { icon:"🎯", label:"Distance", val:p.dropoff },
                      { icon:"⏱️", label:"ETA",      val:p.eta     },
                    ].map(r => (
                      <div key={r.label} style={{ display:"flex", gap:10, marginBottom:8 }}>
                        <span style={{ fontSize:13 }}>{r.icon}</span>
                        <div>
                          <div style={{ fontSize:10, color:T.muted }}>{r.label}</div>
                          <div style={{ fontSize:12, color:T.cream }}>{r.val}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
                      <span style={{ fontSize:12, color:T.creamMid }}>{p.items} item{p.items>1?"s":""} · {p.total}</span>
                      <Btn style={{ padding:"9px 18px", fontSize:12 }} onClick={() => {
                        setActiveDelivery(p);
                        setDeliveryStatus(0);
                        setPickups(prev => prev.filter(pk => pk.id !== p.id));
                        setTab("active");
                      }}>Accept</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ ACTIVE DELIVERY TAB ═══════════════ */}
        {tab === "active" && (
          <div>
            {!activeDelivery ? (
              <div style={{ textAlign:"center", padding:"60px 20px" }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🚗</div>
                <div style={{ fontSize:16, fontWeight:700, color:T.cream, marginBottom:8 }}>No active delivery</div>
                <div style={{ fontSize:13, color:T.muted, marginBottom:24 }}>Accept a pickup to start earning.</div>
                <Btn onClick={() => setTab("pickups")} style={{ padding:"12px 28px" }}>Browse Pickups</Btn>
              </div>
            ) : (
              <div style={{ maxWidth:500, margin:"0 auto" }}>
                <div style={{ background:T.bgCard, border:`1px solid ${T.borderGlow}`, borderRadius:20, padding:28 }}>
                  <div style={{ textAlign:"center", marginBottom:24 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:T.gold, marginBottom:4 }}>Active Delivery</div>
                    <div style={{ fontSize:18, fontWeight:900, color:T.cream }}>{activeDelivery.store}</div>
                    <div style={{ fontSize:13, color:T.creamMid, marginTop:4 }}>{activeDelivery.id}</div>
                  </div>
                  {/* Steps */}
                  {DRIVER_STEPS.map((step, i) => {
                    const done    = i <  deliveryStatus;
                    const current = i === deliveryStatus;
                    return (
                      <div key={step} style={{ display:"flex", alignItems:"center", gap:14, marginBottom: i < DRIVER_STEPS.length-1 ? 0 : 0 }}>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", background: done?T.success:current?T.gold:T.bgCardAlt, border:`2px solid ${done?T.success:current?T.gold:T.borderMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, transition:"all 0.4s" }}>
                            {done ? "✓" : current ? "→" : i+1}
                          </div>
                          {i < DRIVER_STEPS.length-1 && <div style={{ width:2, height:24, background: done?T.success:T.borderMid, transition:"background 0.4s" }}/>}
                        </div>
                        <span style={{ fontSize:14, fontWeight: current?700:400, color: done?T.success:current?T.gold:T.muted, paddingBottom: i < DRIVER_STEPS.length-1 ? 24 : 0 }}>{step}</span>
                      </div>
                    );
                  })}
                  {deliveryStatus < DRIVER_STEPS.length - 1 && (
                    <Btn style={{ width:"100%", marginTop:24, padding:14 }} onClick={() => {
                      const next = deliveryStatus + 1;
                      setDeliveryStatus(next);
                      if (advanceActiveOrderStatus) advanceActiveOrderStatus(DRIVER_TO_CONSUMER_STATUS[next]);
                    }}>
                      {DRIVER_STEPS[deliveryStatus + 1] ? `Next: ${DRIVER_STEPS[deliveryStatus + 1]}` : "Complete"}
                    </Btn>
                  )}
                  {deliveryStatus === DRIVER_STEPS.length - 1 && (
                    <div>
                      <div style={{ textAlign:"center", padding:"16px 0", fontSize:15, fontWeight:700, color:T.success }}>✓ Delivery Complete!</div>
                      <div style={{ textAlign:"center", fontSize:22, fontWeight:900, color:T.gold, marginBottom:20 }}>{activeDelivery.payout} earned</div>
                      <Btn style={{ width:"100%", padding:14 }} onClick={() => { setActiveDelivery(null); setDeliveryStatus(0); setTab("pickups"); }}>
                        Find Next Pickup
                      </Btn>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ HISTORY TAB ═══════════════ */}
        {tab === "history" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(170px,1fr))", gap:16, marginBottom:24 }}>
              {[
                { label:"All-Time Trips",  value:earnings.trips + 6, icon:"🚗" },
                { label:"All-Time Earned", value:"$429.55",           icon:"💰" },
                { label:"Avg per Trip",    value:"$21.48",            icon:"📈" },
                { label:"Driver Rating",   value:`★ ${earnings.rating}`, icon:"⭐" },
              ].map(s => (
                <div key={s.label} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:18 }}>
                  <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:T.cream, letterSpacing:"-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:24 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.cream, marginBottom:16 }}>Delivery History</div>
              {[
                { id:"OSH-4820", store:"Crown & Glory Beauty",  customer:"Aaliyah J.", earned:"$7.20", time:"Today 2:14 PM",  rating:5 },
                { id:"OSH-4818", store:"Luxe Skin Studio",       customer:"Maya T.",   earned:"$5.40", time:"Today 11:38 AM", rating:5 },
                { id:"OSH-4815", store:"Bombshell Beauty",       customer:"Destiny R.",earned:"$9.85", time:"Today 10:02 AM", rating:4 },
                { id:"OSH-4810", store:"Crown & Glory Beauty",   customer:"Imani W.",  earned:"$7.20", time:"Yesterday",      rating:5 },
              ].map((trip, i, arr) => (
                <div key={trip.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom: i < arr.length-1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`rgba(34,197,94,0.08)`, border:`1px solid rgba(34,197,94,0.2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>✅</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.cream }}>{trip.store}</div>
                    <div style={{ fontSize:11, color:T.muted }}>{trip.id} · {trip.customer} · {trip.time}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:T.success }}>{trip.earned}</div>
                    <div style={{ fontSize:11, color:"#FBBF24" }}>{"★".repeat(trip.rating)}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:14, textAlign:"center" }}>
                <span style={{ fontSize:12, color:T.muted }}>Showing last 4 deliveries · <span style={{ color:T.gold, cursor:"pointer" }}>View All History →</span></span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// JOIN / PARTNER LANDING PAGE
// ─────────────────────────────────────────────────────────────
function JoinPage({ setPage }) {
  const { isMobile } = useBreakpoint();
  const [view,    setView]    = useState("landing"); // "landing" | "driver-form" | "brand-form" | "success"
  const [success, setSuccess] = useState("");        // which type succeeded

  // ── Shared form helpers ────────────────────────────────────
  const inputStyle = (err) => ({
    width: "100%", padding: "13px 16px", borderRadius: 12,
    border: `1.5px solid ${err ? T.error : T.borderMid}`,
    background: T.bgCard, color: T.cream, fontSize: 14, outline: "none",
    fontFamily: "inherit", transition: "border-color 0.15s",
  });
  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: T.creamMid,
    marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.06em",
  };
  const fieldErr = (msg) => (
    <div style={{ fontSize: 12, color: T.error, marginTop: 4 }}>{msg}</div>
  );
  const required = (val) => !val?.trim();

  // ── Driver form state ──────────────────────────────────────
  const [dForm, setDF] = useState({
    name: "", email: "", phone: "", city: "", vehicle: "Car", licensed: "", why: "",
  });
  const [dErr, setDE] = useState({});
  const [dSubmitting, setDSub] = useState(false);

  const submitDriver = () => {
    const e = {};
    if (required(dForm.name))    e.name    = "Required";
    if (required(dForm.email) || !/\S+@\S+\.\S+/.test(dForm.email)) e.email = "Valid email required";
    if (required(dForm.phone))   e.phone   = "Required";
    if (required(dForm.city))    e.city    = "Required";
    if (!dForm.licensed)         e.licensed = "Please select one";
    setDE(e);
    if (Object.keys(e).length) return;
    setDSub(true);
    setTimeout(() => { setDSub(false); setSuccess("driver"); setView("success"); }, 1600);
  };

  // ── Brand form state ───────────────────────────────────────
  const [bForm, setBF] = useState({
    brand: "", contact: "", email: "", phone: "", website: "",
    category: "Skincare", skus: "", cities: "", description: "",
  });
  const [bErr, setBE] = useState({});
  const [bSubmitting, setBSub] = useState(false);

  const submitBrand = () => {
    const e = {};
    if (required(bForm.brand))   e.brand   = "Required";
    if (required(bForm.contact)) e.contact = "Required";
    if (required(bForm.email) || !/\S+@\S+\.\S+/.test(bForm.email)) e.email = "Valid email required";
    if (required(bForm.phone))   e.phone   = "Required";
    if (required(bForm.cities))  e.cities  = "Required";
    setBE(e);
    if (Object.keys(e).length) return;
    setBSub(true);
    setTimeout(() => { setBSub(false); setSuccess("brand"); setView("success"); }, 1600);
  };

  const PRODUCT_CATS = ["Skincare","Hair Care","Makeup","Nails","Fragrance","Body Care","Wellness","Tools","Other"];
  const VEHICLES     = ["Car","SUV","Van","Electric Vehicle","Motorcycle","Bicycle","Other"];

  // ── Shared section styles ──────────────────────────────────
  const cardStyle = {
    background: T.bgCard, borderRadius: 20,
    border: `1px solid ${T.borderMid}`,
    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
  };

  // ─────────────────────────────────────────────────────────
  // SUCCESS VIEW
  // ─────────────────────────────────────────────────────────
  if (view === "success") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ ...cardStyle, maxWidth: 480, width: "100%", padding: "52px 40px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px", boxShadow: T.goldGlow }}>
            ✓
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: T.cream, marginBottom: 12, letterSpacing: "-0.02em" }}>
            Application Received!
          </h2>
          <p style={{ fontSize: 15, color: T.creamMid, lineHeight: 1.6, marginBottom: 32 }}>
            {success === "driver"
              ? "Thanks for applying to drive with Oshun. Our team will review your application and reach out within 2–3 business days."
              : "Thanks for your interest in partnering with Oshun. A member of our brand partnerships team will be in touch within 3–5 business days."}
          </p>
          <div style={{ padding: "16px 20px", background: T.bgCardAlt, borderRadius: 12, marginBottom: 28, fontSize: 13, color: T.creamMid, lineHeight: 1.5 }}>
            📬 Check your inbox — a confirmation has been sent to your email.
          </div>
          <button onClick={() => { setView("landing"); setSuccess(""); }}
            style={{ background: "none", border: `1.5px solid ${T.borderMid}`, borderRadius: 12, padding: "11px 28px", cursor: "pointer", fontSize: 14, fontWeight: 600, color: T.creamMid }}>
            ← Back to Partner Page
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // DRIVER APPLICATION FORM
  // ─────────────────────────────────────────────────────────
  if (view === "driver-form") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, padding: isMobile ? "24px 16px 60px" : "48px 24px 80px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setView("landing")} style={{ background: "none", border: "none", cursor: "pointer", color: T.creamMid, fontSize: 13, fontWeight: 600, marginBottom: 28, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            <ArrowLeft size={15}/> Back
          </button>

          {/* Header */}
          <div style={{ ...cardStyle, padding: isMobile ? "28px 20px" : "36px 36px 28px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🚗</div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.cream, margin: 0, letterSpacing: "-0.02em" }}>Driver Application</h2>
                <p style={{ fontSize: 13, color: T.creamMid, margin: "4px 0 0" }}>Join the Oshun delivery network</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[{ val: "$18–28", label: "Avg / hr" }, { val: "Flexible", label: "Schedule" }, { val: "Weekly", label: "Payouts" }].map(s => (
                <div key={s.label} style={{ background: T.bgCardAlt, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: T.gold }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div style={{ ...cardStyle, padding: isMobile ? "24px 20px" : "32px 36px" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={dForm.name} onChange={e => setDF(p=>({...p,name:e.target.value}))}
                  placeholder="DeAundre Webb" style={inputStyle(dErr.name)}
                  onFocus={e => e.target.style.borderColor=T.gold} onBlur={e => e.target.style.borderColor=dErr.name?T.error:T.borderMid}/>
                {dErr.name && fieldErr(dErr.name)}
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={dForm.email} onChange={e => setDF(p=>({...p,email:e.target.value}))}
                  placeholder="you@email.com" style={inputStyle(dErr.email)}
                  onFocus={e => e.target.style.borderColor=T.gold} onBlur={e => e.target.style.borderColor=dErr.email?T.error:T.borderMid}/>
                {dErr.email && fieldErr(dErr.email)}
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input type="tel" value={dForm.phone} onChange={e => setDF(p=>({...p,phone:e.target.value}))}
                  placeholder="(202) 555-0100" style={inputStyle(dErr.phone)}
                  onFocus={e => e.target.style.borderColor=T.gold} onBlur={e => e.target.style.borderColor=dErr.phone?T.error:T.borderMid}/>
                {dErr.phone && fieldErr(dErr.phone)}
              </div>
              <div>
                <label style={labelStyle}>City / Metro Area *</label>
                <input value={dForm.city} onChange={e => setDF(p=>({...p,city:e.target.value}))}
                  placeholder="Washington, DC" style={inputStyle(dErr.city)}
                  onFocus={e => e.target.style.borderColor=T.gold} onBlur={e => e.target.style.borderColor=dErr.city?T.error:T.borderMid}/>
                {dErr.city && fieldErr(dErr.city)}
              </div>
              <div>
                <label style={labelStyle}>Vehicle Type</label>
                <select value={dForm.vehicle} onChange={e => setDF(p=>({...p,vehicle:e.target.value}))}
                  style={{ ...inputStyle(false), appearance: "none" }}>
                  {VEHICLES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Valid Driver's License? *</label>
                <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                  {["Yes","No"].map(opt => (
                    <button key={opt} onClick={() => setDF(p=>({...p,licensed:opt}))}
                      style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1.5px solid ${dForm.licensed===opt?T.gold:T.borderMid}`, background: dForm.licensed===opt?`${T.goldGlow}`:T.bgCard, color: dForm.licensed===opt?T.gold:T.creamMid, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}>
                      {opt}
                    </button>
                  ))}
                </div>
                {dErr.licensed && fieldErr(dErr.licensed)}
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Why do you want to drive with Oshun?</label>
                <textarea value={dForm.why} onChange={e => setDF(p=>({...p,why:e.target.value}))}
                  placeholder="Tell us a little about yourself and why you're interested..." rows={3}
                  style={{ ...inputStyle(false), resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor=T.gold} onBlur={e => e.target.style.borderColor=T.borderMid}/>
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <Btn onClick={submitDriver} disabled={dSubmitting}
                style={{ width: "100%", padding: "15px", fontSize: 15, fontWeight: 800, borderRadius: 14 }}>
                {dSubmitting ? "Submitting…" : "Submit Driver Application →"}
              </Btn>
              <p style={{ textAlign: "center", fontSize: 12, color: T.muted, marginTop: 14, lineHeight: 1.5 }}>
                By submitting you agree to our terms. We'll never share your information.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // BRAND APPLICATION FORM
  // ─────────────────────────────────────────────────────────
  if (view === "brand-form") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, padding: isMobile ? "24px 16px 60px" : "48px 24px 80px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <button onClick={() => setView("landing")} style={{ background: "none", border: "none", cursor: "pointer", color: T.creamMid, fontSize: 13, fontWeight: 600, marginBottom: 28, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            <ArrowLeft size={15}/> Back
          </button>

          {/* Header */}
          <div style={{ ...cardStyle, padding: isMobile ? "28px 20px" : "36px 36px 28px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏬</div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T.cream, margin: 0, letterSpacing: "-0.02em" }}>Brand Partnership Application</h2>
                <p style={{ fontSize: 13, color: T.creamMid, margin: "4px 0 0" }}>Get your products in front of local beauty shoppers</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[{ val: "50+", label: "Partner Hubs" }, { val: "12 Cities", label: "At Launch" }, { val: "Zero Fees", label: "To Apply" }].map(s => (
                <div key={s.label} style={{ background: T.bgCardAlt, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: T.purple }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div style={{ ...cardStyle, padding: isMobile ? "24px 20px" : "32px 36px" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Brand Name *</label>
                <input value={bForm.brand} onChange={e => setBF(p=>({...p,brand:e.target.value}))}
                  placeholder="Melanin Magic Co." style={inputStyle(bErr.brand)}
                  onFocus={e => e.target.style.borderColor=T.purple} onBlur={e => e.target.style.borderColor=bErr.brand?T.error:T.borderMid}/>
                {bErr.brand && fieldErr(bErr.brand)}
              </div>
              <div>
                <label style={labelStyle}>Contact Name *</label>
                <input value={bForm.contact} onChange={e => setBF(p=>({...p,contact:e.target.value}))}
                  placeholder="Your full name" style={inputStyle(bErr.contact)}
                  onFocus={e => e.target.style.borderColor=T.purple} onBlur={e => e.target.style.borderColor=bErr.contact?T.error:T.borderMid}/>
                {bErr.contact && fieldErr(bErr.contact)}
              </div>
              <div>
                <label style={labelStyle}>Business Email *</label>
                <input type="email" value={bForm.email} onChange={e => setBF(p=>({...p,email:e.target.value}))}
                  placeholder="hello@yourbrand.com" style={inputStyle(bErr.email)}
                  onFocus={e => e.target.style.borderColor=T.purple} onBlur={e => e.target.style.borderColor=bErr.email?T.error:T.borderMid}/>
                {bErr.email && fieldErr(bErr.email)}
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input type="tel" value={bForm.phone} onChange={e => setBF(p=>({...p,phone:e.target.value}))}
                  placeholder="(404) 555-0100" style={inputStyle(bErr.phone)}
                  onFocus={e => e.target.style.borderColor=T.purple} onBlur={e => e.target.style.borderColor=bErr.phone?T.error:T.borderMid}/>
                {bErr.phone && fieldErr(bErr.phone)}
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input value={bForm.website} onChange={e => setBF(p=>({...p,website:e.target.value}))}
                  placeholder="yourbrand.com" style={inputStyle(false)}
                  onFocus={e => e.target.style.borderColor=T.purple} onBlur={e => e.target.style.borderColor=T.borderMid}/>
              </div>
              <div>
                <label style={labelStyle}>Product Category</label>
                <select value={bForm.category} onChange={e => setBF(p=>({...p,category:e.target.value}))}
                  style={{ ...inputStyle(false), appearance: "none" }}>
                  {PRODUCT_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Number of SKUs</label>
                <input type="number" value={bForm.skus} onChange={e => setBF(p=>({...p,skus:e.target.value}))}
                  placeholder="e.g. 6" style={inputStyle(false)}
                  onFocus={e => e.target.style.borderColor=T.purple} onBlur={e => e.target.style.borderColor=T.borderMid}/>
              </div>
              <div>
                <label style={labelStyle}>Target Cities / Markets *</label>
                <input value={bForm.cities} onChange={e => setBF(p=>({...p,cities:e.target.value}))}
                  placeholder="e.g. DC, Atlanta, Houston" style={inputStyle(bErr.cities)}
                  onFocus={e => e.target.style.borderColor=T.purple} onBlur={e => e.target.style.borderColor=bErr.cities?T.error:T.borderMid}/>
                {bErr.cities && fieldErr(bErr.cities)}
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Tell us about your brand</label>
                <textarea value={bForm.description} onChange={e => setBF(p=>({...p,description:e.target.value}))}
                  placeholder="Brief description of your products, who they're made for, and what makes your brand unique..." rows={3}
                  style={{ ...inputStyle(false), resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor=T.purple} onBlur={e => e.target.style.borderColor=T.borderMid}/>
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <button onClick={submitBrand} disabled={bSubmitting}
                style={{ width: "100%", padding: "15px", fontSize: 15, fontWeight: 800, borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`, color: "#fff", transition: "opacity 0.15s", opacity: bSubmitting ? 0.7 : 1 }}>
                {bSubmitting ? "Submitting…" : "Submit Brand Application →"}
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: T.muted, marginTop: 14, lineHeight: 1.5 }}>
                By submitting you agree to our terms. We'll never share your information.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // MAIN LANDING VIEW
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.cream }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(160deg, ${T.goldLight}22 0%, ${T.bg} 60%)`, borderBottom: `1px solid ${T.borderMid}`, padding: isMobile ? "60px 20px 56px" : "80px 40px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Background glow blobs */}
        <div style={{ position: "absolute", top: -60, left: "15%", width: 300, height: 300, borderRadius: "50%", background: T.goldGlow, filter: "blur(80px)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: -40, right: "10%", width: 240, height: 240, borderRadius: "50%", background: T.purpleGlow, filter: "blur(70px)", pointerEvents: "none" }}/>

        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 100, padding: "6px 16px 6px 8px", marginBottom: 28 }}>
            <span style={{ background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 800, color: "#fff" }}>NOW LAUNCHING</span>
            <span style={{ fontSize: 12, color: T.creamMid, fontWeight: 500 }}>Washington DC · Atlanta · Houston</span>
          </div>
          <h1 style={{ fontSize: isMobile ? 34 : 52, fontWeight: 900, color: T.cream, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
            Join the Beauty<br/>
            <span style={{ background: `linear-gradient(90deg, ${T.goldLight}, ${T.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Delivery Movement</span>
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 18, color: T.creamMid, lineHeight: 1.6, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
            Oshun connects beauty brands with local shops and delivers products directly to customers. Whether you drive, sell, or create — there's a place for you.
          </p>

          {/* Dual CTA cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 640, margin: "0 auto" }}>
            {/* Driver CTA */}
            <div style={{ ...cardStyle, padding: "28px 24px", textAlign: "left", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", position: "relative", overflow: "hidden" }}
              className="oshun-card" onClick={() => setView("driver-form")}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: T.goldGlow, filter: "blur(30px)" }}/>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>🚗</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.cream, marginBottom: 8 }}>Become a Driver</h3>
              <p style={{ fontSize: 13, color: T.creamMid, lineHeight: 1.5, marginBottom: 20 }}>Earn on your own schedule delivering beauty products across your city.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: T.gold }}>
                Apply Now <ChevronRight size={14}/>
              </div>
            </div>

            {/* Brand CTA */}
            <div style={{ ...cardStyle, padding: "28px 24px", textAlign: "left", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", position: "relative", overflow: "hidden" }}
              className="oshun-card" onClick={() => setView("brand-form")}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: T.purpleGlow, filter: "blur(30px)" }}/>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>🏬</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.cream, marginBottom: 8 }}>Partner as a Brand</h3>
              <p style={{ fontSize: 13, color: T.creamMid, lineHeight: 1.5, marginBottom: 20 }}>Get your products stocked in local beauty hubs and in front of loyal customers.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: T.purple }}>
                Apply Now <ChevronRight size={14}/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <div style={{ background: T.bgCard, borderBottom: `1px solid ${T.borderMid}`, padding: "24px 32px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 16 }}>
          {[
            { val: "50+",    label: "Partner Hubs",    color: T.gold   },
            { val: "12",     label: "Launch Cities",   color: T.purple },
            { val: "$18–28", label: "Driver Avg / hr", color: T.gold   },
            { val: "100%",   label: "Black-Owned Focus",color: T.purple },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: s.color, letterSpacing: "-0.02em" }}>{s.val}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "48px 16px" : "72px 32px" }}>

        {/* ── DRIVER SECTION ──────────────────────────────── */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚗</div>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.gold, textTransform: "uppercase", letterSpacing: "0.1em" }}>For Drivers</span>
          </div>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, color: T.cream, letterSpacing: "-0.02em", marginBottom: 12 }}>Drive. Earn. Thrive.</h2>
          <p style={{ fontSize: 15, color: T.creamMid, lineHeight: 1.6, maxWidth: 560, marginBottom: 36 }}>
            Oshun drivers make deliveries from local beauty hubs directly to customers. Set your own hours, earn competitive pay, and be part of something bigger.
          </p>

          {/* Benefits grid */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 1 : 2}, 1fr)`, gap: 16, marginBottom: 36 }}>
            {[
              { icon: "💵", title: "Competitive Earnings",    body: "Earn $18–28/hr on average. Weekly direct deposits plus tips, peak bonuses, and streak rewards." },
              { icon: "🗓️", title: "Fully Flexible Hours",    body: "Work when it fits your life. No minimums, no locks — log on when you're ready and go offline any time." },
              { icon: "📱", title: "Simple Driver App",       body: "One tap to go online. Pickups and dropoffs shown on a clean map. Earnings tracked in real time." },
              { icon: "🎯", title: "Bonus Opportunities",     body: "Peak-hour multipliers, 5-trip streak bonuses, and morning hustle windows reward consistent drivers." },
            ].map(b => (
              <div key={b.title} style={{ ...cardStyle, padding: "22px 24px", display: "flex", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.bgCardAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{b.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.cream, marginBottom: 6 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: T.creamMid, lineHeight: 1.5 }}>{b.body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* How it works - driver */}
          <div style={{ ...cardStyle, padding: "28px 28px 24px", marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.cream, marginBottom: 20 }}>How It Works</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 1 : 3}, 1fr)`, gap: 20 }}>
              {[
                { step: "01", title: "Apply in minutes",  body: "Fill out the short form — name, city, vehicle, license. No lengthy vetting process." },
                { step: "02", title: "Get approved",      body: "Our team reviews within 2–3 days. Once approved you'll get access to the driver app." },
                { step: "03", title: "Start earning",     body: "Go online, accept pickups near you, and get paid weekly straight to your bank account." },
              ].map((s, i, arr) => (
                <div key={s.step} style={{ display: "flex", gap: 14, paddingRight: i < arr.length-1 && !isMobile ? 20 : 0, borderRight: i < arr.length-1 && !isMobile ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: T.goldGlow, lineHeight: 1, flexShrink: 0, width: 36, fontVariantNumeric: "tabular-nums" }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.cream, marginBottom: 5 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: T.creamMid, lineHeight: 1.5 }}>{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Btn onClick={() => setView("driver-form")} style={{ padding: "13px 32px", fontSize: 14, fontWeight: 800, borderRadius: 12 }}>
            🚗 Apply to Drive →
          </Btn>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: T.borderMid, marginBottom: 80 }}/>

        {/* ── BRAND SECTION ───────────────────────────────── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏬</div>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.purple, textTransform: "uppercase", letterSpacing: "0.1em" }}>For Brands</span>
          </div>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, color: T.cream, letterSpacing: "-0.02em", marginBottom: 12 }}>Your Products,<br/>Closer to Customers</h2>
          <p style={{ fontSize: 15, color: T.creamMid, lineHeight: 1.6, maxWidth: 560, marginBottom: 36 }}>
            Oshun places your products inside trusted local beauty hubs — the shops your customers already love. You focus on making great products. We handle distribution and delivery.
          </p>

          {/* Benefits grid */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 1 : 2}, 1fr)`, gap: 16, marginBottom: 36 }}>
            {[
              { icon: "📍", title: "Hyper-Local Placement",  body: "Get stocked in curated beauty supply stores, salons, and studios across major metro areas." },
              { icon: "📦", title: "Flexible Fulfillment",   body: "Ship to our partner hubs or set up dropship — we work with whatever logistics model fits your brand." },
              { icon: "📊", title: "Real-Time Analytics",    body: "Track sales, revenue by city, and top-performing products from your Brand Hub dashboard." },
              { icon: "🤝", title: "Community-First Reach",  body: "Oshun is built around Black-owned businesses. Reach loyal customers who shop with intention." },
            ].map(b => (
              <div key={b.title} style={{ ...cardStyle, padding: "22px 24px", display: "flex", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.bgCardAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{b.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.cream, marginBottom: 6 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: T.creamMid, lineHeight: 1.5 }}>{b.body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* How it works - brand */}
          <div style={{ ...cardStyle, padding: "28px 28px 24px", marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.cream, marginBottom: 20 }}>How It Works</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 1 : 3}, 1fr)`, gap: 20 }}>
              {[
                { step: "01", title: "Apply & get matched", body: "Tell us about your brand and target cities. We'll match you with the right hub partners." },
                { step: "02", title: "Stock the shelves",   body: "Ship product to our partner hubs or arrange dropship. We set up your digital storefront." },
                { step: "03", title: "Grow together",       body: "Customers browse, buy, and get same-day delivery. You see every order in your Brand Hub." },
              ].map((s, i, arr) => (
                <div key={s.step} style={{ display: "flex", gap: 14, paddingRight: i < arr.length-1 && !isMobile ? 20 : 0, borderRight: i < arr.length-1 && !isMobile ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: T.purpleGlow, lineHeight: 1, flexShrink: 0, width: 36, fontVariantNumeric: "tabular-nums" }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.cream, marginBottom: 5 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: T.creamMid, lineHeight: 1.5 }}>{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setView("brand-form")}
            style={{ padding: "13px 32px", fontSize: 14, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`, color: "#fff" }}>
            🏬 Apply as a Brand →
          </button>
        </div>

        {/* ── BOTTOM CTA STRIP ────────────────────────────── */}
        <div style={{ background: `linear-gradient(135deg, ${T.bgCard}, ${T.bgCardAlt})`, border: `1px solid ${T.borderMid}`, borderRadius: 20, padding: isMobile ? "32px 24px" : "40px 48px", textAlign: "center" }}>
          <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: T.cream, marginBottom: 10, letterSpacing: "-0.02em" }}>Ready to join Oshun?</h3>
          <p style={{ fontSize: 14, color: T.creamMid, marginBottom: 28, lineHeight: 1.5 }}>
            Applications take less than 3 minutes. Our team reviews every submission personally.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={() => setView("driver-form")} style={{ padding: "12px 28px", fontSize: 14 }}>Apply to Drive</Btn>
            <button onClick={() => setView("brand-form")}
              style={{ padding: "12px 28px", fontSize: 14, fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`, color: "#fff" }}>
              Partner as a Brand
            </button>
          </div>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 20 }}>
            Already have an account?{" "}
            <span style={{ color: T.gold, fontWeight: 600, cursor: "pointer" }} onClick={() => setPage && setPage("home")}>Sign in →</span>
          </p>
        </div>

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// AUTH MODAL
// ─────────────────────────────────────────────────────────────
function AuthModal({ onClose, setUser, setPage }) {
  const [mode,        setMode]        = useState("login");
  const [accountType, setAccountType] = useState("consumer");
  const [form,        setForm]        = useState({ name: "", email: "", password: "", businessName: "" });
  const [showPass,    setShowPass]    = useState(false);

  const submit = () => {
    setUser({ name: form.name || form.email.split("@")[0] || "User", email: form.email, type: accountType, businessName: accountType === "business" ? form.businessName : null });
    onClose();
    // Auto-route each user type to their home view after login
    if (accountType === "business") setPage("dashboard");
    else if (accountType === "brand")    setPage("branddashboard");
    else if (accountType === "driver")   setPage("driver");
    // consumers stay on home
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 420, position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px ${T.glass}`, animation: "fadeUp 0.25s ease" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: T.bgCardAlt, border: `1px solid ${T.borderMid}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: T.muted, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>
            <span style={{ background: `linear-gradient(90deg,${T.gold},${T.rose})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>✦ Oshun</span>
          </div>
          <div style={{ color: T.creamMid, fontSize: 13, marginTop: 5 }}>{mode === "login" ? "Welcome back" : "Create your account"}</div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", background: T.bgCardAlt, border: `1px solid ${T.borderMid}`, borderRadius: 12, padding: 4, marginBottom: 22 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, background: mode === m ? `linear-gradient(135deg,${T.gold},${T.goldDark})` : "transparent",
              color: mode === m ? "#ffffff" : T.creamMid,
              border: "none", borderRadius: 9, padding: "10px 0", cursor: "pointer",
              fontWeight: 700, fontSize: 14, transition: "all 0.2s",
              boxShadow: mode === m ? `0 0 14px ${T.goldGlow}` : "none",
            }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Account type — signup only */}
        {mode === "signup" && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Account type</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { type: "consumer", label: "👤 Consumer",  desc: "Shop & book"       },
                { type: "business", label: "🏪 Business",  desc: "Sell & list"        },
                { type: "brand",    label: "🌐 Brand",     desc: "Ship nationally"    },
                { type: "driver",   label: "🚗 Driver",    desc: "Deliver & earn"     },
              ].map(opt => (
                <button key={opt.type} onClick={() => setAccountType(opt.type)} style={{
                  flex: 1, background: accountType === opt.type ? T.purpleDeep : T.bgCardAlt,
                  border: `1.5px solid ${accountType === opt.type ? T.purple : T.borderMid}`,
                  borderRadius: 11, padding: "10px 5px", cursor: "pointer", textAlign: "center",
                  transition: "all 0.2s", boxShadow: accountType === opt.type ? `0 0 12px ${T.purpleGlow}` : "none",
                }}>
                  <div style={{ fontWeight: 700, color: T.cream, fontSize: 11 }}>{opt.label}</div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 20 }}>
          {mode === "signup" && <Input placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />}
          {mode === "signup" && accountType === "business" && <Input placeholder="Business Name" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} />}
          <Input placeholder="Email address" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <div style={{ position: "relative" }}>
            <Input placeholder="Password" type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.muted }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <Btn onClick={submit} style={{ width: "100%", padding: "14px", fontSize: 15 }}>{mode === "login" ? "Sign In" : "Create Account"}</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DOORDASH DRIVE DISPATCH STUB
// ─────────────────────────────────────────────────────────────
// When you're ready to wire up real third-party dispatch, replace
// this stub with an authenticated POST to the DoorDash Drive API
// (or Uber Direct). The function signature stays the same — only
// the body changes.
//
// Production endpoint: POST https://openapi.doordash.com/drive/v2/deliveries
// Auth: JWT signed with your developer_id + key_id + signing_secret
//
async function dispatchDelivery({ orderId, pickupAddress, dropoffAddress, customerName, customerPhone, tip = 0 }) {
  // ── STUB ─────────────────────────────────────────────────────
  // In production, swap this block for a fetch() to your backend,
  // which then calls the DoorDash Drive API with a signed JWT.
  //
  // return await fetch("/api/dispatch", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ orderId, pickupAddress, dropoffAddress, customerName, customerPhone, tip })
  // }).then(r => r.json());
  // ─────────────────────────────────────────────────────────────

  console.log(`[Oshun Dispatch Stub] Order ${orderId} → dispatching from "${pickupAddress}" to "${dropoffAddress}"`);
  return new Promise(resolve =>
    setTimeout(() => resolve({
      delivery_id: `DD-${Date.now()}`,
      status: "created",
      pickup_time_estimated: new Date(Date.now() + 8 * 60000).toISOString(),
      dropoff_time_estimated: new Date(Date.now() + 30 * 60000).toISOString(),
      tracking_url: `https://track.doordash.com/order/${orderId}`,
      fee: 799, // cents
    }), 800)
  );
}

// ─────────────────────────────────────────────────────────────
// VIRTUAL TRY-ON PAGE
// ─────────────────────────────────────────────────────────────
const TRYON_PALETTES = {
  "Pro Filt'r Foundation": ["#F5D5B0","#E8C49A","#D4A97A","#C09060","#A07040","#805030","#6B3A2A"],
  "MatteTrance Lipstick":  ["#C0392B","#8B1A1A","#E07B54","#C96B8A","#A8291A","#8B35A8","#2D3A6B"],
  "Setting Spray":         ["#E8F4F8","#D4EAF0","#C0D8E0"],
};
const MAKEUP_PRODUCTS = PRODUCTS.filter(p => p.category === "makeup");

function VirtualTryOnPage({ setPage }) {
  const [selected,   setSelected]   = useState(MAKEUP_PRODUCTS[0]);
  const [colorIdx,   setColorIdx]   = useState(0);
  const [mode,       setMode]       = useState("camera"); // "camera" | "upload"
  const [captured,   setCaptured]   = useState(false);
  const [saved,      setSaved]      = useState(false);
  const { isMobile } = useBreakpoint();
  const palette = TRYON_PALETTES[selected?.name] || TRYON_PALETTES["MatteTrance Lipstick"];
  const chosenColor = palette[colorIdx] || palette[0];

  const handleCapture = () => { setCaptured(true); setTimeout(() => setSaved(false), 100); };

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding: isMobile ? "20px 16px 80px" : "36px 24px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <button onClick={() => setPage("shop")} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:10, padding:"8px 12px", cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight:900, color:T.cream, letterSpacing:"-0.02em", margin:0 }}>Virtual Try-On ✨</h1>
          <p style={{ color:T.muted, fontSize:13, margin:"3px 0 0" }}>See how products look before you buy</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap:20, alignItems:"start" }}>

        {/* Camera / Preview Panel */}
        <div>
          {/* Mode toggle */}
          <div style={{ display:"flex", gap:4, background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:12, padding:4, marginBottom:16, width:"fit-content" }}>
            {[["camera","📷 Camera"],["upload","🖼️ Upload Photo"]].map(([id,label]) => (
              <button key={id} onClick={() => { setMode(id); setCaptured(false); }} style={{
                background: mode===id ? `linear-gradient(135deg,${T.gold},${T.goldDark})` : "transparent",
                color: mode===id ? "#ffffff" : T.muted,
                border:"none", borderRadius:9, padding:"8px 16px", cursor:"pointer", fontWeight:700, fontSize:13
              }}>{label}</button>
            ))}
          </div>

          {/* Preview frame */}
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:20, overflow:"hidden", position:"relative", aspectRatio:"3/4", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {!captured ? (
              <div style={{ textAlign:"center", padding:32 }}>
                <div style={{ fontSize:64, marginBottom:16 }}>🤳</div>
                <div style={{ fontWeight:700, color:T.cream, fontSize:16, marginBottom:8 }}>
                  {mode === "camera" ? "Allow camera access to try on products" : "Upload a front-facing photo"}
                </div>
                <div style={{ fontSize:13, color:T.muted, marginBottom:20, lineHeight:1.5 }}>
                  {mode === "camera" ? "Your camera feed stays on your device — nothing is uploaded." : "For best results, use a clear front-facing photo with good lighting."}
                </div>
                <Btn onClick={handleCapture} style={{ padding:"11px 28px" }}>
                  {mode === "camera" ? "📷 Start Camera" : "📁 Choose Photo"}
                </Btn>
              </div>
            ) : (
              <>
                {/* Simulated face with try-on overlay */}
                <div style={{ width:"100%", height:"100%", background:"linear-gradient(180deg,#1A1A2E 0%,#2D2D3A 100%)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                  {/* Face placeholder */}
                  <div style={{ position:"relative", width:180, height:220 }}>
                    <div style={{ width:160, height:190, borderRadius:"50% 50% 45% 45%", background:"linear-gradient(180deg,#C8956A,#A0724A)", margin:"0 auto", position:"relative", overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
                      {/* Eyes */}
                      <div style={{ display:"flex", justifyContent:"space-around", paddingTop:55 }}>
                        <div style={{ width:22, height:14, borderRadius:50, background:"#1A0A05", boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }} />
                        <div style={{ width:22, height:14, borderRadius:50, background:"#1A0A05", boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }} />
                      </div>
                      {/* Lip try-on overlay */}
                      {selected?.name?.includes("Lipstick") && (
                        <div style={{ width:52, height:20, borderRadius:"0 0 26px 26px", background:chosenColor, margin:"30px auto 0", opacity:0.92, boxShadow:`0 0 12px ${chosenColor}66`, transition:"background 0.3s" }} />
                      )}
                      {/* Foundation overlay */}
                      {selected?.name?.includes("Foundation") && (
                        <div style={{ position:"absolute", inset:0, background:chosenColor, opacity:0.25, transition:"background 0.3s" }} />
                      )}
                    </div>
                  </div>
                  {/* Color label */}
                  <div style={{ position:"absolute", bottom:16, left:16, right:16, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", borderRadius:12, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:700, color:T.cream, fontSize:13 }}>{selected?.name}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Shade {colorIdx + 1} of {palette.length}</div>
                    </div>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:chosenColor, border:`2px solid rgba(255,255,255,0.3)`, boxShadow:`0 0 8px ${chosenColor}88` }} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {captured && (
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <Btn onClick={() => { setSaved(true); }} style={{ flex:1, padding:"11px" }}>
                {saved ? "✓ Saved to Profile" : "💾 Save This Look"}
              </Btn>
              <Btn variant="outline" onClick={() => setCaptured(false)} style={{ padding:"11px 18px" }}>Retake</Btn>
              <Btn variant="ghost" style={{ padding:"11px 14px" }}><Share2 size={16} /></Btn>
            </div>
          )}
        </div>

        {/* Product Selector Panel */}
        <div>
          <h3 style={{ color:T.cream, fontWeight:800, marginBottom:14, fontSize:15 }}>Choose a Product</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
            {MAKEUP_PRODUCTS.map(p => (
              <button key={p.id} onClick={() => { setSelected(p); setColorIdx(0); }} style={{
                background: selected?.id === p.id ? T.purpleDeep : T.bgCard,
                border: `1.5px solid ${selected?.id === p.id ? T.gold : T.borderMid}`,
                borderRadius:14, padding:"12px 16px", cursor:"pointer", textAlign:"left",
                display:"flex", alignItems:"center", gap:12,
                boxShadow: selected?.id === p.id ? `0 0 16px ${T.goldGlow}` : "none",
                transition:"all 0.2s"
              }}>
                <div style={{ width:44, height:44, borderRadius:10, background:p.gradient, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:T.cream, fontSize:13 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{p.brand} · ${p.price.toFixed(2)}</div>
                </div>
                {selected?.id === p.id && <span style={{ color:T.gold, fontSize:14 }}>✦</span>}
              </button>
            ))}
          </div>

          {/* Shade swatches */}
          <h3 style={{ color:T.cream, fontWeight:800, marginBottom:12, fontSize:15 }}>Select Shade</h3>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {palette.map((c, i) => (
              <button key={i} onClick={() => setColorIdx(i)} style={{
                width:34, height:34, borderRadius:"50%", background:c, cursor:"pointer",
                border: colorIdx===i ? `3px solid ${T.gold}` : `2px solid ${T.borderMid}`,
                boxShadow: colorIdx===i ? `0 0 10px ${c}88` : "none",
                transition:"all 0.15s", flexShrink:0
              }} />
            ))}
          </div>
          {captured && (
            <div style={{ marginTop:20 }}>
              <Btn style={{ width:"100%", padding:"12px" }} onClick={() => {}}>Add to Cart — ${selected?.price?.toFixed(2)}</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTION BOX PAGE
// ─────────────────────────────────────────────────────────────
const SUB_TIERS = [
  {
    id:"essentials", name:"Essentials Box", price:29, badge:"Most Popular",
    color: T.gold, badgeBg:`linear-gradient(135deg,${T.gold},${T.goldDark})`,
    desc:"3 hand-curated products from our national brand partners — perfect introduction.",
    perks:["3 full-size brand partner products","Exclusive to Oshun subscribers","Free shipping every month","Early access to new brands"],
    sampleBrands:["Soleil Botanics","Crown Ritual"],
  },
  {
    id:"luxe", name:"Luxe Box", price:49, badge:"Best Value",
    color:"#A78BFA", badgeBg:"linear-gradient(135deg,#A78BFA,#7C3AED)",
    desc:"5 premium products including hero items from top brand partners.",
    perks:["5 full-size premium products","1 exclusive Oshun collab item","Free shipping + gift wrap","Priority customer support"],
    sampleBrands:["Melanin Lab","Soleil Botanics","Crown Ritual"],
  },
  {
    id:"black", name:"Oshun Black Box", price:79, badge:"Premium",
    color: T.rose, badgeBg:`linear-gradient(135deg,${T.rose},${T.purple})`,
    desc:"7+ luxury products. The best our brand partners have to offer, curated for melanin-rich skin.",
    perks:["7+ full-size luxury items","Oshun Black membership included","Personal beauty profile match","Founder-curated selections","Free express shipping"],
    sampleBrands:["Melanin Lab","Soleil Botanics","Melanin Lab","Crown Ritual"],
  },
];

function SubscriptionBoxPage({ setPage, user, onAuthOpen }) {
  const [selectedTier, setSelectedTier] = useState("luxe");
  const [subscribed,   setSubscribed]   = useState(false);
  const { isMobile } = useBreakpoint();
  const featuredBrands = BRAND_PARTNERS.slice(0, 3);
  const sampleProducts = BRAND_PRODUCTS.slice(0, 6);

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", padding: isMobile ? "20px 16px 80px" : "36px 24px" }}>

      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg,${T.purpleDeep},#0A0A14)`, border:`1.5px solid ${T.purple}44`, borderRadius:22, padding: isMobile ? "28px 22px" : "36px 40px", marginBottom:32, textAlign:"center", boxShadow:`0 0 60px ${T.purpleGlow}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle,${T.purple}22,transparent 70%)` }} />
        <div style={{ position:"absolute", bottom:-40, left:-40, width:160, height:160, borderRadius:"50%", background:`radial-gradient(circle,${T.gold}15,transparent 70%)` }} />
        <div style={{ fontSize: isMobile ? 40 : 52, marginBottom:12 }}>💎</div>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight:900, color:T.cream, letterSpacing:"-0.03em", marginBottom:10 }}>
          The <span style={{ background:`linear-gradient(90deg,${T.gold},${T.rose})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Oshun Beauty Box</span>
        </h1>
        <p style={{ color:T.creamMid, fontSize: isMobile ? 14 : 16, maxWidth:520, margin:"0 auto 20px", lineHeight:1.6 }}>
          Monthly curated boxes featuring our national brand partners — products designed for melanin-rich skin, delivered to your door.
        </p>
        <div style={{ display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
          {["Curated by experts","Cancel anytime","Free shipping","Brand partner exclusives"].map(p => (
            <span key={p} style={{ fontSize:12, color:T.goldLight, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}><span style={{ color:T.gold }}>✦</span> {p}</span>
          ))}
        </div>
      </div>

      {/* Tier cards */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:16, marginBottom:36 }}>
        {SUB_TIERS.map(tier => (
          <div key={tier.id} onClick={() => setSelectedTier(tier.id)} style={{
            background:T.bgCard, border:`2px solid ${selectedTier===tier.id ? tier.color : T.borderMid}`,
            borderRadius:20, padding:"22px 22px 20px", cursor:"pointer", position:"relative", overflow:"hidden",
            boxShadow: selectedTier===tier.id ? `0 0 28px ${tier.color}33` : "none",
            transition:"all 0.2s"
          }}>
            {/* Top accent */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:tier.badgeBg }} />
            {/* Badge */}
            <span style={{ display:"inline-block", background:tier.badgeBg, color:"white", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20, marginBottom:14, letterSpacing:"0.04em" }}>{tier.badge}</span>
            <div style={{ fontWeight:900, color:T.cream, fontSize:17, marginBottom:6, letterSpacing:"-0.01em" }}>{tier.name}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:12 }}>
              <span style={{ fontSize:30, fontWeight:900, color:tier.color }}>${tier.price}</span>
              <span style={{ fontSize:13, color:T.muted }}>/month</span>
            </div>
            <div style={{ fontSize:13, color:T.creamMid, lineHeight:1.5, marginBottom:16 }}>{tier.desc}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {tier.perks.map(perk => (
                <div key={perk} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.creamMid }}>
                  <span style={{ color:tier.color, fontSize:14 }}>✓</span> {perk}
                </div>
              ))}
            </div>
            {selectedTier === tier.id && (
              <div style={{ marginTop:18, textAlign:"center" }}>
                <span style={{ fontSize:11, color:tier.color, fontWeight:700, background:`${tier.color}15`, border:`1px solid ${tier.color}33`, padding:"4px 12px", borderRadius:20 }}>✦ Selected</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Subscribe CTA */}
      {!subscribed ? (
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <Btn onClick={() => user ? setSubscribed(true) : onAuthOpen()} style={{ padding:"15px 48px", fontSize:16, borderRadius:14, marginBottom:10 }}>
            Subscribe to {SUB_TIERS.find(t=>t.id===selectedTier)?.name} — ${SUB_TIERS.find(t=>t.id===selectedTier)?.price}/mo
          </Btn>
          <div style={{ fontSize:12, color:T.muted, marginTop:8 }}>Cancel anytime · No contracts · Ships 1st of each month</div>
        </div>
      ) : (
        <div style={{ background:"rgba(34,197,94,0.07)", border:`1.5px solid ${T.success}33`, borderRadius:16, padding:"18px 24px", marginBottom:36, textAlign:"center", animation:"fadeUp 0.3s ease" }}>
          <CheckCircle size={24} color={T.success} style={{ marginBottom:8 }} />
          <div style={{ fontWeight:800, color:T.success, fontSize:16, marginBottom:4 }}>You're subscribed! 🎉</div>
          <div style={{ color:T.creamMid, fontSize:13 }}>Your first box ships on the 1st. You'll get a tracking notification.</div>
        </div>
      )}

      {/* Featured Brand Partners */}
      <section style={{ marginBottom:36 }}>
        <h2 style={{ color:T.cream, fontWeight:800, fontSize:18, marginBottom:6, letterSpacing:"-0.01em" }}>Inside the Box — Brand Partners</h2>
        <p style={{ color:T.muted, fontSize:13, marginBottom:20 }}>Every box features products exclusively from Oshun's verified national brand partners.</p>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:14 }}>
          {featuredBrands.map(brand => (
            <div key={brand.id} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, padding:"18px 20px", display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ width:48, height:48, borderRadius:14, background:brand.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white", flexShrink:0, boxShadow:"0 2px 12px rgba(0,0,0,0.4)" }}>{brand.initials}</div>
              <div>
                <div style={{ fontWeight:800, color:T.cream, fontSize:14 }}>{brand.name}</div>
                <div style={{ fontSize:12, color:T.muted, marginTop:3, lineHeight:1.4 }}>{brand.tagline}</div>
                <div style={{ fontSize:11, color:T.gold, marginTop:6, fontWeight:600 }}>★ {brand.rating} · {brand.reviews} reviews</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sample products that could appear */}
      <section>
        <h2 style={{ color:T.cream, fontWeight:800, fontSize:18, marginBottom:6, letterSpacing:"-0.01em" }}>Products You Might Discover</h2>
        <p style={{ color:T.muted, fontSize:13, marginBottom:20 }}>Past box inclusions — each month is a new curation.</p>
        <div className="oshun-hscroll" style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:6 }}>
          {sampleProducts.map(p => (
            <div key={p.id} className="oshun-card" style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:16, overflow:"hidden", width:160, flexShrink:0 }}>
              <div style={{ height:100, background:p.gradient, position:"relative" }}>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.45),transparent)" }} />
                <div style={{ position:"absolute", bottom:8, left:10, fontSize:10, color:"rgba(255,255,255,0.9)", fontWeight:700 }}>{p.brand}</div>
              </div>
              <div style={{ padding:"10px 12px" }}>
                <div style={{ fontWeight:700, color:T.cream, fontSize:12, lineHeight:1.3, marginBottom:5 }}>{p.name}</div>
                <div style={{ fontSize:11, color:T.gold, fontWeight:800 }}>${p.price.toFixed(2)} value</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BEAUTY CONCIERGE — FLOATING CHAT
// ─────────────────────────────────────────────────────────────
const CONCIERGE_PROMPTS = [
  "I have 4C hair, what products are best?",
  "I need a silk press for a wedding",
  "What's good for hyperpigmentation?",
  "Best nail salons near me",
  "Build me a skincare routine",
];

const CONCIERGE_RESPONSES = {
  hair: {
    text:"For 4C hair, I'd focus on moisture retention. Here are my top picks:",
    recs: PRODUCTS.filter(p => p.category === "hair").slice(0, 3),
    services: SERVICES.filter(s => s.category === "hair").slice(0, 2),
  },
  silk: {
    text:"A silk press is perfect for a special occasion! Book with Crown & Glory — they're our top-rated stylist for this.",
    recs: [],
    services: SERVICES.filter(s => s.name.toLowerCase().includes("silk")),
  },
  hyperpigmentation: {
    text:"For hyperpigmentation, these targeted treatments have incredible reviews from our community:",
    recs: BRAND_PRODUCTS.filter(p => p.name.toLowerCase().includes("hyperpigmentation") || p.tags?.some(t => t.toLowerCase().includes("dark spots"))),
    services: SERVICES.filter(s => s.category === "skincare"),
  },
  nails: {
    text:"Polished By Design is your spot — the highest-rated nail studio on Oshun. Some services worth booking:",
    recs: [],
    services: SERVICES.filter(s => s.category === "nails"),
  },
  skincare: {
    text:"Here's a solid routine for melanin-rich skin — cleanser, Vitamin C in the AM, and SPF is non-negotiable:",
    recs: PRODUCTS.filter(p => p.category === "skincare"),
    services: SERVICES.filter(s => s.category === "skincare").slice(0, 1),
  },
  default: {
    text:"Great question! Here are some of our most loved products and services right now:",
    recs: PRODUCTS.slice(0, 3),
    services: SERVICES.slice(0, 2),
  },
};

function getResponse(msg) {
  const m = msg.toLowerCase();
  if (m.includes("hair") || m.includes("4c") || m.includes("natural") || m.includes("curl") || m.includes("loc")) return CONCIERGE_RESPONSES.hair;
  if (m.includes("silk") || m.includes("press") || m.includes("wedding") || m.includes("event")) return CONCIERGE_RESPONSES.silk;
  if (m.includes("hyperpigmentation") || m.includes("dark spot") || m.includes("pigment") || m.includes("skin")) return CONCIERGE_RESPONSES.skincare;
  if (m.includes("nail") || m.includes("mani") || m.includes("pedi") || m.includes("acrylic")) return CONCIERGE_RESPONSES.nails;
  if (m.includes("skincare") || m.includes("routine") || m.includes("serum") || m.includes("moisturizer")) return CONCIERGE_RESPONSES.skincare;
  return CONCIERGE_RESPONSES.default;
}

function BeautyConcierge({ isOpen, onClose, setPage, setCart }) {
  const [messages,        setMessages]        = useState([
    { id:0, role:"ai", text:"Hey! ✦ I'm your Oshun Beauty Concierge — your culturally-aware guide to everything on the platform. Ask me about products for your hair type, services near you, or anything Black beauty. I'm here.", recs:[], services:[] }
  ]);
  const [input,           setInput]           = useState("");
  const [typing,          setTyping]          = useState(false);
  const [conversationId,  setConversationId]  = useState(null);
  const bottomRef = useRef(null);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, typing]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setInput("");

    // Add user message immediately
    setMessages(prev => [...prev, { id:Date.now(), role:"user", text:msg, recs:[], services:[] }]);
    setTyping(true);

    // The reply bubble is added on first token so there's no empty bubble flash
    const replyId   = Date.now() + 1;
    let replyAdded  = false;

    try {
      const res = await sendConciergeMessage(msg, conversationId);

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep any incomplete line for next chunk

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.conversation_id && !conversationId) {
              setConversationId(data.conversation_id);
            }

            if (data.token) {
              if (!replyAdded) {
                // First token — create the reply bubble
                replyAdded = true;
                setMessages(prev => [...prev, { id:replyId, role:"ai", text:data.token, recs:[], services:[] }]);
              } else {
                // Subsequent tokens — append to existing bubble
                setMessages(prev => prev.map(m =>
                  m.id === replyId ? { ...m, text: m.text + data.token } : m
                ));
              }
            }

            if (data.done)  setTyping(false);

            if (data.error) {
              const errMsg = data.error;
              setMessages(prev => replyAdded
                ? prev.map(m => m.id === replyId ? { ...m, text: errMsg } : m)
                : [...prev, { id:replyId, role:"ai", text:errMsg, recs:[], services:[] }]
              );
              setTyping(false);
            }
          } catch { /* skip malformed SSE lines */ }
        }
      }
    } catch (err) {
      const fallback = "I'm having trouble connecting right now. Please try again in a moment.";
      setMessages(prev => replyAdded
        ? prev.map(m => m.id === replyId ? { ...m, text: fallback } : m)
        : [...prev, { id:replyId, role:"ai", text:fallback, recs:[], services:[] }]
      );
    } finally {
      setTyping(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      return ex ? prev.map(i => i.id === product.id ? { ...i, qty:i.qty+1 } : i) : [...prev, { ...product, qty:1 }];
    });
  };

  if (!isOpen) return null;
  return (
    <div style={{ position:"fixed", bottom: isMobile ? 70 : 20, right:16, width: isMobile ? "calc(100vw - 32px)" : 380, height:520, background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:20, boxShadow:`0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px ${T.glass}`, zIndex:500, display:"flex", flexDirection:"column", animation:"fadeUp 0.2s ease", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.borderMid}`, display:"flex", alignItems:"center", gap:12, background:T.bgCard, flexShrink:0 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, boxShadow:`0 0 14px ${T.goldGlow}`, flexShrink:0 }}>✦</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, color:T.cream, fontSize:14 }}>Beauty Concierge</div>
          <div style={{ fontSize:11, color:T.success, display:"flex", alignItems:"center", gap:4, marginTop:1 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:T.success, display:"inline-block", boxShadow:`0 0 6px ${T.success}` }} /> Online · Powered by Oshun AI
          </div>
        </div>
        <button onClick={onClose} style={{ background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:8, width:30, height:30, cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", justifyContent:"center" }}><X size={14} /></button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map(m => (
          <div key={m.id}>
            <div style={{ display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start" }}>
              <div style={{
                background: m.role==="user" ? `linear-gradient(135deg,${T.gold},${T.goldDark})` : T.bgCardAlt,
                color: m.role==="user" ? "#ffffff" : T.cream,
                borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding:"10px 14px", fontSize:13, lineHeight:1.5, maxWidth:"82%",
                border: m.role==="ai" ? `1px solid ${T.borderMid}` : "none",
              }}>{m.text}</div>
            </div>
            {/* Product recs */}
            {m.recs?.length > 0 && (
              <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                {m.recs.map(p => (
                  <div key={p.id} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:12, overflow:"hidden", width:120, flexShrink:0 }}>
                    <div style={{ height:64, background:p.gradient }} />
                    <div style={{ padding:"7px 9px" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.cream, lineHeight:1.3, marginBottom:4 }}>{p.name}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:11, color:T.gold, fontWeight:800 }}>${typeof p.price==="number" ? p.price.toFixed(2) : p.price}</span>
                        <button onClick={() => addToCart(p)} style={{ background:`linear-gradient(135deg,${T.gold},${T.goldDark})`, border:"none", borderRadius:6, padding:"3px 7px", cursor:"pointer", color:"#ffffff", fontSize:10, fontWeight:700 }}>+ Add</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Service recs */}
            {m.services?.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
                {m.services.map(s => (
                  <div key={s.id} style={{ background:T.bgCard, border:`1px solid ${T.borderMid}`, borderRadius:10, padding:"9px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:700, color:T.cream, fontSize:12 }}>{s.name}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{s.provider} · ${s.price} · {s.duration}</div>
                    </div>
                    <button onClick={() => setPage("services")} style={{ background:T.purpleDeep, border:`1px solid ${T.purple}`, borderRadius:7, padding:"4px 10px", cursor:"pointer", color:T.goldLight, fontSize:11, fontWeight:700 }}>Book</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div style={{ display:"flex", gap:5, padding:"10px 14px", background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:"16px 16px 16px 4px", width:"fit-content" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:T.muted, animation:`oshunSpin 1.2s ease-in-out ${i*0.2}s infinite` }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div style={{ padding:"0 12px 8px", display:"flex", gap:6, overflowX:"auto", flexShrink:0 }} className="oshun-hscroll">
          {CONCIERGE_PROMPTS.map(p => (
            <button key={p} onClick={() => send(p)} style={{ background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:20, padding:"6px 12px", cursor:"pointer", color:T.creamMid, fontSize:11, fontWeight:600, whiteSpace:"nowrap", flexShrink:0 }}>{p}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding:"10px 14px", borderTop:`1px solid ${T.borderMid}`, display:"flex", gap:8, flexShrink:0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && send()}
          placeholder="Ask about products, hair type, skin..."
          style={{ flex:1, background:T.bgCardAlt, border:`1px solid ${T.borderMid}`, borderRadius:12, padding:"10px 14px", color:T.cream, fontSize:13, outline:"none" }}
        />
        <button onClick={() => send()} style={{ background:`linear-gradient(135deg,${T.gold},${T.goldDark})`, border:"none", borderRadius:12, width:42, height:42, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 0 12px ${T.goldGlow}` }}>
          <Send size={16} color="#ffffff" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMMUNITY FEED
// ─────────────────────────────────────────────────────────────
const FEED_TABS = [
  { id: "thewave",   label: "The Wave"  },
  { id: "foryou",    label: "For You"   },
  { id: "following", label: "Following" },
  { id: "trending",  label: "Trending"  },
];
const NEWS_CATS = [
  { id: "all",       label: "All"       },
  { id: "business",  label: "Business"  },
  { id: "culture",   label: "Culture"   },
  { id: "community", label: "Community" },
  { id: "wellness",  label: "Wellness"  },
];
const FEED_CATS = [
  { id: "all",      label: "All"      },
  { id: "hair",     label: "Hair"     },
  { id: "skin",     label: "Skin"     },
  { id: "nails",    label: "Nails"    },
  { id: "makeup",   label: "Makeup"   },
  { id: "wellness", label: "Wellness" },
];

// ── Post Composer Modal ───────────────────────────────────────
function PostComposer({ user, onClose, onPosted }) {
  const [caption, setCaption]   = useState("");
  const [category, setCategory] = useState("hair");
  const [postType, setPostType] = useState("look");
  const [tags, setTags]         = useState("");
  const [loading, setLoading]   = useState(false);

  const handlePost = async () => {
    if (!caption.trim()) return;
    setLoading(true);
    try {
      const hashtags = (caption.match(/#\w+/g) || []).map(t => t.replace('#', '').toLowerCase());
      await createCommunityPost({ post_type: postType, caption, media_urls: [], media_types: [], product_tags: [], service_tags: [], hashtags, category });
      toast.success("Posted to the community! ✨");
      onPosted();
      onClose();
    } catch (e) {
      toast.error("Couldn't post right now. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(6,15,32,0.85)", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ background: T.bgCard, borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxWidth: 600, border: `1px solid ${T.border}` }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: T.cream }}>New Post</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}><X size={20} /></button>
        </div>

        {/* Post type */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto" }} className="oshun-hscroll">
          {["look","tutorial","review","inspiration"].map(t => (
            <button key={t} onClick={() => setPostType(t)} style={{
              padding: "6px 14px", borderRadius: 20, border: `1px solid ${postType === t ? T.gold : T.border}`,
              background: postType === t ? `rgba(200,168,75,0.12)` : "transparent",
              color: postType === t ? T.gold : T.muted, fontSize: 12, fontWeight: 600,
              textTransform: "capitalize", flexShrink: 0, cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>

        {/* Caption */}
        <textarea
          value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="Share your look, tip, or review... #hair #naturalhair"
          style={{
            width: "100%", minHeight: 100, background: T.bgCardAlt, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: 14, color: T.cream, fontSize: 14, resize: "none",
            fontFamily: '"Jost", sans-serif', outline: "none",
          }}
        />

        {/* Category */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto" }} className="oshun-hscroll">
          {FEED_CATS.filter(c => c.id !== "all").map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              padding: "5px 12px", borderRadius: 20, border: `1px solid ${category === c.id ? T.seafoam : T.border}`,
              background: category === c.id ? `rgba(74,171,191,0.12)` : "transparent",
              color: category === c.id ? T.seafoam : T.muted, fontSize: 12, fontWeight: 500,
              flexShrink: 0, cursor: "pointer",
            }}>{c.label}</button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }} onClick={handlePost} disabled={loading || !caption.trim()}
          style={{
            marginTop: 18, width: "100%", padding: "14px 0", borderRadius: 14,
            background: `linear-gradient(135deg, ${T.gold}, ${T.goldDark})`,
            border: "none", color: T.bg, fontWeight: 700, fontSize: 15,
            fontFamily: '"Jost", sans-serif', cursor: "pointer", opacity: loading ? 0.6 : 1,
          }}
        >{loading ? "Posting…" : "Post to Community"}</motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Post Card ─────────────────────────────────────────────────
function CommunityPostCard({ post, currentUserId, onLike, onSave, onComment, onAddToCart, setPage }) {
  const isLiked = post.community_likes?.some(l => l.user_id === currentUserId);
  const isSaved = post.community_saves?.some(s => s.user_id === currentUserId);
  const author  = post.profiles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden", marginBottom: 16 }}
    >
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 10px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${T.gold},${T.seafoam})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: T.bg, fontSize: 15, flexShrink: 0 }}>
          {author?.username?.charAt(0)?.toUpperCase() || "O"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.cream }}>{author?.username || author?.business_name || "Oshun Community"}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
        {post.category && (
          <span style={{ fontSize: 10, fontWeight: 600, color: T.seafoam, background: `rgba(74,171,191,0.12)`, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.5px" }}>{post.category}</span>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div style={{ padding: "0 16px 12px", fontSize: 14, color: T.creamMid, lineHeight: 1.55 }}>
          {post.caption.split(/(#\w+)/g).map((part, i) =>
            part.startsWith('#')
              ? <span key={i} style={{ color: T.seafoam, fontWeight: 600 }}>{part}</span>
              : part
          )}
        </div>
      )}

      {/* Media placeholder (real media when Cloudinary is wired) */}
      {post.media_urls?.length > 0 && (
        <div style={{ position: "relative" }}>
          {post.media_types?.[0] === "video"
            ? <video src={post.media_urls[0]} controls style={{ width: "100%", maxHeight: 360, objectFit: "cover" }} />
            : <img src={post.media_urls[0]} alt={post.caption} style={{ width: "100%", maxHeight: 360, objectFit: "cover" }} />
          }
        </div>
      )}

      {/* Product tags */}
      {post.product_tags?.length > 0 && (
        <div style={{ padding: "10px 16px", display: "flex", gap: 8, overflowX: "auto" }} className="oshun-hscroll">
          {post.product_tags.map((tag, i) => (
            <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => onAddToCart && onAddToCart(tag)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: `rgba(200,168,75,0.10)`, border: `1px solid rgba(200,168,75,0.3)`, cursor: "pointer", flexShrink: 0 }}>
              <ShoppingCart size={12} color={T.gold} />
              <span style={{ fontSize: 12, color: T.cream, fontWeight: 600 }}>{tag.product_name}</span>
              {tag.price && <span style={{ fontSize: 11, color: T.gold }}>${tag.price}</span>}
            </motion.button>
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 16px 14px", borderTop: `1px solid ${T.border}` }}>
        <motion.button whileTap={{ scale: 0.82 }} onClick={() => onLike(post.id, isLiked)}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 20, color: isLiked ? T.gold : T.muted }}>
          <Heart size={17} fill={isLiked ? T.gold : "none"} color={isLiked ? T.gold : T.muted} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{post.likes_count || 0}</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.82 }} onClick={() => onComment(post)}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 20, color: T.muted }}>
          <MessageCircle size={17} color={T.muted} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{post.comments_count || 0}</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.82 }} onClick={() => onSave(post.id, isSaved)}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 20, color: isSaved ? T.seafoam : T.muted }}>
          <Bookmark size={17} fill={isSaved ? T.seafoam : "none"} color={isSaved ? T.seafoam : T.muted} />
        </motion.button>

        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: T.muted, textTransform: "capitalize", background: `rgba(255,255,255,0.04)`, padding: "3px 9px", borderRadius: 12 }}>{post.post_type || "look"}</span>
      </div>
    </motion.div>
  );
}

// ── Comment Drawer ────────────────────────────────────────────
function CommentDrawer({ post, currentUserId, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getComments(post.id).then(data => { setComments(data); setLoading(false); }).catch(() => setLoading(false));
  }, [post.id]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    try {
      const res = await addComment(post.id, text.trim());
      setComments(c => [...c, res.comment]);
      setText("");
    } catch (_) { toast.error("Couldn't add comment."); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(6,15,32,0.85)", zIndex: 600, display: "flex", alignItems: "flex-end" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ background: T.bgCard, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 600, margin: "0 auto", padding: 20, maxHeight: "70vh", display: "flex", flexDirection: "column", border: `1px solid ${T.border}` }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: 700, color: T.cream, fontSize: 15 }}>Comments</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginBottom: 14 }}>
          {loading ? (
            <div style={{ color: T.muted, textAlign: "center", padding: 20, fontSize: 13 }}>Loading…</div>
          ) : comments.length === 0 ? (
            <div style={{ color: T.muted, textAlign: "center", padding: 20, fontSize: 13 }}>No comments yet. Be first! ✨</div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${T.gold},${T.seafoam})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: T.bg, flexShrink: 0 }}>
                  {c.profiles?.username?.charAt(0)?.toUpperCase() || "O"}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.cream }}>{c.profiles?.username || "Community member"}</div>
                  <div style={{ fontSize: 13, color: T.creamMid, lineHeight: 1.4 }}>{c.content}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {currentUserId && (
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="Add a comment…"
              style={{ flex: 1, background: T.bgCardAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", color: T.cream, fontSize: 13, fontFamily: '"Jost",sans-serif', outline: "none" }}
            />
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd}
              style={{ background: `rgba(200,168,75,0.15)`, border: `1px solid rgba(200,168,75,0.4)`, borderRadius: 12, padding: "10px 16px", cursor: "pointer", color: T.gold }}>
              <Send size={16} />
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── News Card — The Wave ──────────────────────────────────────
const NEWS_REACTIONS = [
  { emoji: "🔥", key: "fire",   label: "Fire"   },
  { emoji: "✊🏾", key: "power",  label: "Power"  },
  { emoji: "❤️",  key: "love",   label: "Love"   },
];

function NewsCard({ article, user, onShareToFeed }) {
  const [reactions, setReactions] = useState({ fire: 0, power: 0, love: 0 });
  const [myReactions, setMyReactions] = useState({});
  const [sharing, setSharing]         = useState(false);

  const handleReact = (key) => {
    if (!user) { toast.error("Sign in to react"); return; }
    const alreadyReacted = myReactions[key];
    setReactions(prev => ({ ...prev, [key]: Math.max(0, prev[key] + (alreadyReacted ? -1 : 1)) }));
    setMyReactions(prev => ({ ...prev, [key]: !alreadyReacted }));
  };

  const handleShare = async () => {
    if (!user) { toast.error("Sign in to share"); return; }
    setSharing(true);
    try {
      await onShareToFeed(article);
      toast.success("Shared to your feed! ✨");
    } catch (_) {
      toast.error("Couldn't share right now");
    } finally {
      setSharing(false);
    }
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden", marginBottom: 14 }}
    >
      {/* Source badge + time */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 8px" }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
          color: article.sourceColor || T.gold,
          background: `${article.sourceColor || T.gold}18`,
          border: `1px solid ${article.sourceColor || T.gold}40`,
          padding: "3px 10px", borderRadius: 20,
        }}>{article.source}</span>
        <span style={{ fontSize: 11, color: T.muted }}>{timeAgo(article.publishedAt)}</span>
      </div>

      {/* Hero image */}
      {article.image && (
        <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
          <img
            src={article.image}
            alt={article.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.style.display = "none"; }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "12px 14px 10px" }}>
        <h3 style={{
          fontFamily: '"Playfair Display", serif', fontSize: 17, fontWeight: 700,
          color: T.cream, margin: "0 0 8px", lineHeight: 1.4,
        }}>{article.title}</h3>
        {article.summary && (
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: "0 0 12px" }}>{article.summary}</p>
        )}

        {/* Actions row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          {/* Reactions */}
          <div style={{ display: "flex", gap: 6 }}>
            {NEWS_REACTIONS.map(r => (
              <motion.button
                key={r.key}
                whileTap={{ scale: 0.88 }}
                onClick={() => handleReact(r.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 10px", borderRadius: 20, border: "none", cursor: "pointer",
                  background: myReactions[r.key] ? `rgba(200,168,75,0.18)` : T.bgCardAlt,
                  color: myReactions[r.key] ? T.gold : T.muted,
                  fontSize: 12, fontFamily: '"Jost",sans-serif', fontWeight: 500,
                  transition: "background 0.2s",
                }}
              >
                <span style={{ fontSize: 14 }}>{r.emoji}</span>
                {reactions[r.key] > 0 && <span>{reactions[r.key]}</span>}
              </motion.button>
            ))}
          </div>

          {/* Right side — Share + Read */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleShare}
              disabled={sharing}
              style={{
                padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                background: "transparent", border: `1px solid ${T.border}`,
                color: T.muted, fontSize: 12, fontFamily: '"Jost",sans-serif',
                opacity: sharing ? 0.5 : 1,
              }}
            >
              {sharing ? "Sharing…" : "Share"}
            </motion.button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "5px 14px", borderRadius: 20, textDecoration: "none",
                background: `linear-gradient(135deg,${T.seafoam}22,${T.seafoam}11)`,
                border: `1px solid ${T.seafoam}55`,
                color: T.seafoam, fontSize: 12, fontFamily: '"Jost",sans-serif', fontWeight: 600,
              }}
            >Read →</a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Community Feed Page ───────────────────────────────────────
function CommunityFeed({ user, cart, setCart, setPage: setAppPage }) {
  const [feedTab,      setFeedTab]      = useState("thewave");
  const [category,     setCategory]     = useState("all");
  const [posts,        setPosts]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [news,         setNews]         = useState([]);
  const [newsLoading,  setNewsLoading]  = useState(false);
  const [newsCategory, setNewsCategory] = useState("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [commentPost,  setCommentPost]  = useState(null);
  const [trendingTags, setTrendingTags] = useState([]);
  const { isMobile }   = useBreakpoint();

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFeed({ type: feedTab, category: category === "all" ? undefined : category, limit: 20 });
      setPosts(data);
    } catch (_) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [feedTab, category]);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const data = await fetchNews({ category: newsCategory === "all" ? undefined : newsCategory, limit: 30 });
      setNews(data.articles ?? []);
    } catch (_) {
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  }, [newsCategory]);

  useEffect(() => {
    if (feedTab === "thewave") {
      loadNews();
    } else {
      loadFeed();
    }
  }, [feedTab, loadFeed, loadNews]);

  useEffect(() => {
    getTrendingHashtags().then(setTrendingTags).catch(() => {});
  }, []);

  const handleShareToFeed = async (article) => {
    const caption = `📰 ${article.title}\n\n${article.summary ? article.summary + "\n\n" : ""}via ${article.source} — ${article.url}`;
    await createCommunityPost({
      caption,
      post_type: "text",
      category: article.category === "business" ? "hair" : "wellness",
      hashtags: ["thewave", "blackmedia", article.source.toLowerCase().replace(/\s+/g, "")],
    });
  };

  const handleLike = async (postId, isLiked) => {
    if (!user) { toast.error("Sign in to like posts"); return; }
    try {
      if (isLiked) {
        await unlikePost(postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1), community_likes: (p.community_likes || []).filter(l => l.user_id !== user.id) } : p));
      } else {
        await likePost(postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1, community_likes: [...(p.community_likes || []), { user_id: user.id }] } : p));
      }
    } catch (_) { toast.error("Couldn't update like"); }
  };

  const handleSave = async (postId, isSaved) => {
    if (!user) { toast.error("Sign in to save posts"); return; }
    try {
      if (isSaved) {
        await unsavePost(postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, community_saves: (p.community_saves || []).filter(s => s.user_id !== user.id) } : p));
        toast.success("Removed from saved");
      } else {
        await savePost(postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, community_saves: [...(p.community_saves || []), { user_id: user.id }] } : p));
        toast.success("Saved! ✨");
      }
    } catch (_) { toast.error("Couldn't save post"); }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "0 0 80px" : "24px 16px 80px" }}>

      {/* Header */}
      <div style={{ padding: isMobile ? "20px 16px 12px" : "0 0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: isMobile ? 24 : 28, fontWeight: 700, color: T.cream, margin: 0 }}>Community</h1>
          <p style={{ fontSize: 13, color: T.muted, margin: "3px 0 0" }}>
            {feedTab === "thewave" ? "Stories from Black-owned media" : "Beauty looks, tutorials & inspiration"}
          </p>
        </div>
        {user && (
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setComposerOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 24, background: `linear-gradient(135deg,${T.gold},${T.goldDark})`, border: "none", color: T.bg, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: '"Jost",sans-serif' }}
          >
            <Plus size={15} /> Post
          </motion.button>
        )}
      </div>

      {/* Feed type tabs */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px", overflowX: "auto", marginBottom: 12 }} className="oshun-hscroll">
        {FEED_TABS.map(tab => (
          <button key={tab.id} onClick={() => setFeedTab(tab.id)} style={{
            padding: "8px 18px", borderRadius: 24, flexShrink: 0, cursor: "pointer",
            background: feedTab === tab.id ? `rgba(200,168,75,0.15)` : "transparent",
            border: `1px solid ${feedTab === tab.id ? `rgba(200,168,75,0.5)` : T.border}`,
            color: feedTab === tab.id ? T.gold : T.muted,
            fontWeight: feedTab === tab.id ? 700 : 400, fontSize: 13,
            fontFamily: '"Jost",sans-serif',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Category filter — swaps between news cats and feed cats */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px", overflowX: "auto", marginBottom: 16 }} className="oshun-hscroll">
        {(feedTab === "thewave" ? NEWS_CATS : FEED_CATS).map(cat => {
          const isActive = feedTab === "thewave" ? newsCategory === cat.id : category === cat.id;
          const setActive = feedTab === "thewave" ? setNewsCategory : setCategory;
          return (
            <button key={cat.id} onClick={() => setActive(cat.id)} style={{
              padding: "5px 14px", borderRadius: 20, flexShrink: 0, cursor: "pointer",
              background: isActive ? `rgba(74,171,191,0.12)` : "transparent",
              border: `1px solid ${isActive ? `rgba(74,171,191,0.45)` : T.border}`,
              color: isActive ? T.seafoam : T.muted,
              fontWeight: isActive ? 600 : 400, fontSize: 12,
            }}>{cat.label}</button>
          );
        })}
      </div>

      {/* Trending hashtags — only on community tabs */}
      {feedTab !== "thewave" && trendingTags.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 16, display: "flex", gap: 8, overflowX: "auto" }} className="oshun-hscroll">
          {trendingTags.slice(0, 8).map(tag => (
            <span key={tag.name} style={{ fontSize: 12, color: T.seafoam, background: `rgba(74,171,191,0.08)`, padding: "4px 12px", borderRadius: 20, flexShrink: 0, cursor: "pointer", border: `1px solid rgba(74,171,191,0.2)` }}>#{tag.name}</span>
          ))}
        </div>
      )}

      {/* ── The Wave news feed ──────────────────────────── */}
      {feedTab === "thewave" && (
        <div style={{ padding: "0 16px" }}>
          {/* Wave intro banner */}
          <div style={{
            background: `linear-gradient(135deg,rgba(43,122,140,0.18),rgba(200,168,75,0.12))`,
            border: `1px solid rgba(200,168,75,0.2)`, borderRadius: 16,
            padding: "14px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🌊</span>
            <div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 15, fontWeight: 700, color: T.gold }}>The Wave</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>Stories from Black-owned media that deserve to be seen.</div>
            </div>
          </div>

          {newsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden", marginBottom: 14, animation: "tide 1.8s ease-in-out infinite" }}>
                <div style={{ height: 180, background: T.bgCardAlt }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 13, background: T.bgCardAlt, borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 13, background: T.bgCardAlt, borderRadius: 6, width: "75%", marginBottom: 8 }} />
                  <div style={{ height: 11, background: T.bgCardAlt, borderRadius: 6, width: "55%" }} />
                </div>
              </div>
            ))
          ) : news.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌊</div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, color: T.cream, marginBottom: 8 }}>The Wave is loading</div>
              <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.6 }}>Stories from the community are on their way.</div>
            </div>
          ) : (
            news.map((article, i) => (
              <motion.div key={article.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <NewsCard article={article} user={user} onShareToFeed={handleShareToFeed} />
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ── Community posts feed ────────────────────────── */}
      {feedTab !== "thewave" && (
        <div style={{ padding: "0 16px" }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, padding: 16, marginBottom: 16, animation: "tide 1.8s ease-in-out infinite" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.bgCardAlt }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, background: T.bgCardAlt, borderRadius: 6, marginBottom: 6, width: "40%" }} />
                    <div style={{ height: 10, background: T.bgCardAlt, borderRadius: 6, width: "25%" }} />
                  </div>
                </div>
                <div style={{ height: 14, background: T.bgCardAlt, borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 14, background: T.bgCardAlt, borderRadius: 6, width: "70%" }} />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, color: T.cream, marginBottom: 8 }}>
                {feedTab === "following" ? "Follow people to see their posts here" : "The community is warming up"}
              </div>
              <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
                {feedTab === "following" ? "Discover creators and shop owners posting their best looks." : "Be the first to post. Share your look, your ritual, your inspiration."}
              </div>
              {user && feedTab !== "following" && (
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setComposerOpen(true)}
                  style={{ marginTop: 20, padding: "12px 28px", borderRadius: 24, background: `linear-gradient(135deg,${T.gold},${T.goldDark})`, border: "none", color: T.bg, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Post First
                </motion.button>
              )}
            </div>
          ) : (
            posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <CommunityPostCard
                  post={post}
                  currentUserId={user?.id}
                  onLike={handleLike}
                  onSave={handleSave}
                  onComment={setCommentPost}
                  onAddToCart={tag => { if (tag.product_id) { toast.success(`${tag.product_name} added to cart 🛍️`); }}}
                  setPage={setAppPage}
                />
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Post Composer Modal */}
      <AnimatePresence>
        {composerOpen && <PostComposer user={user} onClose={() => setComposerOpen(false)} onPosted={loadFeed} />}
      </AnimatePresence>

      {/* Comment Drawer */}
      <AnimatePresence>
        {commentPost && <CommentDrawer post={commentPost} currentUserId={user?.id} onClose={() => setCommentPost(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CREATOR HUB  — Feature Plan 02
// Tier progress, credit balance, redeem, affiliate, leaderboard
// ─────────────────────────────────────────────────────────────
const TIER_ORDER   = ['spark', 'glow', 'radiance', 'luminary'];
const TIER_LABELS  = { spark:'Spark', glow:'Glow', radiance:'Radiance', luminary:'Luminary' };
const TIER_COLORS  = {
  spark:    '#4AABBF',
  glow:     '#C8A84B',
  radiance: '#C8A84B',
  luminary: '#F5E8C0',
};
const TIER_MINS    = { spark:0, glow:500, radiance:2000, luminary:5000 };
const REDEEM_OPTS  = [
  { key:'free_delivery',         cost:200,  label:'Free Delivery',        desc:'Free delivery on your next order' },
  { key:'discount_10pct',        cost:500,  label:'10% Off',              desc:'10% discount applied to any order' },
  { key:'subscription_box_item', cost:1000, label:'Free Box Item',        desc:'One item added to your next subscription box' },
  { key:'platform_credit_10',    cost:1000, label:'$10 Platform Credit',  desc:'$10 credit added to your account' },
  { key:'cash_payout',           cost:1000, label:'$10 Cash',             desc:'$10 cash via Stripe (Luminary only)' },
];

function TierBadge({ tier, size = 14 }) {
  const color = TIER_COLORS[tier] || T.seafoam;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      background:`${color}22`, border:`1px solid ${color}55`,
      color, borderRadius:99, padding:'2px 10px', fontSize:size, fontWeight:600,
    }}>
      <Crown size={size - 2} /> {TIER_LABELS[tier] || tier}
    </span>
  );
}

function TierProgressBar({ tier, totalEarned }) {
  const idx      = TIER_ORDER.indexOf(tier);
  const isMax    = tier === 'luminary';
  const nextTier = isMax ? null : TIER_ORDER[idx + 1];
  const curMin   = TIER_MINS[tier] || 0;
  const nextMin  = nextTier ? TIER_MINS[nextTier] : totalEarned;
  const pct      = isMax ? 100 : Math.min(100, ((totalEarned - curMin) / (nextMin - curMin)) * 100);

  return (
    <div style={{ marginTop:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, color:T.creamMid }}>
        <span style={{ color:TIER_COLORS[tier], fontWeight:600 }}>{TIER_LABELS[tier]}</span>
        {!isMax && <span>{nextMin - totalEarned} credits to <span style={{ color:TIER_COLORS[nextTier] }}>{TIER_LABELS[nextTier]}</span></span>}
        {isMax && <span style={{ color:T.gold }}>Max tier reached ✦</span>}
      </div>
      <div style={{ height:6, borderRadius:99, background:`${T.seafoam}22`, overflow:'hidden' }}>
        <motion.div
          initial={{ width:0 }} animate={{ width:`${pct}%` }}
          transition={{ duration:1.2, ease:'easeOut' }}
          style={{ height:'100%', borderRadius:99,
            background:`linear-gradient(90deg, ${TIER_COLORS[tier]}, ${nextTier ? TIER_COLORS[nextTier] : T.gold})` }}
        />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:11, color:`${T.creamMid}88` }}>
        <span>{curMin}</span>
        {!isMax && <span>{nextMin}</span>}
      </div>
    </div>
  );
}

function CreatorHub({ user, setPage }) {
  const [tab,         setTab]         = useState('dashboard');
  const [profile,     setProfile]     = useState(null);
  const [balance,     setBalance]     = useState(null);
  const [txns,        setTxns]        = useState([]);
  const [referrals,   setReferrals]   = useState(null);
  const [affiliate,   setAffiliate]   = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [joining,     setJoining]     = useState(false);
  const [redeeming,   setRedeeming]   = useState(null); // key of opt being redeemed
  const [copied,      setCopied]      = useState(false);

  const isEnrolled = !!profile;

  // Load everything in parallel once
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prof, lb] = await Promise.all([
          getMyCreatorProfile().catch(() => null),
          getCreatorLeaderboard().catch(() => ({ leaderboard: [] })),
        ]);
        setProfile(prof?.creator ?? null);
        setLeaderboard(lb?.leaderboard ?? []);

        if (prof?.creator) {
          const [bal, tx, ref, aff] = await Promise.all([
            getCreditBalance().catch(() => null),
            getCreatorTransactions().catch(() => ({ transactions: [] })),
            getMyReferrals().catch(() => null),
            getAffiliateLink().catch(() => null),
          ]);
          setBalance(bal);
          setTxns(tx?.transactions ?? []);
          setReferrals(ref);
          setAffiliate(aff);
        }
      } catch (_) {}
      setLoading(false);
    }
    load();
  }, []);

  const handleJoin = async () => {
    if (!user) { toast.error('Sign in to join the Creator Program'); return; }
    setJoining(true);
    try {
      const res = await joinCreatorProgram();
      setProfile(res.creator);
      toast.success(res.message || 'Welcome to the Creator Program!');
      // reload balance
      const [bal, tx, ref, aff] = await Promise.all([
        getCreditBalance(), getCreatorTransactions(), getMyReferrals(), getAffiliateLink(),
      ]);
      setBalance(bal); setTxns(tx?.transactions ?? []); setReferrals(ref); setAffiliate(aff);
      setTab('dashboard');
    } catch (e) { toast.error(e.message); }
    setJoining(false);
  };

  const handleRedeem = async (optKey) => {
    setRedeeming(optKey);
    try {
      const res = await redeemCredits({ redemption_type: optKey });
      toast.success(`Redeemed! New balance: ${res.new_balance} credits`);
      const bal = await getCreditBalance();
      setBalance(bal);
    } catch (e) { toast.error(e.message); }
    setRedeeming(null);
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const card = (children, extra = {}) => (
    <div style={{
      background:T.bgCard, border:`1px solid ${T.border}`,
      borderRadius:16, padding:20, marginBottom:16, ...extra,
    }}>
      {children}
    </div>
  );

  const sectionLabel = (text) => (
    <p style={{ fontSize:11, fontWeight:600, letterSpacing:2, color:T.seafoam,
      textTransform:'uppercase', marginBottom:12 }}>{text}</p>
  );

  const TABS = [
    { id:'dashboard', label:'Dashboard' },
    { id:'redeem',    label:'Redeem'    },
    { id:'affiliate', label:'Affiliate' },
    { id:'history',   label:'History'   },
    { id:'leaderboard', label:'Rankings' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, padding:'100px 20px 20px', display:'flex',
        flexDirection:'column', alignItems:'center', gap:12 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ width:'100%', maxWidth:480, height:100, borderRadius:16,
            background:T.bgCard, animation:'tide 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  // ── Not enrolled — Join CTA ─────────────────────────────────
  if (!isEnrolled) {
    return (
      <div style={{ minHeight:'100vh', background:T.bg, padding:'100px 24px 40px',
        display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:20 }}>

        <div style={{ width:80, height:80, borderRadius:99,
          background:`linear-gradient(135deg, ${T.seafoam}, ${T.gold})`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Crown size={40} color={T.bg} />
        </div>

        <div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:32,
            color:T.cream, fontWeight:700, marginBottom:8 }}>
            Oshun Creator Program
          </h1>
          <p style={{ color:T.creamMid, fontSize:15, lineHeight:1.6, maxWidth:380 }}>
            Earn credits for every post, referral, and purchase you drive.
            Redeem for free delivery, discounts, and cash.
          </p>
        </div>

        {[
          { Icon:Zap,       title:'Earn Credits',  body:'Post content, refer friends, drive purchases' },
          { Icon:Award,     title:'Climb Tiers',   body:'Spark → Glow → Radiance → Luminary' },
          { Icon:Gift,      title:'Redeem Rewards', body:'Free delivery, discounts, cash payouts' },
          { Icon:Share2,    title:'Your Link',      body:'Share your affiliate link, earn every signup' },
        ].map(({ Icon, title, body }) => (
          <div key={title} style={{
            width:'100%', maxWidth:420,
            background:T.bgCard, border:`1px solid ${T.border}`,
            borderRadius:14, padding:'16px 20px',
            display:'flex', alignItems:'center', gap:16, textAlign:'left',
          }}>
            <div style={{ width:44, height:44, borderRadius:10, flexShrink:0,
              background:`${T.gold}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={20} color={T.gold} />
            </div>
            <div>
              <p style={{ color:T.cream, fontWeight:600, marginBottom:2 }}>{title}</p>
              <p style={{ color:T.creamMid, fontSize:13 }}>{body}</p>
            </div>
          </div>
        ))}

        <motion.button
          whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={handleJoin} disabled={joining}
          style={{
            marginTop:8, padding:'16px 48px', borderRadius:99, border:'none', cursor:'pointer',
            background:`linear-gradient(135deg, ${T.seafoam}, ${T.gold})`,
            color:T.bg, fontWeight:700, fontSize:17,
            opacity: joining ? 0.7 : 1,
          }}>
          {joining ? 'Joining…' : 'Join the Creator Program — Free'}
        </motion.button>
        <p style={{ color:`${T.creamMid}88`, fontSize:12 }}>50 welcome credits awarded instantly</p>
      </div>
    );
  }

  // ── Enrolled — full hub ─────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:T.bg, paddingTop:80, paddingBottom:100 }}>

      {/* Header */}
      <div style={{ padding:'24px 20px 0', maxWidth:600, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:26,
            color:T.cream, fontWeight:700 }}>Creator Hub</h1>
          <TierBadge tier={profile.tier} />
        </div>
        <p style={{ color:T.creamMid, fontSize:13 }}>
          {balance?.total_earned ?? 0} total credits earned
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ overflowX:'auto', padding:'16px 20px 0', maxWidth:600, margin:'0 auto' }}>
        <div style={{ display:'flex', gap:8, minWidth:'max-content' }}>
          {TABS.map(t => (
            <motion.button key={t.id} whileTap={{ scale:0.95 }} onClick={() => setTab(t.id)}
              style={{
                padding:'8px 18px', borderRadius:99, border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600,
                background: tab === t.id ? `linear-gradient(135deg, ${T.seafoam}, ${T.gold})` : T.bgCard,
                color: tab === t.id ? T.bg : T.creamMid,
                transition:'all 0.2s',
              }}>
              {t.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ padding:'16px 20px 40px', maxWidth:600, margin:'0 auto' }}>

        {/* ── DASHBOARD ──────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>

            {/* Balance card */}
            {card(<>
              {sectionLabel('Credit Balance')}
              <div style={{ fontSize:52, fontWeight:700, color:T.gold, lineHeight:1 }}>
                {balance?.balance ?? 0}
              </div>
              <p style={{ color:T.creamMid, fontSize:13, marginTop:4 }}>credits available</p>
              <TierProgressBar tier={profile.tier} totalEarned={balance?.total_earned ?? 0} />
            </>)}

            {/* Earning summary */}
            {card(<>
              {sectionLabel('How to Earn')}
              {[
                { label:'Join the program',        pts:50  },
                { label:'Create a community post', pts:10  },
                { label:'Refer a signup',           pts:100 },
                { label:'Refer a first purchase',   pts:200 },
                { label:'50-likes milestone',       pts:25  },
              ].map(({ label, pts }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', padding:'9px 0',
                  borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ color:T.cream, fontSize:14 }}>{label}</span>
                  <span style={{ color:T.gold, fontWeight:700, fontSize:14 }}>+{pts}</span>
                </div>
              ))}
            </>)}

            {/* Referral quick stats */}
            {referrals && card(<>
              {sectionLabel('Referral Stats')}
              <div style={{ display:'flex', gap:12 }}>
                {[
                  { label:'Signups',   val:referrals.signups   },
                  { label:'Purchases', val:referrals.purchases  },
                  { label:'Earned',    val:referrals.total_credits_earned },
                ].map(({ label, val }) => (
                  <div key={label} style={{ flex:1, textAlign:'center',
                    background:T.bgCardAlt, borderRadius:12, padding:'12px 8px' }}>
                    <div style={{ fontSize:24, fontWeight:700, color:T.gold }}>{val}</div>
                    <div style={{ fontSize:11, color:T.creamMid, marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </>)}
          </motion.div>
        )}

        {/* ── REDEEM ─────────────────────────────────────────── */}
        {tab === 'redeem' && (
          <motion.div key="redeem" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
            {sectionLabel(`Balance: ${balance?.balance ?? 0} Credits`)}
            {REDEEM_OPTS.map(opt => {
              const canAfford  = (balance?.balance ?? 0) >= opt.cost;
              const cashLocked = opt.key === 'cash_payout' && profile.tier !== 'luminary';
              const disabled   = !canAfford || cashLocked || redeeming === opt.key;
              return (
                <div key={opt.key} style={{
                  background:T.bgCard, border:`1px solid ${T.border}`,
                  borderRadius:14, padding:'16px 18px', marginBottom:12,
                  display:'flex', alignItems:'center', gap:14,
                  opacity: disabled ? 0.55 : 1,
                }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ color:T.cream, fontWeight:600 }}>{opt.label}</span>
                      {cashLocked && <span style={{ fontSize:11, color:T.gold,
                        background:`${T.gold}22`, borderRadius:99, padding:'1px 7px' }}>Luminary</span>}
                    </div>
                    <p style={{ color:T.creamMid, fontSize:13 }}>{opt.desc}</p>
                    <p style={{ color:T.gold, fontSize:13, fontWeight:700, marginTop:4 }}>
                      {opt.cost} credits
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale:0.95 }}
                    onClick={() => !disabled && handleRedeem(opt.key)}
                    disabled={disabled}
                    style={{
                      padding:'10px 18px', borderRadius:99, border:'none',
                      cursor: disabled ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:600,
                      background: disabled ? T.bgCardAlt
                        : `linear-gradient(135deg, ${T.seafoam}, ${T.gold})`,
                      color: disabled ? T.creamMid : T.bg,
                      whiteSpace:'nowrap',
                    }}>
                    {redeeming === opt.key ? '…' : 'Redeem'}
                  </motion.button>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── AFFILIATE ──────────────────────────────────────── */}
        {tab === 'affiliate' && (
          <motion.div key="affiliate" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
            {affiliate?.can_affiliate ? (<>
              {card(<>
                {sectionLabel('Your Affiliate Link')}
                <div style={{
                  background:T.bgCardAlt, borderRadius:10, padding:'12px 14px',
                  fontFamily:'monospace', fontSize:13, color:T.cream,
                  wordBreak:'break-all', marginBottom:12,
                }}>
                  {affiliate.affiliate_link}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <motion.button whileTap={{ scale:0.95 }}
                    onClick={() => copyLink(affiliate.affiliate_link)}
                    style={{
                      flex:1, padding:'11px 0', borderRadius:99, border:'none', cursor:'pointer',
                      background:`linear-gradient(135deg, ${T.seafoam}, ${T.gold})`,
                      color:T.bg, fontWeight:700, fontSize:14,
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    }}>
                    <Copy size={15} /> {copied ? 'Copied!' : 'Copy Link'}
                  </motion.button>
                  <motion.button whileTap={{ scale:0.95 }}
                    onClick={() => { if (navigator.share) navigator.share({ url: affiliate.affiliate_link, title: 'Oshun — Dream Deep.' }); }}
                    style={{
                      padding:'11px 18px', borderRadius:99, border:`1px solid ${T.border}`,
                      background:'transparent', color:T.cream, cursor:'pointer',
                      display:'flex', alignItems:'center', gap:6, fontSize:14,
                    }}>
                    <Share2 size={15} /> Share
                  </motion.button>
                </div>
              </>)}

              {card(<>
                {sectionLabel('QR Code')}
                <div style={{ textAlign:'center' }}>
                  <img src={affiliate.qr_url} alt="Affiliate QR"
                    style={{ width:180, height:180, borderRadius:12, background:'white', padding:8 }} />
                  <p style={{ color:T.creamMid, fontSize:12, marginTop:10 }}>
                    Code: <strong style={{ color:T.gold }}>{affiliate.affiliate_code}</strong>
                  </p>
                </div>
              </>)}
            </>) : (
              card(<>
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <Layers size={40} color={T.seafoam} style={{ marginBottom:12 }} />
                  <p style={{ color:T.cream, fontWeight:600, marginBottom:8 }}>
                    Affiliate Link Locked
                  </p>
                  <p style={{ color:T.creamMid, fontSize:13 }}>
                    {affiliate?.unlock_message || 'Reach Glow tier (500 credits) to unlock your affiliate link'}
                  </p>
                  <TierProgressBar tier={profile.tier} totalEarned={balance?.total_earned ?? 0} />
                </div>
              </>)
            )}
          </motion.div>
        )}

        {/* ── HISTORY ────────────────────────────────────────── */}
        {tab === 'history' && (
          <motion.div key="history" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
            {sectionLabel('Transaction History')}
            {txns.length === 0 && (
              <p style={{ color:T.creamMid, textAlign:'center', padding:40 }}>No transactions yet</p>
            )}
            {txns.map(tx => (
              <div key={tx.id} style={{
                background:T.bgCard, border:`1px solid ${T.border}`,
                borderRadius:12, padding:'14px 16px', marginBottom:10,
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <div>
                  <p style={{ color:T.cream, fontSize:14, fontWeight:500 }}>{tx.description}</p>
                  <p style={{ color:T.creamMid, fontSize:12, marginTop:2 }}>
                    {new Date(tx.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                  </p>
                </div>
                <span style={{
                  fontWeight:700, fontSize:16,
                  color: tx.credits_amount > 0 ? '#4ADE80' : '#F87171',
                }}>
                  {tx.credits_amount > 0 ? '+' : ''}{tx.credits_amount}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── LEADERBOARD ────────────────────────────────────── */}
        {tab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
            {sectionLabel('Top Creators')}
            {leaderboard.map((entry, i) => (
              <div key={entry.user_id} style={{
                background:T.bgCard, border:`1px solid ${i < 3 ? T.borderGlow : T.border}`,
                borderRadius:12, padding:'14px 16px', marginBottom:10,
                display:'flex', alignItems:'center', gap:14,
              }}>
                <div style={{
                  width:36, height:36, borderRadius:99, flexShrink:0,
                  background: i === 0 ? `linear-gradient(135deg, ${T.gold}, #FFD700)`
                             : i === 1 ? `${T.seafoam}44`
                             : i === 2 ? `${T.bgCardAlt}`
                             : T.bgCardAlt,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:700, color: i < 2 ? T.bg : T.creamMid, fontSize:15,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ color:T.cream, fontWeight:600, fontSize:14 }}>
                    {entry.affiliate_code}
                  </p>
                  <p style={{ color:T.creamMid, fontSize:12 }}>
                    {entry.total_credits_earned.toLocaleString()} earned
                  </p>
                </div>
                <TierBadge tier={entry.tier} size={12} />
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p style={{ color:T.creamMid, textAlign:'center', padding:40 }}>
                No creators yet — be the first!
              </p>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OSHUN+ SUBSCRIPTION  — Feature Plan 04
// Marketing page, trial CTA, subscription status card
// ─────────────────────────────────────────────────────────────
const PLUS_BENEFITS = [
  {
    Icon: Truck,
    title: 'Free Delivery',
    desc: 'Every order, every time. No minimum order required.',
    vertical: 'Marketplace',
    color: '#4AABBF',
  },
  {
    Icon: Star,
    title: 'Priority Booking',
    desc: "Your requests go to the top of every shop's queue.",
    vertical: 'Oshun Desk',
    color: '#C8A84B',
  },
  {
    Icon: Leaf,
    title: '15% Off Health',
    desc: 'All Oshun Health products, every single purchase.',
    vertical: 'Oshun Health',
    color: '#4ADE80',
  },
  {
    Icon: Heart,
    title: 'Foundation Impact',
    desc: '$1 of your membership funds tech education every month.',
    vertical: 'Foundation',
    color: '#F472B6',
  },
];

function OshunPlusBadge({ size = 'sm' }) {
  const s = size === 'lg' ? { px: 12, py: 5, fs: 13, icon: 14 }
           : size === 'md' ? { px: 10, py: 4, fs: 12, icon: 13 }
           : { px: 7, py: 2, fs: 11, icon: 11 };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:3,
      background:`linear-gradient(135deg, ${T.seafoam}33, ${T.gold}33)`,
      border:`1px solid ${T.gold}66`,
      color:T.gold, borderRadius:99,
      padding:`${s.py}px ${s.px}px`,
      fontSize:s.fs, fontWeight:700,
      letterSpacing:0.3,
    }}>
      <Star size={s.icon} fill={T.gold} /> Oshun+
    </span>
  );
}

function TrialBanner({ sub, onManage }) {
  if (!sub || !['trialing','active'].includes(sub.status)) return null;

  const isTrialing = sub.status === 'trialing';
  const endDate    = sub.trial_end || sub.current_period_end;
  const daysLeft   = endDate
    ? Math.max(0, Math.ceil((new Date(endDate) - Date.now()) / 86400000))
    : null;

  if (!isTrialing || daysLeft === null || daysLeft > 7) return null;

  return (
    <motion.div
      initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
      style={{
        background:`linear-gradient(135deg, ${T.seafoam}22, ${T.gold}22)`,
        border:`1px solid ${T.gold}44`,
        padding:'10px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        fontSize:13,
      }}>
      <span style={{ color:T.cream }}>
        <Star size={13} style={{ marginRight:6 }} color={T.gold} />
        Your Oshun+ trial ends in <strong style={{ color:T.gold }}>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>
      </span>
      <button onClick={onManage} style={{
        background:'transparent', border:`1px solid ${T.gold}`,
        color:T.gold, borderRadius:99, padding:'4px 14px',
        fontSize:12, fontWeight:600, cursor:'pointer',
      }}>Manage</button>
    </motion.div>
  );
}

function OshunPlusPage({ user, setPage }) {
  const [sub,        setSub]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [acting,     setActing]     = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getSubscriptionStatus()
      .then(setSub)
      .catch(() => setSub({ status:'inactive', is_plus:false }))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) { toast.error('Sign in to start your free trial'); return; }
    setActing(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url; // redirect to Stripe Checkout
    } catch (e) { toast.error(e.message); setActing(false); }
  };

  const handleCancel = async () => {
    setActing(true);
    try {
      await cancelSubscription();
      toast.success('Subscription will cancel at end of current period');
      const updated = await getSubscriptionStatus();
      setSub(updated);
    } catch (e) { toast.error(e.message); }
    setActing(false);
  };

  const handleReactivate = async () => {
    setActing(true);
    try {
      await reactivateSubscription();
      toast.success('Subscription reactivated!');
      const updated = await getSubscriptionStatus();
      setSub(updated);
    } catch (e) { toast.error(e.message); }
    setActing(false);
  };

  const handlePortal = async () => {
    try {
      const { url } = await getStripeBillingPortal();
      window.open(url, '_blank');
    } catch (e) { toast.error(e.message); }
  };

  const isPlus       = sub?.is_plus;
  const isCancelling = sub?.cancelled_at && isPlus;
  const isCancelled  = sub?.status === 'cancelled';

  const formatDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
    : null;

  return (
    <div style={{ minHeight:'100vh', background:T.bg, paddingTop:80, paddingBottom:100 }}>

      {/* Hero */}
      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ textAlign:'center', padding:'40px 24px 32px', maxWidth:540, margin:'0 auto' }}>

        <div style={{ marginBottom:16 }}>
          <span style={{
            fontSize:54, fontFamily:'"Playfair Display",serif',
            fontWeight:700, color:T.cream, letterSpacing:-1,
          }}>Oshun</span>
          <span style={{
            fontSize:54, fontFamily:'"Playfair Display",serif',
            fontWeight:700,
            background:`linear-gradient(135deg, ${T.seafoam}, ${T.gold})`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>+</span>
        </div>

        <p style={{ color:T.creamMid, fontSize:16, lineHeight:1.6, marginBottom:28 }}>
          One membership. Four verticals. Unlimited access.
        </p>

        <div style={{ marginBottom:8 }}>
          <span style={{ fontSize:48, fontWeight:700, color:T.gold }}>$9.99</span>
          <span style={{ color:T.creamMid, fontSize:16 }}>/month</span>
        </div>
        <p style={{ color:T.seafoam, fontSize:14, marginBottom:32 }}>
          Start with a 14-day free trial — cancel anytime
        </p>

        {loading ? (
          <div style={{ height:54, borderRadius:99, background:T.bgCard,
            animation:'tide 1.5s ease-in-out infinite', maxWidth:280, margin:'0 auto' }} />
        ) : isPlus ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <OshunPlusBadge size="lg" />
            <p style={{ color:T.creamMid, fontSize:13 }}>
              {sub.status === 'trialing'
                ? `Trial ends ${formatDate(sub.trial_end)}`
                : `Renews ${formatDate(sub.current_period_end)}`}
            </p>
            {isCancelling && (
              <p style={{ color:'#F87171', fontSize:13 }}>
                Cancels {formatDate(sub.current_period_end)} — <button
                  onClick={handleReactivate} disabled={acting}
                  style={{ background:'none', border:'none', color:T.gold,
                    cursor:'pointer', fontWeight:600, fontSize:13 }}>
                  Reactivate
                </button>
              </p>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <motion.button whileTap={{ scale:0.96 }} onClick={handlePortal}
                style={{
                  padding:'12px 24px', borderRadius:99, border:`1px solid ${T.border}`,
                  background:'transparent', color:T.cream, cursor:'pointer', fontSize:14, fontWeight:600,
                }}>
                Manage Billing
              </motion.button>
              {!isCancelling && (
                <motion.button whileTap={{ scale:0.96 }}
                  onClick={handleCancel} disabled={acting}
                  style={{
                    padding:'12px 24px', borderRadius:99, border:`1px solid #F8717144`,
                    background:'transparent', color:'#F87171', cursor:'pointer',
                    fontSize:14, fontWeight:600,
                  }}>
                  Cancel Plan
                </motion.button>
              )}
            </div>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={handleSubscribe} disabled={acting}
            style={{
              padding:'16px 52px', borderRadius:99, border:'none', cursor:'pointer',
              background:`linear-gradient(135deg, ${T.seafoam}, ${T.gold})`,
              color:T.bg, fontWeight:700, fontSize:17,
              opacity: acting ? 0.7 : 1,
              boxShadow:`0 4px 24px ${T.gold}44`,
            }}>
            {acting ? 'Redirecting…' : 'Start Free Trial'}
          </motion.button>
        )}
      </motion.div>

      {/* Benefits grid */}
      <div style={{ padding:'0 20px 40px', maxWidth:560, margin:'0 auto' }}>
        <p style={{ fontSize:11, fontWeight:600, letterSpacing:2, color:T.seafoam,
          textTransform:'uppercase', textAlign:'center', marginBottom:20 }}>
          What's Included
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {PLUS_BENEFITS.map(({ Icon, title, desc, vertical, color }, i) => (
            <motion.div key={title}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                background:T.bgCard, border:`1px solid ${T.border}`,
                borderRadius:16, padding:'18px 16px',
              }}>
              <div style={{
                width:42, height:42, borderRadius:10, marginBottom:12,
                background:`${color}22`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon size={20} color={color} />
              </div>
              <span style={{ fontSize:10, color, fontWeight:600,
                letterSpacing:1.5, textTransform:'uppercase' }}>{vertical}</span>
              <h3 style={{ color:T.cream, fontSize:15, fontWeight:700, margin:'4px 0 6px' }}>{title}</h3>
              <p style={{ color:T.creamMid, fontSize:12, lineHeight:1.5 }}>{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Foundation highlight */}
        <div style={{
          marginTop:16, background:T.bgCard,
          border:`1px solid ${T.gold}44`,
          borderRadius:16, padding:'18px 20px',
          display:'flex', alignItems:'center', gap:16,
        }}>
          <div style={{ width:48, height:48, borderRadius:12, flexShrink:0,
            background:`${T.gold}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Heart size={22} color={T.gold} fill={`${T.gold}55`} />
          </div>
          <div>
            <p style={{ color:T.gold, fontWeight:700, fontSize:14, marginBottom:4 }}>
              Built into every subscription
            </p>
            <p style={{ color:T.creamMid, fontSize:13, lineHeight:1.5 }}>
              $1 of every Oshun+ payment funds the Oshun Foundation — building the technical
              certification pipeline for the next generation.
            </p>
          </div>
        </div>

        {/* FAQ / reassurances */}
        {[
          { Icon:CheckCircle, text:'Cancel anytime — no contracts, no hidden fees' },
          { Icon:Clock,       text:'14-day free trial — your card is not charged until day 15' },
          { Icon:Zap,         text:'Benefits activate instantly after trial starts' },
        ].map(({ Icon, text }) => (
          <div key={text} style={{ display:'flex', alignItems:'center', gap:12,
            padding:'12px 0', borderBottom:`1px solid ${T.border}` }}>
            <Icon size={16} color={T.seafoam} />
            <span style={{ color:T.creamMid, fontSize:13 }}>{text}</span>
          </div>
        ))}

        {!loading && !isPlus && !user && (
          <p style={{ color:`${T.creamMid}88`, fontSize:12, textAlign:'center', marginTop:20 }}>
            <span style={{ cursor:'pointer', color:T.seafoam }}
              onClick={() => setPage('home')}>
              Sign in or create an account
            </span> to start your trial
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [page,             setPage]             = useState("home");
  const [cart,             setCart]             = useState([]);
  const [user,             setUser]             = useState(null);
  const [authOpen,         setAuthOpen]         = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedService,  setSelectedService]  = useState(null);

  // ── SHARED ORDER STATE ──────────────────────────────────────
  // activeOrder is the single source of truth for delivery status.
  // BusinessDashboard and DriverDashboard both write to it via
  // setActiveOrder; TrackingPage reads from it directly.
  // In production this would be a WebSocket subscription or a
  // polling call to your orders API.
  const [activeOrder,    setActiveOrder]    = useState(null);
  const [selectedBrand,  setSelectedBrand]  = useState(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [shopCategory,   setShopCategory]   = useState(null);
  const [conciergeOpen,  setConciergeOpen]  = useState(false);
  const [subscription,   setSubscription]   = useState(null);

  // Load subscription status when user logs in
  useEffect(() => {
    if (!user) { setSubscription(null); return; }
    getSubscriptionStatus()
      .then(setSubscription)
      .catch(() => setSubscription({ status:'inactive', is_plus:false }));
  }, [user?.id]);

  // Handle Stripe redirect back with success/cancel params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oshun_plus') === 'success') {
      toast.success('Welcome to Oshun+! Your trial has started.');
      window.history.replaceState({}, '', '/');
      getSubscriptionStatus().then(setSubscription).catch(() => {});
    }
    if (params.get('oshun_plus') === 'cancelled') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Dashboard tab state — driven by nav bar clicks
  const [bizTab,   setBizTab]   = useState(null);
  const [brandTab, setBrandTab] = useState(null);

  // ── CATALOG STATE — starts with mock data, replaced by real API data ────────
  const [liveProducts,      setLiveProducts]      = useState(PRODUCTS);
  const [liveBusinesses,    setLiveBusinesses]    = useState(BUSINESSES);
  const [liveServices,      setLiveServices]      = useState(SERVICES);
  const [liveBrandPartners, setLiveBrandPartners] = useState(BRAND_PARTNERS);
  const [liveBrandProducts, setLiveBrandProducts] = useState(BRAND_PRODUCTS);

  // Fetch real catalog from Express backend on mount.
  // Uses Promise.allSettled so one failing endpoint doesn't block the others.
  // Falls back to mock constants if the backend is unreachable.
  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      try {
        const [prods, bizList, svcList, brands] = await Promise.allSettled([
          fetchProducts(),
          fetchBusinesses(),
          fetchServices(),
          fetchBrandPartners(),
        ]);
        if (cancelled) return;
        if (prods.status   === 'fulfilled' && prods.value.length)   setLiveProducts(prods.value);
        if (bizList.status === 'fulfilled' && bizList.value.length) setLiveBusinesses(bizList.value);
        if (svcList.status === 'fulfilled' && svcList.value.length) setLiveServices(svcList.value);
        if (brands.status  === 'fulfilled' && brands.value.length)  setLiveBrandPartners(brands.value);
      } catch (e) {
        console.warn('[Oshun] Catalog load failed — using mock data:', e.message);
      }
    }
    loadCatalog();
    return () => { cancelled = true; };
  }, []);

  // Called by Navbar when a role-tab link is clicked
  const handleTabChange = (pageId, tab) => {
    if (pageId === "dashboard")      setBizTab(tab);
    if (pageId === "branddashboard") setBrandTab(tab);
  };

  // Convenience updater so sub-components can advance just the status
  const advanceActiveOrderStatus = (orderId) => {
    setActiveOrder(prev => {
      if (!prev || prev.id !== orderId) return prev;
      const next = Math.min((prev.statusIdx ?? 0) + 1, DELIVERY_STATUSES.length - 1);
      return { ...prev, statusIdx: next };
    });
  };

  const isOrderActive = activeOrder && (activeOrder.statusIdx ?? 0) < DELIVERY_STATUSES.length - 1;
  const { isMobile } = useBreakpoint();
  const showBottomNav = isMobile && !["checkout","cart","booking","tracking"].includes(page);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.cream, fontFamily: '"Jost","Inter",-apple-system,sans-serif' }}>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: "#1A1A20",
            border: "1px solid rgba(212,175,55,0.3)",
            color: "#F5ECD7",
            fontFamily: '"Jost","Inter",-apple-system,sans-serif',
            fontSize: 14,
          },
        }}
      />
      <Navbar page={page} setPage={setPage} cart={cart} user={user} onAuthOpen={() => setAuthOpen(true)} activeOrder={isOrderActive ? activeOrder : null} onTabChange={handleTabChange} onSignOut={() => { setUser(null); setPage("home"); toast.success("Signed out"); }} />

      <TrialBanner sub={subscription} onManage={() => setPage('oshun-plus')} />

      <AnimatePresence mode="wait">
      <motion.div
        key={page}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ paddingBottom: showBottomNav ? 64 : 0 }}
      >
        {page === "home"      && <HomePage          setPage={setPage} setSelectedBusiness={setSelectedBusiness} setSelectedService={setSelectedService} setSearchQuery={setSearchQuery} setShopCategory={setShopCategory} user={user} products={liveProducts} businesses={liveBusinesses} services={liveServices} brandPartners={liveBrandPartners} />}
        {page === "search"    && <SearchResultsPage query={searchQuery} cart={cart} setCart={setCart} setPage={setPage} setSelectedBusiness={setSelectedBusiness} setSelectedService={setSelectedService} setSelectedBrand={setSelectedBrand} setSearchQuery={(q) => { setSearchQuery(q); setPage("search"); }} products={liveProducts} businesses={liveBusinesses} services={liveServices} brandPartners={liveBrandPartners} brandProducts={liveBrandProducts} />}
        {page === "shop"      && <ShopPage          cart={cart} setCart={setCart} setSelectedBrand={setSelectedBrand} setPage={setPage} initialCategory={shopCategory} products={liveProducts} brandProducts={liveBrandProducts} />}
        {page === "brands"    && <BrandDirectoryPage setPage={setPage} setSelectedBrand={setSelectedBrand} brandPartners={liveBrandPartners} />}
        {page === "brand"     && <BrandStorefrontPage brand={selectedBrand} cart={cart} setCart={setCart} setPage={setPage} brandProducts={liveBrandProducts} />}
        {page === "services"  && <ServicesPage      setPage={setPage} setSelectedService={setSelectedService} services={liveServices} />}
        {page === "business"  && <BusinessPage      business={selectedBusiness} cart={cart} setCart={setCart} setPage={setPage} setSelectedService={setSelectedService} user={user} onAuthOpen={() => setAuthOpen(true)} products={liveProducts} services={liveServices} />}
        {page === "cart"      && <CartPage          cart={cart} setCart={setCart} setPage={setPage} />}
        {page === "checkout"  && <CheckoutPage      cart={cart} setCart={setCart} setPage={setPage} setActiveOrder={setActiveOrder} />}
        {page === "tracking"  && <TrackingPage   order={activeOrder} setPage={setPage} setCart={setCart} />}
        {page === "booking"   && <BookingPage    service={selectedService} setPage={setPage} />}
        {page === "profile"        && <ProfilePage         user={user} setPage={setPage} />}
        {page === "tryon"          && <VirtualTryOnPage    setPage={setPage} />}
        {page === "subscribe"      && <SubscriptionBoxPage setPage={setPage} user={user} onAuthOpen={() => setAuthOpen(true)} />}
        {page === "dashboard"      && <BusinessDashboard   user={user} activeOrder={activeOrder} advanceActiveOrderStatus={advanceActiveOrderStatus} dispatchDelivery={dispatchDelivery} requestTab={bizTab} />}
        {page === "driver"         && <DriverDashboard     user={user} activeOrder={activeOrder} advanceActiveOrderStatus={advanceActiveOrderStatus} />}
        {page === "branddashboard" && <BrandDashboard      user={user} requestTab={brandTab} />}
        {page === "join"           && <JoinPage            setPage={setPage} />}
        {page === "community"      && <CommunityFeed       user={user} cart={cart} setCart={setCart} setPage={setPage} />}
        {page === "creator"        && <CreatorHub          user={user} setPage={setPage} />}
        {page === "oshun-plus"     && <OshunPlusPage       user={user} setPage={setPage} />}
      </motion.div>
      </AnimatePresence>

      {showBottomNav && (
        <MobileBottomNav page={page} setPage={setPage} cart={cart} user={user} onAuthOpen={() => setAuthOpen(true)} />
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} setUser={setUser} setPage={setPage} />}

      {/* ── Beauty Concierge FAB ── */}
      {!["checkout","cart","booking"].includes(page) && (
        <>
          <BeautyConcierge isOpen={conciergeOpen} onClose={() => setConciergeOpen(false)} setPage={setPage} setCart={setCart} />
          <button
            onClick={() => setConciergeOpen(o => !o)}
            style={{
              position:"fixed", bottom: isMobile ? 76 : 20, right: isMobile ? 16 : 20,
              width:54, height:54, borderRadius:"50%",
              background: conciergeOpen ? `linear-gradient(135deg,${T.purple},${T.gold})` : `linear-gradient(135deg,${T.gold},${T.goldDark})`,
              border:"none", cursor:"pointer", color:"#ffffff", fontSize:22,
              boxShadow:`0 4px 20px ${T.goldGlow}, 0 0 0 3px ${conciergeOpen ? T.purple+"44" : T.gold+"33"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              zIndex:499, transition:"all 0.25s",
              animation: conciergeOpen ? "none" : "goldGlow 3s ease-in-out infinite",
            }}
          >
            {conciergeOpen ? <X size={22} color="white" /> : "✦"}
          </button>
        </>
      )}
    </div>
  );
}
