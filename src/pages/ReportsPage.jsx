import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

export default function ReportsPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      console.log('🔍 Loading reports from http://localhost:4000/reports');
      const data = await api.getReports();
      console.log('✅ Reports loaded:', data?.length || 0);
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Reports fallback to static data:', error);
      setRows([
        { id: 1, name: 'District Summary Report', status: 'Ready' },
        { id: 2, name: 'SHG Member Ledger', status: 'Ready' },
        { id: 3, name: 'DBT Transfer Status', status: 'Draft' },
        { id: 4, name: 'Block-wise Analytics', status: 'Ready' },
        { id: 5, name: 'Monthly Progress MIS', status: 'Ready' },
      ]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => `${r.id} ${r.name} ${r.status}`.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="portal-title">Reports</h2>
        <p className="portal-subtitle mt-1">MIS, PDF and Excel-ready report records.</p>
      </div>

      <div className="portal-card p-4 flex flex-wrap gap-3 justify-between">
        <input className="border rounded-xl p-2.5 w-full max-w-md" placeholder="Search reports" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex gap-2">
          <button className="portal-btn-outline">Export Excel</button>
          <button className="portal-btn-outline">Export PDF</button>
          <button className="portal-btn-primary" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="portal-card p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">ID</th>
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="py-2">{r.id}</td>
                <td className="py-2">{r.name}</td>
                <td className="py-2">{r.status}</td>
                <td className="py-2">
                  <button className="portal-btn-outline">Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="text-slate-500 mt-3">No reports found.</p> : null}
      </div>
    </div>
  );
}
