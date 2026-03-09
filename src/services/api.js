const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const AUTH_BASE_RAW = import.meta.env.VITE_AUTH_API_URL || '';
const TOKEN_STORAGE_KEY = 'trlm_auth_token_v1';
const AUTH_PROXY_BASE = '/ext-api';
const IS_DEV = import.meta.env.DEV;

const normalizeAuthBase = (rawBase) => {
  const base = String(rawBase || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  if (base.endsWith('/api/api')) return base;
  if (base.endsWith('/api')) return `${base}/api`;
  return `${base}/api/api`;
};

const AUTH_BASE = normalizeAuthBase(AUTH_BASE_RAW);
const AUTH_BASE_FOR_CALLS = IS_DEV ? `${AUTH_PROXY_BASE}/api/api` : AUTH_BASE;

const ensureAuthBase = () => {
  if (AUTH_BASE_FOR_CALLS) return;
  throw new Error('Auth API base URL is missing. Set VITE_AUTH_API_URL.');
};

const parseListResponse = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.data)) return rawData.data;
  if (Array.isArray(rawData?.result)) return rawData.result;
  if (Array.isArray(rawData?.items)) return rawData.items;
  if (Array.isArray(rawData?.payload)) return rawData.payload;
  return [];
};

const fetchListWithFallback = async (urls) => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const rawData = await res.json().catch(() => []);
      if (!res.ok) continue;
      const list = parseListResponse(rawData);
      if (list.length) return list;
    } catch {
      // try next candidate URL
    }
  }
  return [];
};

const extractErrorMessage = (raw) => {
  if (!raw) return 'Request failed';
  if (typeof raw === 'string') return raw;
  if (raw.message) return raw.message;
  if (raw.title) return raw.title;
  if (Array.isArray(raw.errors)) return raw.errors.join(', ');
  if (raw.errors && typeof raw.errors === 'object') {
    const flat = Object.values(raw.errors).flat().filter(Boolean);
    if (flat.length) return flat.join(', ');
  }
  return 'Request failed';
};

const requestJsonWithCandidates = async (candidates, payload, fallbackMessage) => {
  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        const txt = await res.text().catch(() => '');
        data = txt ? { message: txt } : {};
      }

      if (!res.ok) {
        throw new Error(extractErrorMessage(data) || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(lastError?.message || fallbackMessage);
};

let authTokenCache = null;

export function getAuthToken() {
  if (authTokenCache) return authTokenCache;
  if (typeof window === 'undefined') return null;
  authTokenCache = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  return authTokenCache;
}

export function setAuthToken(token) {
  authTokenCache = token || null;
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function clearAuthToken() {
  setAuthToken(null);
}

const withAuthHeaders = (headers = {}) => {
  const token = getAuthToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};

export const api = {
  async login(payload) {
    ensureAuthBase();
    const candidates = IS_DEV ? [`${AUTH_BASE_FOR_CALLS}/auth/login`] : [`${AUTH_BASE_FOR_CALLS}/auth/login`];
    return requestJsonWithCandidates(candidates, payload, 'Login failed');
  },

  async getDistricts() {
    ensureAuthBase();
    const candidates = [`${AUTH_BASE_FOR_CALLS}/master/districts`];
    const data = await fetchListWithFallback(candidates);
    return data.map((d) => ({
      districtId: d.districtId ?? d.id ?? d.district_id ?? '',
      districtName: d.districtName ?? d.name ?? d.district ?? '',
    })).filter((d) => d.districtId !== '' && d.districtName);
  },

  async getBlocksByDistrict(districtId) {
    if (!districtId) return [];
    ensureAuthBase();
    const encodedDistrictId = encodeURIComponent(districtId);
    const candidates = [`${AUTH_BASE_FOR_CALLS}/master/blocks/${encodedDistrictId}`];
    const data = await fetchListWithFallback(candidates);
    return data.map((b) => ({
      blockId: b.blockId ?? b.id ?? b.block_id ?? '',
      blockName: b.blockName ?? b.name ?? b.block ?? '',
      districtId: b.districtId ?? b.district_id ?? districtId,
    })).filter((b) => b.blockId !== '' && b.blockName);
  },

  async getUsers(level) {
    const res = await fetch(`${API_BASE}/users?level=${encodeURIComponent(level)}`, {
      headers: withAuthHeaders(),
    });
    return res.json();
  },

  async upsertUser(payload) {
    const method = payload.id ? 'PUT' : 'POST';
    const url = payload.id ? `${API_BASE}/users/${payload.id}` : `${API_BASE}/users`;
    const res = await fetch(url, {
      method,
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async deleteUser(id, level) {
    await fetch(`${API_BASE}/users/${id}?level=${encodeURIComponent(level)}`, {
      method: 'DELETE',
      headers: withAuthHeaders(),
    });
  },

  async getReports() {
    const res = await fetch(`${API_BASE}/reports`, {
      headers: withAuthHeaders(),
    });
    const rows = await res.json();
    return rows.map((r) => ({ id: r.id, name: r.title, status: r.status }));
  },

  async signUp(payload) {
    ensureAuthBase();
    const candidates = IS_DEV ? [`${AUTH_BASE_FOR_CALLS}/auth/signup`] : [`${AUTH_BASE_FOR_CALLS}/auth/signup`];
    return requestJsonWithCandidates(candidates, payload, 'Signup failed');
  },

  async getPendingRegistrations() {
    const res = await fetch(`${API_BASE}/users/pending`, {
      headers: withAuthHeaders(),
    });
    return res.json();
  },

  async approveUser(userId) {
    const res = await fetch(`${API_BASE}/users/${userId}/approve`, {
      method: 'POST',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    return res.json();
  },

  async rejectUser(userId) {
    const res = await fetch(`${API_BASE}/users/${userId}/reject`, {
      method: 'POST',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    return res.json();
  },
};
