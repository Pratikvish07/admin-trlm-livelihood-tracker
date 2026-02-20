import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../services/api';

export default function UserManagementPage() {
  const role = useSelector((state) => state.auth.user?.role);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    name: '',
    shgCode: '',
    shgName: '',
    district: '',
    block: '',
    gpVc: '',
    village: '',
    totalMembers: '',
    activeMembers: '',
    assignedCrpId: '',
    assignedCrpName: '',
    activityType: '',
    lastVisitDate: '',
    visitsLast30Days: '',
    honorariumClaimed: '',
    honorariumReceived: '',
    loanOutstanding: '',
    trackingStatus: 'Pending',
  });
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');

  const managedLevel = useMemo(() => {
    if (role === 'BLOCK_ADMIN') return 'CRP';
    if (role === 'DISTRICT_ADMIN') return 'BLOCK_ADMIN';
    if (role === 'STATE_ADMIN' || role === 'HIGH_AUTHORITY') return 'DISTRICT_ADMIN';
    return null;
  }, [role]);

  const idPrefix = managedLevel === 'CRP' ? 'CRP' : managedLevel === 'BLOCK_ADMIN' ? 'BLK' : 'DIST';

  const load = async () => {
    if (!managedLevel) return;
    setBusy(true);
    const data = await api.getUsers(managedLevel);
    setRows(data.map((r) => ({ ...r, level: managedLevel })));
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, [managedLevel]);

  const submit = async () => {
    if (!form.name.trim() || !form.shgName.trim() || !form.block.trim()) return;
    setBusy(true);
    const payload = {
      id: editingId || `${idPrefix}-${Date.now().toString().slice(-4)}`,
      ...form,
      name: form.name.trim(),
      level: managedLevel,
    };
    await api.upsertUser(payload);
    setEditingId('');
    setForm({
      name: '',
      shgCode: '',
      shgName: '',
      district: '',
      block: '',
      gpVc: '',
      village: '',
      totalMembers: '',
      activeMembers: '',
      assignedCrpId: '',
      assignedCrpName: '',
      activityType: '',
      lastVisitDate: '',
      visitsLast30Days: '',
      honorariumClaimed: '',
      honorariumReceived: '',
      loanOutstanding: '',
      trackingStatus: 'Pending',
    });
    await load();
    setBusy(false);
  };

  const remove = async (id) => {
    setBusy(true);
    await api.deleteUser(id, managedLevel);
    await load();
    setBusy(false);
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || '',
      shgCode: row.shgCode || '',
      shgName: row.shgName || '',
      district: row.district || '',
      block: row.block || '',
      gpVc: row.gpVc || '',
      village: row.village || '',
      totalMembers: String(row.totalMembers || ''),
      activeMembers: String(row.activeMembers || ''),
      assignedCrpId: row.assignedCrpId || '',
      assignedCrpName: row.assignedCrpName || '',
      activityType: row.activityType || '',
      lastVisitDate: row.lastVisitDate || '',
      visitsLast30Days: String(row.visitsLast30Days || ''),
      honorariumClaimed: String(row.honorariumClaimed || ''),
      honorariumReceived: String(row.honorariumReceived || ''),
      loanOutstanding: String(row.loanOutstanding || ''),
      trackingStatus: row.trackingStatus || 'Pending',
    });
  };

  if (!managedLevel) return <p className="text-red-600">No access to user management</p>;

  const filteredRows = rows.filter((r) => {
    const text = `${r.id} ${r.name} ${r.shgCode || ''} ${r.shgName || ''} ${r.district || ''} ${r.block || ''} ${r.trackingStatus || ''}`.toLowerCase();
    return text.includes(query.toLowerCase().trim());
  });

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="portal-title">User & SHG Tracking</h2>
        <p className="portal-subtitle mt-1">Role-mapped CRUD with detailed SHG tracking fields for operational monitoring.</p>
      </div>

      <div className="portal-card p-4 md:p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3">SHG Tracking Form</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <input className="border rounded-xl p-2.5" placeholder="User Name*" value={form.name} onChange={(e) => setValue('name', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="SHG Code" value={form.shgCode} onChange={(e) => setValue('shgCode', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="SHG Name*" value={form.shgName} onChange={(e) => setValue('shgName', e.target.value)} />
          <input className="border rounded-xl p-2.5 bg-slate-100" value={managedLevel} disabled />

          <input className="border rounded-xl p-2.5" placeholder="District" value={form.district} onChange={(e) => setValue('district', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Block*" value={form.block} onChange={(e) => setValue('block', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="GP/VC" value={form.gpVc} onChange={(e) => setValue('gpVc', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Village" value={form.village} onChange={(e) => setValue('village', e.target.value)} />

          <input className="border rounded-xl p-2.5" placeholder="Total Members" type="number" value={form.totalMembers} onChange={(e) => setValue('totalMembers', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Active Members" type="number" value={form.activeMembers} onChange={(e) => setValue('activeMembers', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Assigned CRP ID" value={form.assignedCrpId} onChange={(e) => setValue('assignedCrpId', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Assigned CRP Name" value={form.assignedCrpName} onChange={(e) => setValue('assignedCrpName', e.target.value)} />

          <input className="border rounded-xl p-2.5" placeholder="Activity Type" value={form.activityType} onChange={(e) => setValue('activityType', e.target.value)} />
          <input className="border rounded-xl p-2.5" type="date" value={form.lastVisitDate} onChange={(e) => setValue('lastVisitDate', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Visits Last 30 Days" type="number" value={form.visitsLast30Days} onChange={(e) => setValue('visitsLast30Days', e.target.value)} />
          <select className="border rounded-xl p-2.5" value={form.trackingStatus} onChange={(e) => setValue('trackingStatus', e.target.value)}>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>

          <input className="border rounded-xl p-2.5" placeholder="Honorarium Claimed" type="number" value={form.honorariumClaimed} onChange={(e) => setValue('honorariumClaimed', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Honorarium Received" type="number" value={form.honorariumReceived} onChange={(e) => setValue('honorariumReceived', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Loan Outstanding" type="number" value={form.loanOutstanding} onChange={(e) => setValue('loanOutstanding', e.target.value)} />
          <button onClick={submit} disabled={busy} className="portal-btn-primary disabled:opacity-60">
            {editingId ? 'Update Record' : 'Create Record'}
          </button>
        </div>
      </div>

      <div className="portal-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-slate-800">SHG Tracking Records ({filteredRows.length})</p>
          <div className="flex gap-2">
            <input className="border rounded-xl p-2 text-sm" placeholder="Search SHG/CRP" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button onClick={load} className="portal-btn-outline">Refresh</button>
          </div>
        </div>

        <div className="space-y-2">
          {filteredRows.map((r) => (
            <div key={r.id} className="flex flex-wrap gap-2 items-center justify-between border border-slate-200 rounded-xl p-3">
              <div>
                <p className="font-medium text-slate-700">{r.id} | {r.name} | {r.level}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {r.shgCode || 'NA'} | {r.shgName || 'NA'} | {r.district || 'NA'} | {r.block || 'NA'} | {r.gpVc || 'NA'} | {r.village || 'NA'}
                </p>
                <p className="text-xs text-slate-500">
                  Members {r.activeMembers || 0}/{r.totalMembers || 0} | Visits {r.visitsLast30Days || 0} | Status {r.trackingStatus || 'Pending'}
                </p>
              </div>
              <div className="space-x-2">
                <button onClick={() => edit(r)} className="portal-btn-outline">Edit</button>
                <button onClick={() => remove(r.id)} className="portal-btn bg-rose-50 text-rose-700 border border-rose-200">Delete</button>
              </div>
            </div>
          ))}
          {filteredRows.length === 0 ? <p className="text-slate-500">No SHG tracking records for {managedLevel}</p> : null}
        </div>
      </div>
    </div>
  );
}
