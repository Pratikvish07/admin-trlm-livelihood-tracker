import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const roleConfig = {
  BLOCK_ADMIN: {
    title: 'Block Operations Dashboard',
    subtitle: 'Tripura Rural Livelihood Mission - Block-level execution and verification status.',
    kpis: [
      ['CRP Pending Approval', '27'],
      ['Approved CRP', '68'],
      ['SHG Data Updated', '214'],
      ['Reports Ready', '31'],
    ],
    quick: [
      { to: '/admin/user-management', label: 'Manage CRP', desc: 'Create, update and approve CRP profiles in this block' },
      { to: '/admin/dbt-tracking', label: 'DBT Verification', desc: 'Check beneficiary status and resolve pending cases' },
      { to: '/admin/reports', label: 'Block Reports', desc: 'Review and export block-wise progress reports' },
      { to: '/admin/loan-master', label: 'Loan Status View', desc: 'Monitor loan cycles and repayment compliance' },
    ],
  },
  DISTRICT_ADMIN: {
    title: 'District Monitoring Dashboard',
    subtitle: 'Tripura Rural Livelihood Mission - District supervision across all blocks.',
    kpis: [
      ['Block Admin Active', '12'],
      ['CRP Pending', '74'],
      ['District Reports', '53'],
      ['DBT Cases Cleared', '418'],
    ],
    quick: [
      { to: '/admin/user-management', label: 'Manage Block Admins', desc: 'Create/update/delete block-level administrators' },
      { to: '/admin/geography-master', label: 'District Geography', desc: 'Maintain block, GP and village master data' },
      { to: '/admin/analytics', label: 'District Analytics', desc: 'Analyze performance trends and bottlenecks' },
      { to: '/admin/reports', label: 'District Reports', desc: 'Generate MIS, Excel and PDF reports' },
    ],
  },
  STATE_ADMIN: {
    title: 'State Governance Dashboard',
    subtitle: 'Tripura Rural Livelihood Mission - State command center for district performance.',
    kpis: [
      ['District Admins', '8'],
      ['Block Admins', '42'],
      ['CRP Pending', '126'],
      ['State Reports Ready', '96'],
    ],
    quick: [
      { to: '/admin/user-management', label: 'Manage District Admins', desc: 'Create/update/delete district-level admins' },
      { to: '/admin/analytics', label: 'State Analytics', desc: 'State-wide dashboards for strategy and monitoring' },
      { to: '/admin/dbt-tracking', label: 'DBT Oversight', desc: 'Monitor fund flow and district disbursement status' },
      { to: '/admin/reports', label: 'State Reports Hub', desc: 'Download state-level MIS and policy reports' },
    ],
  },
  HIGH_AUTHORITY: {
    title: 'High Authority Dashboard',
    subtitle: 'Tripura Rural Livelihood Mission - Executive review and strategic oversight.',
    kpis: [
      ['State Progress Index', '8.4/10'],
      ['Districts Reviewed', '8'],
      ['Policy Alerts', '5'],
      ['Audit Reports', '12'],
    ],
    quick: [
      { to: '/admin/analytics', label: 'Strategic Analytics', desc: 'High-level trend intelligence and exceptions' },
      { to: '/admin/reports', label: 'Executive Reports', desc: 'Governance reports for policy and review meetings' },
      { to: '/admin/dbt-tracking', label: 'DBT Governance', desc: 'Review fund transfer outcomes and escalations' },
      { to: '/admin/user-management', label: 'Admin Hierarchy View', desc: 'Inspect and validate authority hierarchy' },
    ],
  },
};

export default function DashboardPage() {
  const role = useSelector((state) => state.auth.user?.role);
  const cfg = roleConfig[role] || roleConfig.BLOCK_ADMIN;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl p-6 md:p-8 bg-[linear-gradient(120deg,#0b3faf,#0ea5e9)] text-white shadow-xl">
        <p className="uppercase text-xs tracking-[0.18em] text-cyan-100">Tripura Rural Livelihood Mission</p>
        <h2 className="text-3xl md:text-4xl font-black mt-2">{cfg.title}</h2>
        <p className="text-blue-100 mt-2 text-sm">{cfg.subtitle}</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cfg.kpis.map(([label, value]) => (
          <div key={label} className="portal-card p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-extrabold text-brand mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="portal-card p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Quick Actions</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {cfg.quick.map((item) => (
            <Link key={item.to} to={item.to} className="rounded-xl border border-slate-200 p-4 hover:border-cyan-300 hover:bg-cyan-50 transition">
              <p className="font-bold text-slate-900">{item.label}</p>
              <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
