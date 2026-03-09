import { useMemo, useState } from 'react';

export default function DBTTrackingPage() {
  const [rows, setRows] = useState([]);

  const grouped = useMemo(() => ({
    Pending: rows.filter((r) => r.status === 'Pending'),
    Approved: rows.filter((r) => r.status === 'Approved'),
    Rejected: rows.filter((r) => r.status === 'Rejected'),
  }), [rows]);

  const updateStatus = (id, status) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="portal-title">DBT Tracking</h2>
        <p className="portal-subtitle mt-1">Track beneficiary approval and disbursement workflow.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {Object.entries(grouped).map(([title, list]) => (
          <div key={title} className="portal-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800">{title}</h3>
              <span className="text-sm text-slate-500">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((row) => (
                <div key={row.id} className="border border-slate-200 rounded-xl p-3">
                  <p className="font-medium">{row.beneficiary}</p>
                  <p className="text-xs text-slate-500">{row.scheme} | Rs {row.amount}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="portal-btn-outline" onClick={() => updateStatus(row.id, 'Pending')}>Pending</button>
                    <button className="portal-btn bg-emerald-50 border border-emerald-200 text-emerald-700" onClick={() => updateStatus(row.id, 'Approved')}>Approve</button>
                    <button className="portal-btn bg-rose-50 border border-rose-200 text-rose-700" onClick={() => updateStatus(row.id, 'Rejected')}>Reject</button>
                  </div>
                </div>
              ))}
              {list.length === 0 ? <p className="text-sm text-slate-500">No records</p> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
