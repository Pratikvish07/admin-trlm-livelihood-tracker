import {
  AUTH_API_BASE,
  clearStoredAuth,
  getAuthToken as getStoredAuthToken,
  getStoredAuth,
  saveAuth,
} from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const AUTH_BASE_RAW = import.meta.env.VITE_AUTH_API_URL || '';
const AUTH_PROXY_BASE = '/ext-api';
const IS_DEV = import.meta.env.DEV;
const TOKEN_STORAGE_KEY = 'trlm_auth_token_v1';

const normalizeAuthBase = (rawBase) => {
  const base = String(rawBase || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  if (base.endsWith('/api/api')) return base;
  if (base.endsWith('/api')) return `${base}/api`;
  return `${base}/api/api`;
};

const AUTH_BASE = normalizeAuthBase(AUTH_BASE_RAW);
const AUTH_BASE_FOR_CALLS = IS_DEV && AUTH_BASE ? `${AUTH_PROXY_BASE}/api/api` : AUTH_BASE || AUTH_API_BASE;

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

const pickFirst = (obj, keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') {
      return obj[key];
    }
  }
  return '';
};

const extractErrorMessage = (raw) => {
  if (!raw) return 'Request failed';
  if (typeof raw === 'string') return raw;
  if (raw.message && raw.detail) return `${raw.message} ${raw.detail}`;
  if (raw.detail) return raw.detail;
  if (raw.message) return raw.message;
  if (raw.title) return raw.title;
  if (raw.sqlState || raw.number) return `DB Error ${raw.sqlState || ''} (${raw.number || ''}): ${raw.message || raw.detail || 'SQL type conversion failed (nvarchar→int)'}`;
  if (Array.isArray(raw.errors)) return raw.errors.join(', ');
  if (raw.errors && typeof raw.errors === 'object') {
    const flat = Object.values(raw.errors).flat().filter(Boolean);
    if (flat.length) return flat.join(', ');
  }
  return 'Request failed (500 Internal Server Error - check backend logs)';
};

let authTokenCache = null;

export function getAuthToken() {
  if (authTokenCache) return authTokenCache;
  const storedToken = getStoredAuthToken();
  if (storedToken) {
    authTokenCache = storedToken;
    return storedToken;
  }
  if (typeof window === 'undefined') return null;
  authTokenCache = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  return authTokenCache;
}

export function setAuthToken(token, user = null) {
  authTokenCache = token || null;
  if (typeof window !== 'undefined') {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  const existing = getStoredAuth();
  if (token) {
    saveAuth({
      token,
      user: user || existing?.user || null,
    });
  } else {
    clearStoredAuth();
  }
}

export function clearAuthToken() {
  authTokenCache = null;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  clearStoredAuth();
}

const withAuthHeaders = (headers = {}) => {
  const token = getAuthToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};

async function fetchListWithFallback(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: withAuthHeaders({ Accept: 'application/json' }) });
      const rawData = await res.json().catch(() => []);
      if (!res.ok) continue;
      const list = parseListResponse(rawData);
      if (list.length || Array.isArray(rawData)) return list;
    } catch {
      // Try next candidate URL.
    }
  }
  return [];
}

async function requestJsonWithCandidates(candidates, payload, fallbackMessage) {
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        data = text ? { message: text } : {};
      }

      if (!res.ok) {
        throw new Error(extractErrorMessage(data) || `HTTP ${res.status}`);
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || fallbackMessage);
}

async function request(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: withAuthHeaders(options.headers || {}),
  });
}

