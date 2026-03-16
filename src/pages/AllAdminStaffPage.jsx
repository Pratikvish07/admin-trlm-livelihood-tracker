import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const preferredColumns = [
  'livelihoodTrackerId',
  'userId',
  'id',
  'officialName',
  'name',
  'fullName',
  'role',
  'districtName',
  'district',
  'blockName',
  'block',
  'designation',
  'officialEmail',
  'email',
  'contactNumber',
  'mobile',
  'status',
];

const emptyForm = {
  id: 0,
  officialName: '',
  officialEmail: '',
  contactNumber: '',
  designation: '',
  districtName: '',
  blockName: '',
  role: '',
};

const humanize = (value) =>
  String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const readValue = (row, key) => {
  const value = row?.[key];
  if (value === null || value === undefined || value === '') return 'NA';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const buildUpdateForm = (row) => ({
  id: Number(row.id ?? row.userId ?? 0) || 0,
  officialName: row.officialName || row.fullName || row.name || '',
  officialEmail: row.officialEmail || row.email || '',
  contactNumber: row.contactNumber || row.mobile || row.phoneNumber || '',
  designation: row.designation || '',
  districtName: row.districtName ?? row.district ?? '',
  blockName: row.blockName ?? row.block ?? '',
  role: row.role ?? row.userRole ?? '',
});

export default function AllAdminStaffPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.getAllAdminUsers();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Unable to load admin and staff users.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [rows, query]);

  const columns = useMemo(() => {
    if (!filteredRows.length) return preferredColumns.slice(0, 8);

    const keys = Array.from(
      new Set(
        filteredRows.flatMap((row) =>
          Object.keys(row).filter((key) => typeof row[key] !== 'object' || row[key] === null)
        )
      )
    );

    const ordered = [
      ...preferredColumns.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !preferredColumns.includes(key)),
    ];

    return ordered.slice(0, 8);
  }, [filteredRows]);

  const stats = useMemo(() => {
    const roles = new Set();
    const districts = new Set();
    const blocks = new Set();

    rows.forEach((row) => {
      const role = row.role || row.userRole;
      const district = row.districtName ?? row.district;
      const block = row.blockName ?? row.block;

      if (role) roles.add(role);
      if (district) districts.add(district);
      if (block) blocks.add(block);
    });

    return [
      { label: 'Total Users', value: rows.length },
      { label: 'Roles Found', value: roles.size },
      { label: 'District Coverage', value: districts.size },
      { label: 'Block Coverage', value: blocks.size },
    ];
  }, [rows]);

  const openEdit = (row) => {
    setEditingUser(row);
    setForm(buildUpdateForm(row));
    setSaveMessage('');
    setError('');
  };

  const closeEdit = () => {
    setEditingUser(null);
    setForm(emptyForm);
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    setError('');

    try {
      const payload = {
        id: Number(form.id) || 0,
        officialName: form.officialName.trim(),
        officialEmail: form.officialEmail.trim(),
        contactNumber: form.contactNumber.trim(),
        designation: form.designation.trim(),
        districtName: form.districtName === '' ? 0 : Number(form.districtName),
        blockName: form.blockName === '' ? 0 : Number(form.blockName),
        role: form.role === '' ? 0 : Number(form.role),
      };

      await api.updateAdminUser(payload);
      await load();
      closeEdit();
      setSaveMessage('User updated successfully.');
    } catch (err) {
      setSaveMessage(err?.message || 'Unable to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="portal-title">All Admin & Staff Users</h2>
          <p className="portal-subtitle mt-1">Review staff signups, inspect user details, and manage post-registration records.</p>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          New District and Block Staff must register from the public Sign Up tab.
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="portal-card p-4">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-[var(--gov-blue)]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="portal-card flex flex-wrap items-center justify-between gap-3 p-4">
          <input
            className="w-full max-w-md rounded-xl border border-slate-300 p-2.5"
            placeholder="Search by ID, name, role, district, block"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="portal-btn-primary" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_50%,#eff6ff_100%)] p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Approval Workflow</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">Admin Review Queue</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Staff now fill their own district and block details from the signup tab. Admin reviews the resulting entries here and updates records after verification.
          </p>
          <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-slate-600">
            Approval action API is not available in this project yet, so this screen currently supports review and update workflow only.
          </div>
        </div>
      </div>

      {saveMessage ? (
        <div className={`portal-card p-4 text-sm ${saveMessage.includes('successfully') ? 'text-emerald-700' : 'text-red-600'}`}>
          {saveMessage}
        </div>
      ) : null}

      <div className="portal-card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="font-semibold text-slate-800">User Records ({filteredRows.length})</p>
        </div>

        {error ? <p className="px-4 py-4 text-sm text-red-600">{error}</p> : null}
        {!error && !filteredRows.length && !loading ? <p className="px-4 py-4 text-slate-500">No admin or staff users found.</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                {columns.map((column) => (
                  <th key={column} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-bold text-slate-700">
                    {humanize(column)}
                  </th>
                ))}
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-bold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id || row.userId || row.livelihoodTrackerId || index} className="border-b border-slate-100 last:border-b-0">
                  {columns.map((column) => (
                    <td key={column} className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {readValue(row, column)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button className="portal-btn-outline" onClick={() => openEdit(row)}>
                      Review / Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Review Admin / Staff User</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Editing {editingUser.officialName || editingUser.fullName || editingUser.name || editingUser.livelihoodTrackerId || editingUser.id}
                </p>
              </div>
              <button className="portal-btn-outline" onClick={closeEdit} type="button">
                Close
              </button>
            </div>

            <form className="space-y-5 px-6 py-5" onSubmit={submitUpdate}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">ID</label>
                  <input className="w-full rounded-xl border border-slate-300 bg-slate-100 p-2.5" value={form.id} disabled />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
                  <input className="w-full rounded-xl border border-slate-300 p-2.5" value={form.role} onChange={(e) => updateField('role', e.target.value)} placeholder="Enter role ID" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Official Name</label>
                  <input className="w-full rounded-xl border border-slate-300 p-2.5" value={form.officialName} onChange={(e) => updateField('officialName', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Official Email</label>
                  <input className="w-full rounded-xl border border-slate-300 p-2.5" value={form.officialEmail} onChange={(e) => updateField('officialEmail', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Contact Number</label>
                  <input className="w-full rounded-xl border border-slate-300 p-2.5" value={form.contactNumber} onChange={(e) => updateField('contactNumber', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Designation</label>
                  <input className="w-full rounded-xl border border-slate-300 p-2.5" value={form.designation} onChange={(e) => updateField('designation', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">District Name</label>
                  <input className="w-full rounded-xl border border-slate-300 p-2.5" value={form.districtName} onChange={(e) => updateField('districtName', e.target.value)} placeholder="Enter district ID" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Block Name</label>
                  <input className="w-full rounded-xl border border-slate-300 p-2.5" value={form.blockName} onChange={(e) => updateField('blockName', e.target.value)} placeholder="Enter block ID" />
                </div>
              </div>

              {saveMessage && !saveMessage.includes('successfully') ? <p className="text-sm text-red-600">{saveMessage}</p> : null}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button className="portal-btn-outline" onClick={closeEdit} type="button">
                  Cancel
                </button>
                <button className="portal-btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Updating...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
