const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = {
  async getUsers(level) {
    const res = await fetch(`${API_BASE}/users?level=${encodeURIComponent(level)}`);
    return res.json();
  },
  async upsertUser(payload) {
    const method = payload.id ? 'PUT' : 'POST';
    const url = payload.id ? `${API_BASE}/users/${payload.id}` : `${API_BASE}/users`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async deleteUser(id, level) {
    await fetch(`${API_BASE}/users/${id}?level=${encodeURIComponent(level)}`, { method: 'DELETE' });
  },
  async getReports() {
    const res = await fetch(`${API_BASE}/reports`);
    const rows = await res.json();
    return rows.map((r) => ({ id: r.id, name: r.title, status: r.status }));
  },
};
