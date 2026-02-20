import { useMemo, useState } from 'react';

export default function GeographyMasterPage() {
  const [rows, setRows] = useState([
    {
      id: 'TRK-1001',
      shgMemberName: 'Mina Debbarma',
      shgName: 'Shakti SHG',
      district: 'West Tripura',
      block: 'Mohanpur',
      gp: 'GP-01',
      village: 'Village A',
      latitude: '23.8315',
      longitude: '91.2868',
      markStatus: 'Marked',
      tracingStatus: 'In Range',
      lastTrackedAt: '2026-02-17 11:40',
      source: 'Mobile App',
    },
    {
      id: 'TRK-1002',
      shgMemberName: 'Purnima Das',
      shgName: 'Jagruti SHG',
      district: 'Sepahijala',
      block: 'Bishalgarh',
      gp: 'GP-02',
      village: 'Village B',
      latitude: '23.9170',
      longitude: '91.3851',
      markStatus: 'Pending',
      tracingStatus: 'Out of Range',
      lastTrackedAt: '2026-02-17 10:15',
      source: 'Mobile App',
    },
  ]);
  const [form, setForm] = useState({
    shgMemberName: '',
    shgName: '',
    district: '',
    block: '',
    gp: '',
    village: '',
    latitude: '',
    longitude: '',
    markStatus: 'Marked',
    tracingStatus: 'In Range',
    lastTrackedAt: '',
    source: 'Mobile App',
  });
  const [editingId, setEditingId] = useState('');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.shgMemberName} ${r.shgName} ${r.district} ${r.block} ${r.gp} ${r.village} ${r.latitude} ${r.longitude} ${r.markStatus} ${r.tracingStatus}`
        .toLowerCase()
        .includes(q)
    );
  }, [query, rows]);

  const setValue = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const onSubmit = () => {
    if (!form.shgMemberName || !form.shgName || !form.block || !form.latitude || !form.longitude) return;
    const payload = { id: editingId || `TRK-${Date.now().toString().slice(-4)}`, ...form };
    setRows((prev) => {
      const idx = prev.findIndex((x) => x.id === payload.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = payload;
        return next;
      }
      return [payload, ...prev];
    });
    setEditingId('');
    setForm({
      shgMemberName: '',
      shgName: '',
      district: '',
      block: '',
      gp: '',
      village: '',
      latitude: '',
      longitude: '',
      markStatus: 'Marked',
      tracingStatus: 'In Range',
      lastTrackedAt: '',
      source: 'Mobile App',
    });
  };

  const onEdit = (row) => {
    setEditingId(row.id);
    setForm({
      shgMemberName: row.shgMemberName,
      shgName: row.shgName,
      district: row.district,
      block: row.block,
      gp: row.gp,
      village: row.village,
      latitude: row.latitude,
      longitude: row.longitude,
      markStatus: row.markStatus,
      tracingStatus: row.tracingStatus,
      lastTrackedAt: row.lastTrackedAt,
      source: row.source || 'Mobile App',
    });
  };

  const onDelete = (id) => setRows((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="portal-title">Geography & SHG Member Tracking</h2>
        <p className="portal-subtitle mt-1">
          Frontend tracking register for SHG member mark and tracing with latitude/longitude.
        </p>
      </div>

      <div className="portal-card p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-3">SHG Member Location Record</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <input className="border rounded-xl p-2.5" placeholder="SHG Member Name*" value={form.shgMemberName} onChange={(e) => setValue('shgMemberName', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="SHG Name*" value={form.shgName} onChange={(e) => setValue('shgName', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="District" value={form.district} onChange={(e) => setValue('district', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Block*" value={form.block} onChange={(e) => setValue('block', e.target.value)} />

          <input className="border rounded-xl p-2.5" placeholder="GP/VC" value={form.gp} onChange={(e) => setValue('gp', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Village" value={form.village} onChange={(e) => setValue('village', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Latitude*" value={form.latitude} onChange={(e) => setValue('latitude', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Longitude*" value={form.longitude} onChange={(e) => setValue('longitude', e.target.value)} />

          <select className="border rounded-xl p-2.5" value={form.markStatus} onChange={(e) => setValue('markStatus', e.target.value)}>
            <option>Marked</option>
            <option>Pending</option>
            <option>Rejected</option>
          </select>
          <select className="border rounded-xl p-2.5" value={form.tracingStatus} onChange={(e) => setValue('tracingStatus', e.target.value)}>
            <option>In Range</option>
            <option>Out of Range</option>
            <option>Need Revisit</option>
          </select>
          <input className="border rounded-xl p-2.5" placeholder="Last Tracked At (YYYY-MM-DD HH:mm)" value={form.lastTrackedAt} onChange={(e) => setValue('lastTrackedAt', e.target.value)} />
          <input className="border rounded-xl p-2.5 bg-slate-100" placeholder="Source" value={form.source} disabled />
          <button onClick={onSubmit} className="portal-btn-primary">{editingId ? 'Update Record' : 'Create Record'}</button>
        </div>
      </div>

      <div className="portal-card p-4">
        <div className="flex justify-between gap-3 mb-3">
          <input className="border rounded-xl p-2.5 w-full max-w-sm" placeholder="Search SHG member / location / status" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="portal-btn-outline">Export Excel</button>
        </div>

        <div className="space-y-2">
          {visible.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between border border-slate-200 rounded-xl p-3">
              <div>
                <p className="text-sm text-slate-700">{r.id} | {r.shgMemberName} | {r.shgName}</p>
                <p className="text-xs text-slate-500 mt-1">{r.district} | {r.block} | {r.gp} | {r.village}</p>
                <p className="text-xs text-slate-500">Lat: {r.latitude}, Lng: {r.longitude} | Mark: {r.markStatus} | Trace: {r.tracingStatus}</p>
                <a
                  className="text-xs text-blue-700 underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}>
                  Open on Map
                </a>
              </div>
              <div className="space-x-2">
                <button className="portal-btn-outline" onClick={() => onEdit(r)}>Edit</button>
                <button className="portal-btn bg-rose-50 border border-rose-200 text-rose-700" onClick={() => onDelete(r.id)}>Delete</button>
              </div>
            </div>
          ))}
          {visible.length === 0 ? <p className="text-slate-500">No SHG member tracking records found.</p> : null}
        </div>
      </div>
    </div>
  );
}
