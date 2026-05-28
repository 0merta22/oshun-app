// ============================================================
//  src/api.js — Oshun API utility
//  All calls to the Express backend live here.
//  Usage: import { fetchProducts } from './api';
// ============================================================

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// ── helpers ──────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('oshun_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────

export async function registerUser({ name, email, password, type = 'consumer' }) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: name, name, email, password, type }),
  });
}

export async function loginUser({ email, password }) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser() {
  return apiFetch('/api/auth/me');
}

// ── Products ─────────────────────────────────────────────────

/**
 * Returns all active products.
 * Shape: [{ id, name, description, price, category, image_url, stock_qty, business_id, brand_id }]
 */
export async function fetchProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await apiFetch(`/api/products${qs ? `?${qs}` : ''}`);
  // backend returns { success, products } or just an array — handle both
  return Array.isArray(data) ? data : (data.products ?? []);
}

export async function fetchProductById(id) {
  const data = await apiFetch(`/api/products/${id}`);
  return data.product ?? data;
}

// ── Businesses ───────────────────────────────────────────────

/**
 * Returns all active businesses.
 * Shape: [{ id, name, tagline, category, location, description, image_url, initials }]
 */
export async function fetchBusinesses(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await apiFetch(`/api/products/businesses/all${qs ? `?${qs}` : ''}`);
  return Array.isArray(data) ? data : (data.businesses ?? []);
}

// ── Services ─────────────────────────────────────────────────

/**
 * Returns all active services.
 * Shape: [{ id, name, description, category, price, duration_minutes, provider, image_url, business_id }]
 */
export async function fetchServices(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await apiFetch(`/api/products/services/all${qs ? `?${qs}` : ''}`);
  return Array.isArray(data) ? data : (data.services ?? []);
}

// ── Brand Partners ───────────────────────────────────────────

/**
 * Returns all active brand partners.
 * Shape: [{ id, name, description, logo_url, website, category }]
 */
export async function fetchBrandPartners(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await apiFetch(`/api/products/brands/all${qs ? `?${qs}` : ''}`);
  return Array.isArray(data) ? data : (data.brands ?? []);
}

// ── Orders ───────────────────────────────────────────────────

export async function createOrder(orderData) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

export async function fetchMyOrders() {
  const data = await apiFetch('/api/orders/my');
  return Array.isArray(data) ? data : (data.orders ?? []);
}

export async function fetchOrderById(id) {
  const data = await apiFetch(`/api/orders/${id}`);
  return data.order ?? data;
}

// ── Payments ─────────────────────────────────────────────────

export async function createPaymentIntent(amount) {
  return apiFetch('/api/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

// ── Uploads ──────────────────────────────────────────────────

export async function uploadImage(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Upload error ${res.status}`);
  }

  return res.json(); // { url: '...' }
}
