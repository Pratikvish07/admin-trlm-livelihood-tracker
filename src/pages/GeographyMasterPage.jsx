import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

export default function GeographyMasterPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    shgMemberName: '',
    shgName: '',
    districtId: '',
    district: '',
    blockId: '',
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
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

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

  useEffect(() => {
    let active = true;
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      const data = await api.getDistricts();
      if (active) setDistricts(data);
      setLoadingDistricts(false);
    };
    loadDistricts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadBlocks = async () => {
      if (!form.districtId) {
        setBlocks([]);
        return;
      }
      setLoadingBlocks(true);
      const data = await api.getBlocksByDistrict(form.districtId);
      if (active) setBlocks(data);
      setLoadingBlocks(false);
    };
    loadBlocks();
    return () => {
      active = false;
    };
  }, [form.districtId]);

  useEffect(() => {
    if (!blocks.length || !form.block) return;
    const matchedBlock = blocks.find(
      (b) => String(b.blockName || '').toLowerCase() === String(form.block || '').toLowerCase(),
    );
    if (matchedBlock && String(form.blockId) !== String(matchedBlock.blockId)) {
      setForm((prev) => ({ ...prev, blockId: String(matchedBlock.blockId) }));
    }
  }, [blocks, form.block, form.blockId]);

  const onDistrictChange = (districtId) => {
    const selectedDistrict = districts.find((d) => String(d.districtId) === String(districtId));
    setForm((p) => ({
      ...p,
      districtId,
      district: selectedDistrict?.districtName || '',
      blockId: '',
      block: '',
    }));
  };

  const onBlockChange = (blockId) => {
    const selectedBlock = blocks.find((b) => String(b.blockId) === String(blockId));
    setForm((p) => ({
      ...p,
      blockId,
      block: selectedBlock?.blockName || '',
    }));
  };

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
      districtId: '',
      district: '',
      blockId: '',
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
    const districtMatch = districts.find(
      (d) => String(d.districtName || '').toLowerCase() === String(row.district || '').toLowerCase(),
    );
    setForm({
      shgMemberName: row.shgMemberName,
      shgName: row.shgName,
      districtId: districtMatch ? String(districtMatch.districtId) : '',
      district: row.district,
      blockId: '',
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
          <select
            className="border rounded-xl p-2.5"
            value={form.districtId}
            onChange={(e) => onDistrictChange(e.target.value)}>
            <option value="">{loadingDistricts ? 'Loading districts...' : 'Select District'}</option>
            {districts.map((d) => (
              <option key={d.districtId} value={d.districtId}>{d.districtName}</option>
            ))}
          </select>
          <select
            className="border rounded-xl p-2.5"
            value={form.blockId}
            onChange={(e) => onBlockChange(e.target.value)}
            disabled={!form.districtId || loadingBlocks}>
            <option value="">
              {!form.districtId ? 'Select district first' : loadingBlocks ? 'Loading blocks...' : 'Select Block*'}
            </option>
            {blocks.map((b) => (
              <option key={b.blockId} value={b.blockId}>{b.blockName}</option>
            ))}
          </select>

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
