import { useMemo, useState } from 'react';

export default function LoanMasterPage() {
  const [rows, setRows] = useState([
    { id: 'LOAN-1', product: 'SHG Livelihood Loan', rate: 12, grace: 2, tenure: 12 },
    { id: 'LOAN-2', product: 'Enterprise Loan', rate: 10, grace: 1, tenure: 24 },
  ]);
  const [form, setForm] = useState({ product: '', rate: '', grace: '', tenure: '' });
  const [editingId, setEditingId] = useState('');

  const estimate = useMemo(() => {
    const p = 100000;
    const months = Number(form.tenure || 12);
    const annualRate = Number(form.rate || 0);
    const r = annualRate / 12 / 100;
    if (!months) return 0;
    if (!r) return Math.round(p / months);
    return Math.round((p * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
  }, [form.rate, form.tenure]);

  const setValue = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const onSubmit = () => {
    if (!form.product || !form.rate || !form.grace || !form.tenure) return;
    const payload = {
      id: editingId || `LOAN-${Date.now().toString().slice(-4)}`,
      product: form.product,
      rate: Number(form.rate),
      grace: Number(form.grace),
      tenure: Number(form.tenure),
    };

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
    setForm({ product: '', rate: '', grace: '', tenure: '' });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="portal-title">Loan Master</h2>
        <p className="portal-subtitle mt-1">Manage loan products, rates, grace period and tenure.</p>
      </div>

      <div className="portal-card p-4">
        <div className="grid md:grid-cols-5 gap-3">
          <input className="border rounded-xl p-2.5" placeholder="Product" value={form.product} onChange={(e) => setValue('product', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Rate %" type="number" value={form.rate} onChange={(e) => setValue('rate', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Grace (months)" type="number" value={form.grace} onChange={(e) => setValue('grace', e.target.value)} />
          <input className="border rounded-xl p-2.5" placeholder="Tenure (months)" type="number" value={form.tenure} onChange={(e) => setValue('tenure', e.target.value)} />
          <button className="portal-btn-primary" onClick={onSubmit}>{editingId ? 'Update' : 'Create'}</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="portal-card p-4">
          <p className="text-sm text-slate-500">EMI Preview (Rs 1,00,000)</p>
          <p className="text-3xl font-black text-brand mt-1">Rs {estimate}</p>
        </div>
        <div className="portal-card p-4">
          <p className="text-sm text-slate-500">Product Count</p>
          <p className="text-3xl font-black text-brand mt-1">{rows.length}</p>
        </div>
        <div className="portal-card p-4">
          <p className="text-sm text-slate-500">Avg Interest</p>
          <p className="text-3xl font-black text-brand mt-1">{rows.length ? (rows.reduce((a, c) => a + c.rate, 0) / rows.length).toFixed(1) : 0}%</p>
        </div>
      </div>

      <div className="portal-card p-4 space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between border border-slate-200 rounded-xl p-3">
            <p>{r.id} | {r.product} | {r.rate}% | Grace {r.grace}m | Tenure {r.tenure}m</p>
            <div className="space-x-2">
              <button className="portal-btn-outline" onClick={() => {
                setEditingId(r.id);
                setForm({ product: r.product, rate: String(r.rate), grace: String(r.grace), tenure: String(r.tenure) });
              }}>Edit</button>
              <button className="portal-btn bg-rose-50 border border-rose-200 text-rose-700" onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