async function requestAuthApi(path, options = {}) {
  ensureAuthBase();

  const res = await fetch(`${AUTH_BASE_FOR_CALLS}${path}`, {
    ...options,
    headers: withAuthHeaders(options.headers || {}),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Request failed with status ${res.status} for ${path}`;
    try {
      const payload = JSON.parse(errorText);
      message = extractErrorMessage(payload) || message;
    } catch {
      message = errorText || message;
    }

    const error = new Error(message);
    error.status = res.status;
    error.path = path;
    error.body = errorText;
    throw error;
  }

  return res;
}

const parseAdminListRows = (data) =>
  Array.isArray(data) ? data : data?.data || data?.users || data?.items || data?.result || data?.payload || [];

async function requestAdminListWithFallback(paths) {
  let lastError = null;

  for (const path of paths) {
    try {
      const res = await requestAuthApi(path);
      const data = await res.json();
      return {
        path,
        rows: parseAdminListRows(data),
      };
    } catch (error) {
      lastError = error;
      if (Number(error?.status) >= 500) {
        break;
      }
    }
  }

  throw lastError || new Error('Unable to load admin records.');
}

export const api = {
  async login(payload) {
    ensureAuthBase();
    const candidates = [`${AUTH_BASE_FOR_CALLS}/auth/login`, `${AUTH_BASE_FOR_CALLS}/admin/login`];
    return requestJsonWithCandidates(candidates, payload, 'Login failed');
  },

  async getUsers(level) {
    const res = await request(`/users?level=${encodeURIComponent(level)}`);
    return res.json();
  },

  async upsertUser(payload) {
    const method = payload.id ? 'PUT' : 'POST';
    const url = payload.id ? `/users/${payload.id}` : '/users';
    const res = await request(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async deleteUser(id, level) {
    await request(`/users/${id}?level=${encodeURIComponent(level)}`, { method: 'DELETE' });
  },

  async getReports() {
    const res = await request('/reports');
    const rows = await res.json();
    return rows.map((row) => ({ id: row.id, name: row.title, status: row.status }));
  },

  async signUp(payload) {
    ensureAuthBase();
    const candidates = [`${AUTH_BASE_FOR_CALLS}/auth/signup`, `${AUTH_BASE_FOR_CALLS}/admin/signup`];
    return requestJsonWithCandidates(candidates, payload, 'Signup failed');
  },

  async getPendingRegistrations() {
    const { path, rows } = await requestAdminListWithFallback(['/admin/pending', '/admin/all-users']);
    if (path === '/admin/pending') {
      return rows;
    }

    return rows.filter((row) => {
      const status = String(row?.status || row?.userStatus || row?.approvalStatus || 'Pending').trim().toLowerCase();
      return status === 'pending';
    });
  },

  async approveUser(userId) {
    const res = await requestAuthApi(`/admin/approve/${Number(userId)}`, {
      method: 'POST',
    });
    try {
      return await res.json();
    } catch {
      return null;
    }
  },

  async rejectUser(userId) {
    const res = await requestAuthApi(`/admin/reject/${Number(userId)}`, {
      method: 'POST',
    });
    try {
      return await res.json();
    } catch {
      return null;
    }
  },

  async getAllAdminUsers() {
    const { rows } = await requestAdminListWithFallback(['/admin/all-users', '/admin/pending']);
    return rows;
  },

  async updateAdminUser(payload) {
    const res = await requestAuthApi('/admin/update-user', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    try {
      return await res.json();
    } catch {
      return null;
    }
  },

  async signupAdminUser(payload) {
    const res = await requestAuthApi('/admin/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    try {
      return await res.json();
    } catch {
      return null;
    }
  },

  async getRoles() {
    ensureAuthBase();
    const fallbackCandidates = [`${AUTH_BASE_FOR_CALLS}/Role`, `${AUTH_BASE_FOR_CALLS}/role`];
    const fallbackData = await fetchListWithFallback(fallbackCandidates);

    if (fallbackData.length) {
      return fallbackData
        .map((role) => ({
          roleId: Number(pickFirst(role, ['roleId', 'RoleId', 'id', 'Id'])) || 0,
          roleName: String(pickFirst(role, ['roleName', 'RoleName', 'name', 'Name'])).trim(),
        }))
        .filter((role) => role.roleId > 0 && role.roleName);
    }

    const res = await requestAuthApi('/Role');
    const data = await res.json();
    const rows = Array.isArray(data) ? data : data?.data || data?.roles || [];
    return rows
      .map((role) => ({
        roleId: Number(pickFirst(role, ['roleId', 'RoleId', 'id', 'Id'])) || 0,
        roleName: String(pickFirst(role, ['roleName', 'RoleName', 'name', 'Name'])).trim(),
      }))
      .filter((role) => role.roleId > 0 && role.roleName);
  },

  async getDistricts() {
    ensureAuthBase();
    const fallbackCandidates = [
      `${AUTH_BASE_FOR_CALLS}/master/districts`,
      `${AUTH_BASE_FOR_CALLS}/master/district`,
    ];
    const fallbackData = await fetchListWithFallback(fallbackCandidates);

    if (fallbackData.length) {
      return fallbackData
        .map((district) => ({
          districtId: pickFirst(district, ['districtId', 'DistrictId', 'id', 'Id', 'district_id', 'DistrictID']),
          districtName: pickFirst(district, ['districtName', 'DistrictName', 'name', 'Name', 'district', 'District']),
        }))
        .filter((district) => district.districtId !== '' && district.districtName);
    }

    const res = await requestAuthApi('/master/districts');
    const data = await res.json();
    const rows = Array.isArray(data) ? data : data?.data || data?.districts || [];
    return rows
      .map((district) => ({
        districtId: pickFirst(district, ['districtId', 'DistrictId', 'id', 'Id', 'district_id', 'DistrictID']),
        districtName: pickFirst(district, ['districtName', 'DistrictName', 'name', 'Name', 'district', 'District']),
      }))
      .filter((district) => district.districtId !== '' && district.districtName);
  },

  async getBlocksByDistrict(districtId) {
    if (!districtId) return [];
    ensureAuthBase();

    const encodedDistrictId = encodeURIComponent(districtId);
    const fallbackCandidates = [
      `${AUTH_BASE_FOR_CALLS}/master/blocks/${encodedDistrictId}`,
      `${AUTH_BASE_FOR_CALLS}/master/block/${encodedDistrictId}`,
    ];
    const fallbackData = await fetchListWithFallback(fallbackCandidates);

    if (fallbackData.length) {
      return fallbackData
        .map((block) => ({
          blockId: pickFirst(block, ['blockId', 'BlockId', 'id', 'Id', 'block_id', 'BlockID']),
          blockName: pickFirst(block, ['blockName', 'BlockName', 'name', 'Name', 'block', 'Block']),
          districtId: pickFirst(block, ['districtId', 'DistrictId', 'district_id', 'DistrictID']) || districtId,
        }))
        .filter((block) => block.blockId !== '' && block.blockName);
    }

    const res = await requestAuthApi(`/master/block/${districtId}`);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : data?.data || data?.blocks || [];
    return rows
      .map((block) => ({
        blockId: pickFirst(block, ['blockId', 'BlockId', 'id', 'Id', 'block_id', 'BlockID']),
        blockName: pickFirst(block, ['blockName', 'BlockName', 'name', 'Name', 'block', 'Block']),
        districtId: pickFirst(block, ['districtId', 'DistrictId', 'district_id', 'DistrictID']) || districtId,
      }))
      .filter((block) => block.blockId !== '' && block.blockName);
  },

  async getVillagesByBlock(blockId) {
    if (!blockId) return [];
    ensureAuthBase();

    const encodedBlockId = encodeURIComponent(blockId);
    const fallbackCandidates = [
      `${AUTH_BASE_FOR_CALLS}/master/village/${encodedBlockId}`,
      `${AUTH_BASE_FOR_CALLS}/master/villages/${encodedBlockId}`,
    ];
    const fallbackData = await fetchListWithFallback(fallbackCandidates);

    if (fallbackData.length) {
      return fallbackData
        .map((village) => ({
          villageId: pickFirst(village, ['villageId', 'VillageId', 'id', 'Id', 'village_id', 'VillageID']),
          villageName: pickFirst(village, ['villageName', 'VillageName', 'name', 'Name', 'village', 'Village']),
          blockId: pickFirst(village, ['blockId', 'BlockId', 'block_id', 'BlockID']) || blockId,
        }))
        .filter((village) => village.villageName);
    }

    const res = await requestAuthApi(`/master/village/${blockId}`);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : data?.data || data?.villages || [];
    return rows
      .map((village) => ({
        villageId: pickFirst(village, ['villageId', 'VillageId', 'id', 'Id', 'village_id', 'VillageID']),
        villageName: pickFirst(village, ['villageName', 'VillageName', 'name', 'Name', 'village', 'Village']),
        blockId: pickFirst(village, ['blockId', 'BlockId', 'block_id', 'BlockID']) || blockId,
      }))
      .filter((village) => village.villageName);
  },

  async getShgMembers(pageNumber = 1, pageSize = 50) {
    const safePage = Number(pageNumber) || 1;
    const safeSize = Number(pageSize) || 50;
    const res = await requestAuthApi(`/SHGUpload/members?pageNumber=${safePage}&pageSize=${safeSize}`);

    const data = await res.json();
    const rows = Array.isArray(data) ? data : data?.items || data?.data || data?.members || data?.results || [];

    const totalCount = data?.totalCount || data?.count || data?.totalRecords || data?.total || rows.length;
    const currentPage = data?.pageNumber || data?.currentPage || pageNumber;
    const currentPageSize = data?.pageSize || data?.pageLimit || pageSize;
    const totalPages =
      data?.totalPages || (totalCount && currentPageSize ? Math.max(1, Math.ceil(totalCount / currentPageSize)) : 1);

    return {
      rows,
      totalCount,
      pageNumber: currentPage,
      pageSize: currentPageSize,
      totalPages,
    };
  },
};
