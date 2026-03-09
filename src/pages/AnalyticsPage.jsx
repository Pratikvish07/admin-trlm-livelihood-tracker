import { useState } from 'react';

export default function AnalyticsPage() {
  const [scope, setScope] = useState('State');
  const [month, setMonth] = useState('February');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="portal-title">Dashboard Analytics</h2>
        <p className="portal-subtitle mt-1">Live operational trend analysis for governance decisions.</p>
      </div>

      <div className="portal-card p-4 flex flex-wrap gap-3">
        <select className="border rounded-xl p-2.5" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option>State</option>
          <option>District</option>
          <option>Block</option>
        </select>
        <select className="border rounded-xl p-2.5" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option>January</option>
          <option>February</option>
          <option>March</option>
        </select>
        <button className="portal-btn-primary">Apply Filter</button>
      </div>

      <div className="portal-card p-4">
        <h3 className="font-bold mb-2">Analytics Dataset</h3>
        <p className="text-sm text-slate-600">
          No hardcoded analytics values are used. Connect analytics APIs to render live trends for {scope} / {month}.
        </p>
      </div>
    </div>
  );
}
