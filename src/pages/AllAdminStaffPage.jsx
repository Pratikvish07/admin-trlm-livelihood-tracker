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

const pageSizeOptions = [10, 25, 50, 100];

const emptyForm = {
  id: 0,
  officialName: '',
  officialEmail: '',
  contactNumber: '',
  designation: '',
  districtId: '',
  blockId: '',
  roleId: '',
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
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const buildUpdateForm = (row, roles = [], districts = [], blocks = []) => ({
  id: Number(row.id ?? row.userId ?? 0) || 0,
  officialName: row.officialName || row.fullName || row.name || '',
  officialEmail: row.officialEmail || row.email || '',
  contactNumber: row.contactNumber || row.mobile || row.phoneNumber || '',
  designation: row.designation || '',
  districtId: findIdByName(row.districtName ?? row.district ?? '', districts) || '',
  blockId: findIdByName(row.blockName ?? row.block ?? '', blocks) || '',
  roleId: findIdByName(row.role ?? row.userRole ?? '', roles) || '',
});

export default function AllAdminStaffPage() {
  const [allRows, setAllRows] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [roles, setRoles] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [blocks, setBlocks] = useState([]); 

  const totalPages = Math.ceil(totalCount / pageSize);

  const rows = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, pageNumber, pageSize]);

  const loadMasterData = async () => {
    try {
      const [r, d] = await Promise.all([api.getRoles(), api.getDistricts()]);
      setRoles(r);
      setDistricts(d);
    } catch (err) {
      console.warn('Master data load failed:', err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.getAllAdminUsers();
      setAllRows(Array.isArray(data) ? data : []);
      setTotalCount(data.length || 0);
    } catch (err) {
      setError(`Server 500 on /admin/all-users - check console logs. ${err?.message || 'Unable to load users.'}`);
      setAllRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const load = async () => {
    await Promise.all([loadMasterData(), loadUsers()]);
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(() => {
    if (!rows.length) return preferredColumns.slice(0, 8);

    const keys = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row).filter((key) => typeof row[key] !== 'object' || row[key] === null)))
    );

    const ordered = [
      ...preferredColumns.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !preferredColumns.includes(key)),
    ];

    return ordered.slice(0, 8);
  }, [rows]);

  const stats = useMemo(() => {
    const roles = new Set(allRows.map(r => r.role || r.userRole).filter(Boolean));
    const districts = new Set(allRows.map(r => r.districtName ?? r.district).filter(Boolean));
    const blocks = new Set(allRows.map(r => r.blockName ?? r.block).filter(Boolean));

    return [
      { label: 'Total Users', value: allRows.length },
      { label: 'Active Roles', value: roles.size },
      { label: 'Districts', value: districts.size },
      { label: 'Blocks', value: blocks.size },
    ];
  }, [allRows]);

  const openEdit = (row) => {
    setEditingUser(row);
    setForm(buildUpdateForm(row, roles, districts, blocks));
    setSelectedDistrictId(form.districtId || '');
    setSaveMessage('');
    setError('');
  };

  const findIdByName = (name, list) => {
    if (!name) return '';
    const item = list.find(item => String(item.name || item.roleName || item.districtName || item.blockName).toLowerCase().includes(name.toLowerCase()) || String(item.id).includes(name));
    return item ? String(item.id || item.roleId || item.districtId || item.blockId) : '';
  };

  const handleDistrictChange = async (districtId) => {
    setSelectedDistrictId(districtId);
    setForm(prev => ({ ...prev, districtId, blockId: '' }));
    if (districtId) {
      const blks = await api.getBlocksByDistrict(districtId);
      setBlocks(blks);
    } else {
      setBlocks([]);
    }
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

    try {
      const payload = {
        id: Number(form.id) || 0,
        officialName: form.officialName.trim(),
        officialEmail: form.officialEmail.trim(),
        contactNumber: form.contactNumber.trim(),
        designation: form.designation.trim(),
        districtId: form.districtId === '' ? 0 : Number(form.districtId),
        blockId: form.blockId === '' ? 0 : Number(form.blockId),
        roleId: form.roleId === '' ? 0 : Number(form.roleId),
      };
      console.log('📤 Update payload:', payload);

      await api.updateAdminUser(payload);
      await load();
      closeEdit();
      setSaveMessage('User updated successfully.');
    } catch (err) {
      setSaveMessage(err?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const refreshData = () => {
    load();
  };

  const goToPage = (targetPage) => {
    if (targetPage >= 1 && targetPage <= totalPages) {
      setPageNumber(targetPage);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const range = [];

    for (let i = Math.max(2, pageNumber - delta); i <= Math.min(totalPages - 1, pageNumber + delta); i++) {
      range.push(i);
    }

    if (pageNumber - delta > 2) {
      pages.push(1, '...');
    } else {
      pages.push(1);
    }

    pages.push(...range);

    if (pageNumber + delta < totalPages - 1) {
      pages.push('...', totalPages);
    } else if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages.map((p, i) => (
      <button
        key={i}
        onClick={() => typeof p === 'number' && goToPage(p)}
        disabled={p === '...' || loading}
        className={`px-3 py-2.5 mx-0.5 text-sm font-medium rounded-xl transition-all duration-200 ${
          p === pageNumber
            ? 'bg-blue-600 text-white shadow-md scale-105'
            : p === '...'
            ? 'text-slate-400 cursor-default px-1'
            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:shadow-sm hover:scale-[1.02] active:scale-100'
        }`}
      >
        {p}
      </button>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Clean Hero */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="portal-title">Admin & Staff Directory</h2>
            <p className="portal-subtitle mt-1">Manage registered admin and staff users.</p>
          </div>
          <button onClick={refreshData} disabled={loading} className="portal-btn-primary px-6 py-2.5 whitespace-nowrap">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Pro Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, i) => (
          <div key={item.label} className="portal-card p-5 text-center">
            <p className="text-sm text-slate-600 font-medium">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-[var(--gov-blue)]">{item.value}</p>
          </div>
        ))}
      </div>

      {saveMessage ? (
        <div className={`portal-card p-4 text-sm rounded-2xl border-l-4 ${saveMessage.includes('successfully') ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-red-400 bg-red-50 text-red-800'}`}>
          {saveMessage}
        </div>
      ) : null}

      {error ? (
        <div className="portal-card p-4 text-sm text-red-600 rounded-2xl border border-red-100 bg-red-50">
          {error}
        </div>
      ) : null}

      {/* Clean Table */}
      <div className="portal-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <p className="text-lg font-semibold text-slate-900">
            User Records ({rows.length} of {allRows.length})
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Page {pageNumber} of {totalPages} | Size: {pageSize}
          </p>
        </div>

        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
            <select
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
              value={pageSize}
              onChange={(e) => {
                setPageNumber(1);
                setPageSize(Number(e.target.value));
              }}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>Show {size}</option>
              ))}
            </select>
            {totalPages > 1 && (
              <>
                <button
                  className="portal-btn-outline px-4 py-2 text-sm whitespace-nowrap min-w-[80px]"
                  onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                  disabled={pageNumber <= 1 || loading}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {renderPageNumbers()}
                </div>
                <button
                  className="portal-btn-primary px-4 py-2 text-sm whitespace-nowrap min-w-[64px]"
                  onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
                  disabled={pageNumber >= totalPages || loading}
                >
                  Next
                </button>
              </>
            )}
          </div>
        </div>

        {!rows.length && !loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-slate-100 p-4 flex items-center justify-center">
              👥
            </div>
            No users on this page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                      {humanize(column)}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  Array.from({ length: Math.min(5, pageSize) }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      {columns.map((c) => (
                        <td key={c} className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id || row.userId || row.livelihoodTrackerId || index} className="hover:bg-slate-50 transition-colors">
                      {columns.map((column) => (
                        <td key={column} className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                          {readValue(row, column)}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEdit(row)}
                          className="portal-btn-outline text-xs px-3 py-1.5 rounded-xl"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Pro Edit Modal */}
      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-slate-200 px-8 py-6 bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Edit User</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {editingUser.officialName || editingUser.name || 'User'} (ID: {editingUser.id || editingUser.userId})
                  </p>
                </div>
                <button onClick={closeEdit} className="portal-btn-outline px-4 py-2 text-sm" type="button">
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={submitUpdate} className="p-8 space-y-6">
              {saveMessage && !saveMessage.includes('successfully') ? (
                <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-sm text-red-800">
                  {saveMessage}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">User ID</label>
                  <input className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-sm" value={form.id} disabled />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={form.roleId} 
                    onChange={(e) => updateField('roleId', e.target.value)}
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.roleId} value={role.roleId}>{role.roleName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={form.officialName} onChange={(e) => updateField('officialName', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={form.officialEmail} onChange={(e) => updateField('officialEmail', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                  <input className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={form.contactNumber} onChange={(e) => updateField('contactNumber', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Designation</label>
                  <input className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={form.designation} onChange={(e) => updateField('designation', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">District</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={selectedDistrictId} 
                    onChange={(e) => handleDistrictChange(e.target.value)}
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district.districtId} value={district.districtId}>{district.districtName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Block</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={form.blockId} 
                    onChange={(e) => updateField('blockId', e.target.value)}
                  >
                    <option value="">Select Block</option>
                    {blocks.map(block => (
                      <option key={block.blockId} value={block.blockId}>{block.blockName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 justify-end">
                <button type="button" onClick={closeEdit} className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="portal-btn-primary px-6 py-3 text-sm font-semibold">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
