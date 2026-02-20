import { useMemo, useState } from 'react';

const monthlyVisit = [68, 72, 75, 71, 82, 88];
const monthlyIncome = [2.8, 3.1, 3.0, 3.4, 3.8, 4.2];

function Bar({ value, max, label, color = 'bg-blue-500' }) {
  return (
    <div className="flex-1">
      <div className="h-24 bg-slate-100 rounded-lg flex items-end overflow-hidden">
        <div className={`${color} w-full`} style={{ height: `${(value / max) * 100}%` }} />
      </div>
      <p className="text-xs text-center text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [scope, setScope] = useState('State');
  const [month, setMonth] = useState('February');

  const maxVisit = useMemo(() => Math.max(...monthlyVisit), []);
  const maxIncome = useMemo(() => Math.max(...monthlyIncome), []);

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

      <div className="grid xl:grid-cols-2 gap-4">
        <div className="portal-card p-4">
          <h3 className="font-bold mb-3">Monthly Visit Trend ({scope})</h3>
          <div className="flex gap-2">
            {monthlyVisit.map((v, i) => <Bar key={i} value={v} max={maxVisit} label={`M${i + 1}`} />)}
          </div>
        </div>

        <div className="portal-card p-4">
          <h3 className="font-bold mb-3">Income Trend in Lakhs ({month})</h3>
          <div className="flex gap-2">
            {monthlyIncome.map((v, i) => <Bar key={i} value={v} max={maxIncome} label={`M${i + 1}`} color="bg-cyan-500" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
