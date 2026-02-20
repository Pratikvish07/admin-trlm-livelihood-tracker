import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearAuthError, loginWithCredentials } from '../store/slices/authSlice';

const roleOptions = [
  { label: 'State Superior', value: 'STATE_ADMIN' },
  { label: 'District Admin', value: 'DISTRICT_ADMIN' },
  { label: 'Block Admin', value: 'BLOCK_ADMIN' },
  { label: 'High Authority', value: 'HIGH_AUTHORITY' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error } = useSelector((state) => state.auth);

  const [role, setRole] = useState('STATE_ADMIN');
  const [userId, setUserId] = useState('MASTER001');
  const [password, setPassword] = useState('Admin@123');
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/admin/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const onRoleChange = (value) => {
    setRole(value);
    if (value === 'STATE_ADMIN') {
      setUserId('MASTER001');
      setPassword('Admin@123');
    } else if (value === 'DISTRICT_ADMIN') {
      setUserId('DIST001');
      setPassword('Dist@123');
    } else if (value === 'BLOCK_ADMIN') {
      setUserId('BLOCK001');
      setPassword('Block@123');
    } else {
      setUserId('HA001');
      setPassword('High@123');
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(loginWithCredentials({ role, userId, password }));
  };

  return (
    <div className="h-screen overflow-hidden p-3 md:p-5 bg-[radial-gradient(circle_at_12%_8%,#2563eb_0,transparent_32%),radial-gradient(circle_at_92%_18%,#0891b2_0,transparent_34%),linear-gradient(165deg,#08142f,#0d1b3f)]">
      <div className="mx-auto max-w-6xl h-full rounded-[30px] border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_28px_70px_rgba(4,20,55,0.65)] overflow-hidden flex flex-col">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#ff9933_0%,#ffffff_45%,#ffffff_55%,#138808_100%)]" />
        <div className="flex items-center justify-between px-5 py-2 text-[11px] text-slate-200 bg-[#082149]/80 border-b border-white/10">
          <p className="uppercase tracking-[0.18em]">Tripura Rural Livelihood Mission | Official Administrative Portal</p>
          <p className="font-semibold">Date: {today}</p>
        </div>

        <div className="grid flex-1 min-h-0 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="relative p-6 md:p-8 text-white bg-[linear-gradient(145deg,rgba(116,158,255,0.55),rgba(26,44,88,0.82))] overflow-hidden">
          <div className="absolute -top-12 -right-10 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-4 -left-10 h-36 w-36 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-white/0 via-white/30 to-white/0 hidden lg:block" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[64px] w-[64px] rounded-2xl border border-white/40 bg-white shadow-[0_10px_24px_rgba(8,20,47,0.3)] grid place-items-center">
                <img
                  src="/trlm-logo.png"
                  alt="TRLM Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100 font-semibold">Tripura State Project</p>
                <p className="text-2xl md:text-[34px] leading-[1.02] font-black text-white">Tripura Rural Livelihood Mission</p>
                <p className="text-[13px] text-slate-100 font-semibold mt-1">Government of Tripura</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="rounded-full border border-white/40 bg-white/12 px-3.5 py-1 text-[10px] tracking-[0.14em] uppercase font-semibold">
                Rural Development Department
              </span>
              <span className="rounded-full border border-white/40 bg-white/12 px-3.5 py-1 text-[10px] tracking-[0.14em] uppercase font-semibold">
                Secure Government Access
              </span>
              <span className="rounded-full border border-white/40 bg-white/12 px-3.5 py-1 text-[10px] tracking-[0.14em] uppercase font-semibold">
                Service Monitoring Enabled
              </span>
            </div>

            <p className="text-xs uppercase tracking-[0.32em] text-cyan-100">TRLM Governance Portal</p>
            <p className="mt-3 text-slate-100/90 max-w-lg text-[14px]">
              Centralized platform for state, district and block-level administration, field monitoring, and official program reporting.
            </p>

            <div className="mt-5 grid sm:grid-cols-2 gap-2.5 max-w-lg">
              {[
                ['Access Control', 'Role-Based Permissions'],
                ['Account Security', 'Protected Sign-In'],
                ['Program Tracking', 'Live Field Updates'],
                ['Official Reporting', 'PDF / Excel Exports'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white/10 border border-white/20 p-3.5">
                  <p className="text-xs text-cyan-100">{k}</p>
                  <p className="font-bold mt-1">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-3 max-w-lg">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100">Notice</p>
              <p className="mt-1.5 text-[13px] text-slate-100/95">
                Authorized users only. All activities are monitored and recorded as per government compliance guidelines.
              </p>
            </div>
          </div>
          </section>

          <section className="bg-[#f8fbff] p-5 md:p-7 overflow-hidden">
            <form
              className="w-full h-full max-w-[430px] mx-auto rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-[0_18px_36px_rgba(15,32,70,0.18)] flex flex-col"
              onSubmit={onSubmit}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Authority Access</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Secure
                </span>
              </div>
              <h2 className="mt-1 text-3xl md:text-[34px] font-black text-slate-900">Sign In</h2>
              <p className="text-[13px] text-slate-500 mt-1">Please use authorized credentials to continue.</p>

              <label className="block mt-4 text-sm font-semibold text-slate-700">Role</label>
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={role}
                onChange={(e) => onRoleChange(e.target.value)}>
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <label className="block mt-4 text-sm font-semibold text-slate-700">User ID</label>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 uppercase bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={userId}
                onChange={(e) => {
                  if (error) dispatch(clearAuthError());
                  setUserId(e.target.value);
                }}
              />

              <label className="block mt-4 text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={password}
                onChange={(e) => {
                  if (error) dispatch(clearAuthError());
                  setPassword(e.target.value);
                }}
              />

              {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-[linear-gradient(90deg,#0b3faf,#0ea5e9)] text-white font-bold py-3 hover:brightness-110 hover:shadow-[0_12px_22px_rgba(10,111,209,0.35)] transition">
                Secure Login
              </button>

              <div className="mt-4 text-xs text-slate-500 space-y-1 border-t border-slate-200 pt-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Demo Credentials</p>
                <p>State: MASTER001 / Admin@123</p>
                <p>District: DIST001 / Dist@123</p>
                <p>Block: BLOCK001 / Block@123</p>
                <p>High: HA001 / High@123</p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
