import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/user-management', label: 'User Management' },
  { to: '/admin/all-admin-staff', label: 'All Admin & Staff' },
  { to: '/admin/geography-master', label: 'Geography Master' },
  { to: '/admin/loan-master', label: 'Loan Master' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/dbt-tracking', label: 'DBT Tracking' },
  { to: '/admin/reports', label: 'Reports' },
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const onLogout = () => {
    dispatch(logout());
    closeSidebar();
    navigate('/login', { replace: true });
  };

  const sidebarContent = (
    <>
      <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mb-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/90">TRLM Admin</p>
        <h1 className="mt-2 text-[26px] font-black leading-none text-white">Admin Portal</h1>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <p className="truncate text-sm font-semibold text-white">{user?.name || user?.id}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">{user?.role}</p>
        </div>
      </div>

      <nav className="relative flex-1 space-y-2 overflow-y-auto pr-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-cyan-200/70 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_10px_24px_rgba(6,182,212,0.18)]'
                  : 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-white/15 hover:bg-white/[0.08]'
              }`
            }>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onLogout}
        className="relative mt-4 rounded-2xl border border-rose-400/20 bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400">
        Logout
      </button>
    </>
  );

  const currentLabel = links.find((link) => location.pathname.startsWith(link.to))?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-[#edf4fb] xl:grid xl:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden border-r border-slate-800/50 bg-[linear-gradient(180deg,#081525_0%,#0d1b30_100%)] p-4 text-slate-100 xl:flex xl:flex-col">
        {sidebarContent}
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          />
          <aside className="relative flex h-full w-[272px] max-w-[85vw] flex-col overflow-hidden bg-[linear-gradient(180deg,#081525_0%,#0d1b30_100%)] p-4 text-slate-100 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <main className="min-w-0 p-3 sm:p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm xl:hidden">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">TRLM Admin</p>
            <p className="mt-1 text-lg font-black text-slate-900">{currentLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
