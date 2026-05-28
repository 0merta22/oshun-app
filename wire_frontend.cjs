#!/usr/bin/env node
// ============================================================
//  wire_frontend.js — Wires oshun-app frontend to the real API
//
//  Run from: /Users/omerta/oshun-app/
//  Command:  node wire_frontend.js
//
//  What it does:
//  1. Adds import for src/api.js into App.jsx
//  2. Updates searchAll() to accept data as optional params
//  3. Adds catalog state (products/businesses/services/etc.) in App()
//  4. Adds useEffect to fetch real data on mount, falling back to mock
//  5. Passes catalog state as props to ShopPage, ServicesPage,
//     SearchResultsPage, BusinessPage, BrandDirectoryPage, BrandStorefrontPage, HomePage
//  6. Updates each component signature to accept those props
//
//  Safe: mock data is always the default, so the app never goes blank
//  if the backend is unreachable.
// ============================================================

const fs = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, 'src', 'App.jsx');

if (!fs.existsSync(APP_PATH)) {
  console.error('❌  src/App.jsx not found. Run this from /Users/omerta/oshun-app/');
  process.exit(1);
}

let src = fs.readFileSync(APP_PATH, 'utf8');
let changes = 0;

function replace(label, search, replacement) {
  if (!src.includes(search)) {
    console.warn(`⚠️  Skipped (not found): ${label}`);
    return;
  }
  src = src.replace(search, replacement);
  changes++;
  console.log(`✅  ${label}`);
}

// ── 1. Add api.js import ──────────────────────────────────────────────────────
replace(
  'Add api.js import',
  `import { useState, useEffect, useRef, useCallback } from "react";`,
  `import { useState, useEffect, useRef, useCallback } from "react";
import { fetchProducts, fetchBusinesses, fetchServices, fetchBrandPartners } from './api';`
);

// ── 2. Update searchAll to accept optional data params ────────────────────────
replace(
  'Update searchAll signature',
  `function searchAll(query) {
  const q = query.toLowerCase().trim();
  if (!q) return { products: [], brands: [], businesses: [], services: [], brandProducts: [] };
  const match = (str) => str?.toLowerCase().includes(q);
  return {
    products:      PRODUCTS.filter(p => match(p.name) || match(p.brand) || match(p.category) || p.tags?.some(match)),
    brandProducts: BRAND_PRODUCTS.filter(p => match(p.name) || match(p.brand) || match(p.category) || p.tags?.some(match)),
    businesses:    BUSINESSES.filter(b => match(b.name) || match(b.tagline) || match(b.category) || b.tags?.some(match)),
    brands:        BRAND_PARTNERS.filter(b => match(b.name) || match(b.tagline) || b.tags?.some(match)),
    services:      SERVICES.filter(s => match(s.name) || match(s.provider) || match(s.description)),
  };
}`,
  `function searchAll(query, {
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
}`
);

// ── 3. Add catalog state + useEffect in App() after existing state vars ───────
replace(
  'Add catalog state + useEffect in App()',
  `  // Dashboard tab state — driven by nav bar clicks
  const [bizTab,   setBizTab]   = useState(null);
  const [brandTab, setBrandTab] = useState(null);`,
  `  // Dashboard tab state — driven by nav bar clicks
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
  }, []);`
);

// ── 4. Update component calls in App JSX to pass catalog props ─────────────────

// HomePage — add catalog props
replace(
  'Pass catalog props to HomePage',
  `{page === "home"      && <HomePage          setPage={setPage} setSelectedBusiness={setSelectedBusiness} setSelectedService={setSelectedService} setSearchQuery={setSearchQuery} setShopCategory={setShopCategory} user={user} />}`,
  `{page === "home"      && <HomePage          setPage={setPage} setSelectedBusiness={setSelectedBusiness} setSelectedService={setSelectedService} setSearchQuery={setSearchQuery} setShopCategory={setShopCategory} user={user} products={liveProducts} businesses={liveBusinesses} services={liveServices} brandPartners={liveBrandPartners} />}`
);

