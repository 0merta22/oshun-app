#!/usr/bin/env node
// ============================================================
//  upgrade_ui.cjs — Adds Framer Motion, Sonner toasts, and
//  premium micro-interactions to oshun-app/src/App.jsx
//
//  Run from: /Users/omerta/oshun-app/
//  Command:  node upgrade_ui.cjs
// ============================================================

const fs   = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, 'src', 'App.jsx');

if (!fs.existsSync(APP_PATH)) {
  console.error('❌  src/App.jsx not found. Run from /Users/omerta/oshun-app/');
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

// ── 1. Add framer-motion + sonner imports ─────────────────────────────────────
replace(
  'Add framer-motion + sonner imports',
  `import { useState, useEffect, useRef, useCallback } from "react";
import { fetchProducts, fetchBusinesses, fetchServices, fetchBrandPartners } from './api';`,
  `import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import { fetchProducts, fetchBusinesses, fetchServices, fetchBrandPartners } from './api';`
);

// ── 2. Add Toaster to App return (right after the opening div) ────────────────
replace(
  'Add Toaster to App root',
  `  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.cream, fontFamily: '"Inter","SF Pro Display",-apple-system,sans-serif' }}>
      <Navbar`,
  `  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.cream, fontFamily: '"Inter","SF Pro Display",-apple-system,sans-serif' }}>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: "#1A1A20",
            border: "1px solid rgba(212,175,55,0.3)",
            color: "#F5ECD7",
            fontFamily: '"Inter","SF Pro Display",-apple-system,sans-serif',
            fontSize: 14,
          },
        }}
      />
      <Navbar`
);

// ── 3. Wrap page content area in AnimatePresence for page transitions ──────────
replace(
  'Add AnimatePresence page transitions',
  `      <div style={{ paddingBottom: showBottomNav ? 64 : 0 }}>
        {page === "home"`,
  `      <AnimatePresence mode="wait">
      <motion.div
        key={page}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ paddingBottom: showBottomNav ? 64 : 0 }}
      >
        {page === "home"`
);

// Close the AnimatePresence — find the end of the page content div
replace(
  'Close AnimatePresence wrapper',
  `      {showBottomNav && (
        <MobileBottomNav`,
  `      </motion.div>
      </AnimatePresence>

      {showBottomNav && (
        <MobileBottomNav`
);

// ── 4. Upgrade BusinessCard — motion.button with spring lift ──────────────────
replace(
  'Upgrade BusinessCard to motion.button',
  `function BusinessCard({ biz, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="oshun-card"
      style={{
        background: T.bgCard,
        border: \`1px solid \${hovered ? T.borderGlow : T.borderMid}\`,
        borderRadius: 18, overflow: "hidden", cursor: "pointer", textAlign: "left", width: "100%",
        boxShadow: hovered ? \`0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px \${T.borderGlow}\` : "0 2px 12px rgba(0,0,0,0.3)",
      }}>`,
  `function BusinessCard({ biz, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="oshun-card"
      whileHover={{ y: -6, boxShadow: \`0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px \${T.borderGlow}\` }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}
      style={{
        background: T.bgCard,
        border: \`1px solid \${T.borderMid}\`,
        borderRadius: 18, overflow: "hidden", cursor: "pointer", textAlign: "left", width: "100%",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>`
);

// Close tag
replace(
  'Close BusinessCard motion.button',
  `    </button>
  );
}

function ServiceCard`,
  `    </motion.button>
  );
}

function ServiceCard`
);

// ── 5. Upgrade ServiceCard — motion.button with spring lift ──────────────────
replace(
  'Upgrade ServiceCard to motion.button',
  `function ServiceCard({ service, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="oshun-card"`,
  `function ServiceCard({ service, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="oshun-card"
      whileHover={{ y: -5, boxShadow: \`0 14px 36px rgba(0,0,0,0.65), 0 0 0 1px \${T.borderGlow}\` }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}`
);

// ── 6. Upgrade ProductCard — motion.div + toast on add ───────────────────────
replace(
  'Upgrade ProductCard to motion.div',
  `  return (
    <div
      className="oshun-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.bgCard,
        border: \`1px solid \${outOfStock ? T.error+"44" : hovered ? T.borderGlow : T.borderMid}\`,
        borderRadius: 18,
        overflow: "hidden",
        opacity: outOfStock ? 0.72 : 1,
        boxShadow: hovered ? \`0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px \${T.borderGlow}\` : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >`,
  `  return (
    <motion.div
      className="oshun-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: \`0 16px 40px rgba(0,0,0,0.65), 0 0 0 1px \${T.borderGlow}\` }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      style={{
        background: T.bgCard,
        border: \`1px solid \${outOfStock ? T.error+"44" : T.borderMid}\`,
        borderRadius: 18,
        overflow: "hidden",
        opacity: outOfStock ? 0.72 : 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >`
);

// Close ProductCard div → motion.div
replace(
  'Close ProductCard motion.div',
  `    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRAND PRODUCT CARD`,
  `    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRAND PRODUCT CARD`
);

// ── 7. Add toast to ProductCard handleAdd ────────────────────────────────────
replace(
  'Add toast to ProductCard handleAdd',
  `  const handleAdd = () => {
    if (outOfStock) return;
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };`,
  `  const handleAdd = () => {
    if (outOfStock) return;
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    toast.success(\`\${product.name} added to cart\`, {
      icon: "🛍️",
      duration: 2000,
    });
  };`
);

// ── 8. Add toast to ShopPage addToCart ───────────────────────────────────────
replace(
  'Add toast to ShopPage addToCart',
  `  const addToCart = product => {
    setCart(prev => {`,
  `  const addToCart = product => {
    toast.success(\`\${product.name} added to cart\`, { icon: "🛍️", duration: 2000 });
    setCart(prev => {`
);

// ── 9. Stagger product grid children (ShopPage) ───────────────────────────────
replace(
  'Add stagger container to ShopPage product grid',
  `            {localFiltered.map(p => <ProductCard key={p.id} product={p} onAddToCart={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />)}`,
  `            {localFiltered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                <ProductCard product={p} onAddToCart={() => addToCart(p)} inCart={cart.some(i => i.id === p.id)} />
              </motion.div>
            ))}`
);

// ── Done ──────────────────────────────────────────────────────────────────────
if (changes > 0) {
  fs.writeFileSync(APP_PATH, src, 'utf8');
  console.log(`\n🎉  Done! Made ${changes} upgrades to src/App.jsx`);
  console.log('   • Framer Motion page transitions');
  console.log('   • Spring-physics card hover lifts on Business, Service & Product cards');
  console.log('   • Staggered product grid entrance animation');
  console.log('   • Toast notifications on Add to Cart');
  console.log('   • Luxury dark Toaster positioned top-center\n');
} else {
  console.log('\n⚠️  No changes made.\n');
}
