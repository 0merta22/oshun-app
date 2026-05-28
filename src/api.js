// ============================================================
//  src/api.js — Oshun API utility
//  All calls to the Express backend live here.
//  Usage: import { fetchProducts } from './api';
// ============================================================

// In local dev, VITE_BACKEND_URL is empty — requests go to /api/* which Vite proxies to Railway.
// In production (Vercel), VITE_BACKEND_URL is the full Railway URL for direct requests.
const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

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

// ── The Wave — News Feed ──────────────────────────────────────

/**
 * Fetch RSS-aggregated news articles from Black-owned / Black-focused media.
 * @param {object} params - category: 'all'|'business'|'culture'|'community'|'wellness', page, limit
 * Returns { articles: [...], total, cached }
 */
export async function fetchNews(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/news${qs ? `?${qs}` : ''}`);
}

// ── Community Feed ────────────────────────────────────────────

/**
 * Fetch posts for the feed.
 * @param {object} params - type: 'foryou'|'following'|'trending', category, page, limit
 */
export async function getFeed(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await apiFetch(`/api/community/feed${qs ? `?${qs}` : ''}`);
  return data.posts ?? [];
}

export async function getPost(id) {
  const data = await apiFetch(`/api/community/posts/${id}`);
  return data.post ?? data;
}

export async function createPost(postData) {
  return apiFetch('/api/community/posts', { method: 'POST', body: JSON.stringify(postData) });
}

export async function deletePost(id) {
  return apiFetch(`/api/community/posts/${id}`, { method: 'DELETE' });
}

// ── Likes ─────────────────────────────────────────────────────

export async function likePost(id) {
  return apiFetch(`/api/community/posts/${id}/like`, { method: 'POST' });
}

export async function unlikePost(id) {
  return apiFetch(`/api/community/posts/${id}/like`, { method: 'DELETE' });
}

// ── Saves ─────────────────────────────────────────────────────

export async function savePost(id) {
  return apiFetch(`/api/community/posts/${id}/save`, { method: 'POST' });
}

export async function unsavePost(id) {
  return apiFetch(`/api/community/posts/${id}/save`, { method: 'DELETE' });
}

export async function getSavedPosts() {
  const data = await apiFetch('/api/community/saves');
  return data.posts ?? [];
}

// ── Comments ──────────────────────────────────────────────────

export async function getComments(postId) {
  const data = await apiFetch(`/api/community/posts/${postId}/comments`);
  return data.comments ?? [];
}

export async function addComment(postId, content) {
  return apiFetch(`/api/community/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
}

export async function deleteComment(id) {
  return apiFetch(`/api/community/comments/${id}`, { method: 'DELETE' });
}

// ── Social (follow/unfollow) ──────────────────────────────────

export async function followUser(userId) {
  return apiFetch(`/api/community/follow/${userId}`, { method: 'POST' });
}

export async function unfollowUser(userId) {
  return apiFetch(`/api/community/follow/${userId}`, { method: 'DELETE' });
}

// ── Discovery ─────────────────────────────────────────────────

export async function getTrendingHashtags() {
  const data = await apiFetch('/api/community/hashtags/trending');
  return data.hashtags ?? [];
}

export async function getPostsByHashtag(tag) {
  const data = await apiFetch(`/api/community/hashtags/${encodeURIComponent(tag)}`);
  return data.posts ?? [];
}

export async function searchFeed(q) {
  const data = await apiFetch(`/api/community/search?q=${encodeURIComponent(q)}`);
  return data.posts ?? [];
}

export async function getUserPosts(userId) {
  const data = await apiFetch(`/api/community/users/${userId}/posts`);
  return data.posts ?? [];
}

// ── Creator Partner Program ───────────────────────────────────

export async function joinCreatorProgram() {
  return apiFetch('/api/creators/join', { method: 'POST' });
}

export async function getMyCreatorProfile() {
  return apiFetch('/api/creators/me');
}

export async function getCreditBalance() {
  return apiFetch('/api/creators/me/credits');
}

export async function getCreatorTransactions({ page = 1, limit = 20 } = {}) {
  return apiFetch(`/api/creators/me/transactions?page=${page}&limit=${limit}`);
}

export async function getMyReferrals() {
  return apiFetch('/api/creators/me/referrals');
}

export async function getAffiliateLink() {
  return apiFetch('/api/creators/me/affiliate');
}

export async function redeemCredits({ redemption_type, order_id }) {
  return apiFetch('/api/creators/credits/redeem', {
    method: 'POST',
    body: JSON.stringify({ redemption_type, order_id }),
  });
}

export async function getCreatorLeaderboard() {
  return apiFetch('/api/creators/leaderboard');
}

// ── Oshun+ Subscription ───────────────────────────────────────

export async function getSubscriptionStatus() {
  return apiFetch('/api/subscription/status');
}

/**
 * Creates a Stripe Checkout Session and returns { url }.
 * Frontend should redirect to url for payment collection.
 */
export async function createCheckoutSession() {
  return apiFetch('/api/subscription/create', { method: 'POST' });
}

export async function cancelSubscription() {
  return apiFetch('/api/subscription/cancel', { method: 'POST' });
}

export async function reactivateSubscription() {
  return apiFetch('/api/subscription/reactivate', { method: 'POST' });
}

export async function getStripeBillingPortal() {
  return apiFetch('/api/subscription/portal');
}

// ── AI Beauty Concierge ───────────────────────────────────────

/**
 * Sends a message to the AI Beauty Concierge.
 * Returns a raw fetch Response — do NOT call .json() on it.
 * Use the ReadableStream to consume SSE tokens.
 *
 * SSE events from the server:
 *   { conversation_id: "uuid" }   — sent first, persist this
 *   { token: "text chunk" }       — stream these into the UI
 *   { done: true }                — stream complete
 *   { error: "message" }         — something went wrong
 */
export function sendConciergeMessage(message, conversationId) {
  const token = getToken();
  return fetch(`${BASE_URL}/api/concierge/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversationId }),
  });
}

export async function getConciergeHistory(conversationId) {
  const qs = conversationId ? `?conversationId=${conversationId}` : '';
  return apiFetch(`/api/concierge/history${qs}`);
}

export async function startNewConciergeConversation() {
  return apiFetch('/api/concierge/conversation/new', { method: 'POST' });
}
