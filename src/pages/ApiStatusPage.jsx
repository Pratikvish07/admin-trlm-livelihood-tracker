import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

const ApiStatusPage = () => {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testApis = async () => {
    setLoading(true);
    setError('');
    const results = {};

    const tests = [
      { name: 'getAllAdminUsers', fn: () => api.getAllAdminUsers(), expect: 'array' },
      { name: 'getPendingRegistrations', fn: () => api.getPendingRegistrations(), expect: 'array' },
      { name: 'getRoles', fn: () => api.getRoles(), expect: 'array' },
      { name: 'getDistricts', fn: () => api.getDistricts(), expect: 'array' },
      { name: 'getShgMembers(1,10)', fn: () => api.getShgMembers(1,10), expect: 'object with rows' },
      { name: 'getShgMembers(4,10)', fn: () => api.getShgMembers(4,10), expect: 'object with rows' },
      { name: 'getReports', fn: () => api.getReports(), expect: 'array' },
    ];

    for (const test of tests) {
      try {
        const data = await test.fn();
        const success = Array.isArray(data) || (data && data.rows !== undefined);
        results[test.name] = { success, data: Array.isArray(data) ? data.length : data?.rows?.length || data?.totalCount || 0, error: null };
      } catch (e) {
        results[test.name] = { success: false, data: 0, error: e.message };
      }
    }

    setStatus(results);
    setLoading(false);
  };

  useEffect(() => {
    testApis();
  }, []);

  return (
    <div className="space-y-6 p-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          API Status Dashboard
        </h1>
        <p className="text-xl text-slate-600">Real-time test of all endpoints. Green = working, Red = broken.</p>
        <button 
          onClick={testApis} 
          disabled={loading}
          className="mt-6 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
        >
          🔄 Test All APIs {loading && '...'}
        </button>
      </div>

      {error && <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-800">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(status).map(([name, res]) => (
          <div key={name} className={`p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            res.success 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-200' 
              : 'bg-gradient-to-br from-red-50 to-rose-50 border-4 border-red-200'
          }`}>
            <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${
              res.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {res.success ? '✅' : '❌'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">{name}</h3>
            <p className="text-2xl font-black text-center mb-2">{res.data || 0}</p>
            <p className="text-sm text-slate-600 text-center mb-4">{res.success ? 'Records' : 'Failed'}</p>
{res.error && (
  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 text-sm font-mono">
    {res.error}
    <br />
    <small>💡 Backend /admin/pending SQL fix needed (nvarchar→int)</small>
  </div>
)}
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-slate-600 mb-4">💡 Green APIs ready | Red need backend fix</p>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(status, null, 2))} className="portal-btn-primary px-6 py-2 rounded-xl">
          Copy Status JSON
        </button>
      </div>
    </div>
  );
};

export default ApiStatusPage;
