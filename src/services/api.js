import { AUTH_API_BASE, getAuthToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}

async function requestAuthApi(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${AUTH_API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;

    try {
      const payload = await res.json();
      message = payload?.message || payload?.title || message;
    } catch {
      // Ignore parse errors and use default message.
    }

    throw new Error(message);
  }

  return res;
}

export const api = {
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
    return rows.map((r) => ({ id: r.id, name: r.title, status: r.status }));
  },
  async getAllAdminUsers() {
    const res = await requestAuthApi('/admin/all-users');
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || data?.users || [];
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
  async getDistricts() {
    const res = await requestAuthApi('/master/districts');
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || data?.districts || [];
  },
  async getBlocksByDistrict(districtId) {
    const res = await requestAuthApi(`/master/block/${districtId}`);
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || data?.blocks || [];
  },
  async getShgMembers(pageNumber = 1, pageSize = 50) {
    const res = await requestAuthApi(`/SHGUpload/members?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    const data = await res.json();
    const rows = Array.isArray(data)
      ? data
      : data?.items || data?.data || data?.members || data?.results || [];

    const totalCount =
      data?.totalCount ||
      data?.count ||
      data?.totalRecords ||
      data?.total ||
      rows.length;

    const currentPage = data?.pageNumber || data?.currentPage || pageNumber;
    const currentPageSize = data?.pageSize || data?.pageLimit || pageSize;
    const totalPages =
      data?.totalPages ||
      (totalCount && currentPageSize ? Math.max(1, Math.ceil(totalCount / currentPageSize)) : 1);

    return {
      rows,
      totalCount,
      pageNumber: currentPage,
      pageSize: currentPageSize,
      totalPages,
    };
  },
};
