import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', permission: ['view_dashboard'] },
  { to: '/admin/user-management', label: 'User Management', permission: ['manage_district', 'manage_block'] },
  { to: '/admin/admin-approval', label: 'Admin Approval', permission: ['approve_users'] },
  { to: '/admin/geography-master', label: 'Geography Master', permission: ['full_access'] },
  { to: '/admin/loan-master', label: 'Loan Master', permission: ['full_access', 'manage_district'] },
  { to: '/admin/analytics', label: 'Analytics', permission: ['full_access', 'manage_district'] },
  { to: '/admin/dbt-tracking', label: 'DBT Tracking', permission: ['full_access', 'manage_district', 'manage_block'] },
  { to: '/admin/reports', label: 'Reports', permission: ['view_reports'] },
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const filteredLinks = links.filter((link) => {
    if (!link.permission) return true;
    if (!user?.permissions) return false;
    return link.permission.some((p) => user.permissions.includes(p));
  });

  const onLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[300px_1fr] bg-slate-100">
      <aside className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-slate-100 p-5 flex flex-col">
        <div className="absolute -top-12 -right-14 w-44 h-44 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="absolute bottom-16 -left-8 w-40 h-40 rounded-full bg-blue-500/20 blur-2xl" />

        <div className="relative mb-6">
          <p className="text-xs tracking-[0.18em] uppercase text-cyan-200">Tripura State Project</p>
          <h1 className="text-3xl font-black mt-2">TRLM Admin Portal</h1>
          <p className="text-xs text-slate-300 mt-2">{user?.name} ({user?.apiRole || user?.role})</p>
          {user?.district ? <p className="text-[11px] text-slate-400 mt-1">District: {user.district}</p> : null}
          {user?.block ? <p className="text-[11px] text-slate-400">Block: {user.block}</p> : null}
        </div>

        <nav className="space-y-2 relative">
          {filteredLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-xl px-3.5 py-2.5 border transition ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 border-cyan-200 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`
              }>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="mt-auto relative rounded-xl px-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/30">
          Logout
        </button>
      </aside>

      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