// SearchResultsPage — add catalog props
replace(
  'Pass catalog props to SearchResultsPage',
  `{page === "search"    && <SearchResultsPage query={searchQuery} cart={cart} setCart={setCart} setPage={setPage} setSelectedBusiness={setSelectedBusiness} setSelectedService={setSelectedService} setSelectedBrand={setSelectedBrand} setSearchQuery={(q) => { setSearchQuery(q); setPage("search"); }} />}`,
  `{page === "search"    && <SearchResultsPage query={searchQuery} cart={cart} setCart={setCart} setPage={setPage} setSelectedBusiness={setSelectedBusiness} setSelectedService={setSelectedService} setSelectedBrand={setSelectedBrand} setSearchQuery={(q) => { setSearchQuery(q); setPage("search"); }} products={liveProducts} businesses={liveBusinesses} services={liveServices} brandPartners={liveBrandPartners} brandProducts={liveBrandProducts} />}`
);

// ShopPage — add catalog props
replace(
  'Pass catalog props to ShopPage',
  `{page === "shop"      && <ShopPage          cart={cart} setCart={setCart} setSelectedBrand={setSelectedBrand} setPage={setPage} initialCategory={shopCategory} />}`,
  `{page === "shop"      && <ShopPage          cart={cart} setCart={setCart} setSelectedBrand={setSelectedBrand} setPage={setPage} initialCategory={shopCategory} products={liveProducts} brandProducts={liveBrandProducts} />}`
);

// ServicesPage — add catalog props
replace(
  'Pass catalog props to ServicesPage',
  `{page === "services"  && <ServicesPage      setPage={setPage} setSelectedService={setSelectedService} />}`,
  `{page === "services"  && <ServicesPage      setPage={setPage} setSelectedService={setSelectedService} services={liveServices} />}`
);

// BusinessPage — add catalog props
replace(
  'Pass catalog props to BusinessPage',
  `{page === "business"  && <BusinessPage      business={selectedBusiness} cart={cart} setCart={setCart} setPage={setPage} setSelectedService={setSelectedService} user={user} onAuthOpen={() => setAuthOpen(true)} />}`,
  `{page === "business"  && <BusinessPage      business={selectedBusiness} cart={cart} setCart={setCart} setPage={setPage} setSelectedService={setSelectedService} user={user} onAuthOpen={() => setAuthOpen(true)} products={liveProducts} services={liveServices} />}`
);

// BrandDirectoryPage — add catalog props
replace(
  'Pass catalog props to BrandDirectoryPage',
  `{page === "brands"    && <BrandDirectoryPage setPage={setPage} setSelectedBrand={setSelectedBrand} />}`,
  `{page === "brands"    && <BrandDirectoryPage setPage={setPage} setSelectedBrand={setSelectedBrand} brandPartners={liveBrandPartners} />}`
);

// BrandStorefrontPage — add catalog props
replace(
  'Pass catalog props to BrandStorefrontPage',
  `{page === "brand"     && <BrandStorefrontPage brand={selectedBrand} cart={cart} setCart={setCart} setPage={setPage} />}`,
  `{page === "brand"     && <BrandStorefrontPage brand={selectedBrand} cart={cart} setCart={setCart} setPage={setPage} brandProducts={liveBrandProducts} />}`
);

// ── 5. Update component function signatures to accept catalog props ────────────

// HomePage
replace(
  'Update HomePage signature',
  `function HomePage({ setPage, setSelectedBusiness, setSelectedService, setSearchQuery, setShopCategory, user }) {`,
  `function HomePage({ setPage, setSelectedBusiness, setSelectedService, setSearchQuery, setShopCategory, user, products = PRODUCTS, businesses = BUSINESSES, services = SERVICES, brandPartners = BRAND_PARTNERS }) {`
);

// SearchResultsPage
replace(
  'Update SearchResultsPage signature + searchAll call',
  `function SearchResultsPage({ query, cart, setCart, setPage, setSelectedBusiness, setSelectedService, setSelectedBrand, setSearchQuery }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [localQuery, setLocalQuery] = useState(query);
  const results = searchAll(query);`,
  `function SearchResultsPage({ query, cart, setCart, setPage, setSelectedBusiness, setSelectedService, setSelectedBrand, setSearchQuery, products = PRODUCTS, businesses = BUSINESSES, services = SERVICES, brandPartners = BRAND_PARTNERS, brandProducts = BRAND_PRODUCTS }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [localQuery, setLocalQuery] = useState(query);
  const results = searchAll(query, { products, businesses, services, brands: brandPartners, brandProducts });`
);

