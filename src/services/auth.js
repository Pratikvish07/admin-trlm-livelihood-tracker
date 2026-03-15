import axios from 'axios';

export const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_URL || 'https://trlm.pickitover.com/api/api';

export const AUTH_STORAGE_KEY = 'trlmAdminAuth';

export function getStoredAuth() {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuth(auth) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthToken() {
  return getStoredAuth()?.token || '';
}

export async function loginAdmin({ userId, password }) {
  const payload = {
    livelihoodTrackerId: userId.trim(),
    password,
  };

  const { data } = await axios.post(`${AUTH_API_BASE}/admin/login`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return {
    token: data.token,
    user: {
      id: payload.livelihoodTrackerId.toUpperCase(),
      name: payload.livelihoodTrackerId.toUpperCase(),
      role: data.role,
      district: data.district ?? '',
      block: data.block ?? '',
    },
  };
}