// ShopPage
replace(
  'Update ShopPage signature',
  `function ShopPage({ cart, setCart, setSelectedBrand, setPage, initialCategory }) {`,
  `function ShopPage({ cart, setCart, setSelectedBrand, setPage, initialCategory, products = PRODUCTS, brandProducts = BRAND_PRODUCTS }) {`
);

// Replace PRODUCTS usages inside ShopPage body (the two filtered lines)
replace(
  'Update ShopPage PRODUCTS filter lines',
  `  const localFiltered  = activeCat === "all" ? PRODUCTS       : PRODUCTS.filter(p => p.category === activeCat);
  const brandFiltered  = activeCat === "all" ? BRAND_PRODUCTS : BRAND_PRODUCTS.filter(p => p.category === activeCat);`,
  `  const localFiltered  = activeCat === "all" ? products       : products.filter(p => p.category === activeCat);
  const brandFiltered  = activeCat === "all" ? brandProducts : brandProducts.filter(p => p.category === activeCat);`
);

// ServicesPage
replace(
  'Update ServicesPage signature + SERVICES usage',
  `function ServicesPage({ setPage, setSelectedService }) {
  const { isMobile } = useBreakpoint();
  const [activeCat, setActiveCat] = useState("all");
  const filtered = activeCat === "all" ? SERVICES : SERVICES.filter(s => s.category === activeCat);`,
  `function ServicesPage({ setPage, setSelectedService, services = SERVICES }) {
  const { isMobile } = useBreakpoint();
  const [activeCat, setActiveCat] = useState("all");
  const filtered = activeCat === "all" ? services : services.filter(s => s.category === activeCat);`
);

// BusinessPage
replace(
  'Update BusinessPage signature + constants',
  `function BusinessPage({ business, cart, setCart, setPage, setSelectedService, user, onAuthOpen }) {`,
  `function BusinessPage({ business, cart, setCart, setPage, setSelectedService, user, onAuthOpen, products = PRODUCTS, services = SERVICES }) {`
);

replace(
  'Update BusinessPage bizProducts/bizServices filter',
  `  const bizProducts = PRODUCTS.filter(p => p.businessId === business.id);
  const bizServices = SERVICES.filter(s => s.businessId === business.id);`,
  `  const bizProducts = products.filter(p => p.businessId === business.id);
  const bizServices = services.filter(s => s.businessId === business.id);`
);

// BrandDirectoryPage
replace(
  'Update BrandDirectoryPage signature + BRAND_PARTNERS usage',
  `function BrandDirectoryPage({ setPage, setSelectedBrand }) {`,
  `function BrandDirectoryPage({ setPage, setSelectedBrand, brandPartners = BRAND_PARTNERS }) {`
);

replace(
  'Update BrandDirectoryPage BRAND_PARTNERS.map',
  `        {BRAND_PARTNERS.map(b => <BrandCard key={b.id} brand={b} onClick={() => { setSelectedBrand(b); setPage("brand"); }} />)}`,
  `        {brandPartners.map(b => <BrandCard key={b.id} brand={b} onClick={() => { setSelectedBrand(b); setPage("brand"); }} />)}`
);

// BrandStorefrontPage — keep the local `products` variable name to avoid
// breaking lines 2087 and 2089 that already use `products.length` / `products.map`
replace(
  'Update BrandStorefrontPage signature',
  `function BrandStorefrontPage({ brand, cart, setCart, setPage }) {`,
  `function BrandStorefrontPage({ brand, cart, setCart, setPage, brandProducts = BRAND_PRODUCTS }) {`
);

replace(
  'Update BrandStorefrontPage products filter — use prop instead of constant',
  `  const products  = BRAND_PRODUCTS.filter(p => p.brandId === brand.id);`,
  `  const products  = brandProducts.filter(p => p.brandId === brand.id);`
);

// ── Done ──────────────────────────────────────────────────────────────────────
if (changes > 0) {
  fs.writeFileSync(APP_PATH, src, 'utf8');
  console.log(`\n🎉  Done! Made ${changes} changes to src/App.jsx`);
  console.log('   The app now fetches from your backend on load.');
  console.log('   Mock data is still the fallback if the backend is offline.\n');
  console.log('Next: copy src/api.js into your project and make sure');
  console.log('VITE_BACKEND_URL is set (or it defaults to http://localhost:4000)\n');
} else {
  console.log('\n⚠️  No changes made. File may already be patched or strings did not match.\n');
}
