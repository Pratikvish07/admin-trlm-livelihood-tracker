import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { clearAuthError, loginWithCredentials } from '../store/slices/authSlice';

const emptySignupForm = {
  districtId: '',
  districtName: '',
  blockId: '',
  blockName: '',
  officialName: '',
  contactNumber: '',
  officialEmail: '',
  designation: '',
  livelihoodTrackerId: '',
  password: '',
  role: 'DISTRICT_STAFF',
};

const signupRoleOptions = [
  { label: 'District Staff', value: 'DISTRICT_STAFF' },
  { label: 'Block Staff', value: 'BLOCK_STAFF' },
];

const getDistrictOptionValue = (district) =>
  String(district?.districtId ?? district?.DistrictId ?? district?.id ?? district?.value ?? '');

const getDistrictOptionLabel = (district) =>
  String(
    district?.districtName ??
      district?.DistrictName ??
      district?.name ??
      district?.district ??
      district?.label ??
      getDistrictOptionValue(district)
  );

const getBlockOptionValue = (block) =>
  String(block?.blockId ?? block?.BlockId ?? block?.id ?? block?.value ?? '');

const getBlockOptionLabel = (block) =>
  String(
    block?.blockName ??
      block?.BlockName ??
      block?.name ??
      block?.label ??
      getBlockOptionValue(block)
  );

function EyeButton({ visible, onClick }) {
  return (
    <button
      type="button"
      className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      onClick={onClick}
      aria-label={visible ? 'Hide password' : 'Show password'}>
      {visible ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
          <path d="M3 3l18 18" />
          <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
          <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c5.4 0 9.4 4.4 10 5-.3.3-1.5 1.8-3.4 3.2" />
          <path d="M6.2 6.3C3.7 8 2.2 10 2 10.3c.6.6 4.6 5 10 5 1.7 0 3.2-.4 4.5-1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
          <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('login');
  const [userId, setUserId] = useState('001');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupForm, setSignupForm] = useState(emptySignupForm);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState('');
  const [signupError, setSignupError] = useState('');
  const [districtOptions, setDistrictOptions] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [blockOptions, setBlockOptions] = useState([]);
  const [blockLoading, setBlockLoading] = useState(false);
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/admin/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadDistricts = async () => {
      setDistrictLoading(true);

      try {
        const data = await api.getDistricts();
        setDistrictOptions(Array.isArray(data) ? data : []);
      } catch {
        setDistrictOptions([]);
      } finally {
        setDistrictLoading(false);
      }
    };

    loadDistricts();
  }, []);

  useEffect(() => {
    const loadBlocks = async () => {
      if (!signupForm.districtId) {
        setBlockOptions([]);
        return;
      }

      setBlockLoading(true);

      try {
        const data = await api.getBlocksByDistrict(signupForm.districtId);
        setBlockOptions(Array.isArray(data) ? data : []);
      } catch {
        setBlockOptions([]);
      } finally {
        setBlockLoading(false);
      }
    };

    loadBlocks();
  }, [signupForm.districtId]);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(loginWithCredentials({ userId, password }));
  };

  const updateSignupField = (key, value) => {
    setSignupForm((prev) => ({ ...prev, [key]: value }));
    setSignupError('');
    setSignupMessage('');
  };

  const onDistrictChange = (districtId) => {
    const selectedDistrict = districtOptions.find((item) => getDistrictOptionValue(item) === districtId);
    setSignupForm((prev) => ({
      ...prev,
      districtId,
      districtName: selectedDistrict ? getDistrictOptionLabel(selectedDistrict) : '',
      blockId: '',
      blockName: '',
    }));
    setSignupError('');
    setSignupMessage('');
  };

  const onBlockChange = (blockId) => {
    const selectedBlock = blockOptions.find((item) => getBlockOptionValue(item) === blockId);
    setSignupForm((prev) => ({
      ...prev,
      blockId,
      blockName: selectedBlock ? getBlockOptionLabel(selectedBlock) : '',
    }));
    setSignupError('');
    setSignupMessage('');
  };

  const onSignup = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError('');
    setSignupMessage('');

    try {
      const payload = {
        districtName: signupForm.districtName.trim(),
        blockName: signupForm.blockName.trim(),
        officialName: signupForm.officialName.trim(),
        contactNumber: signupForm.contactNumber.trim(),
        officialEmail: signupForm.officialEmail.trim(),
        designation: signupForm.designation.trim(),
        livelihoodTrackerId: signupForm.livelihoodTrackerId.trim(),
        password: signupForm.password,
        role: signupForm.role,
      };

      await api.signupAdminUser(payload);
      setSignupForm(emptySignupForm);
      setShowSignupPassword(false);
      setSignupMessage('Signup submitted successfully. Please wait for admin approval before login.');
      setActiveTab('login');
    } catch (err) {
      setSignupError(err?.message || 'Unable to submit signup request.');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_8%,#2563eb_0,transparent_32%),radial-gradient(circle_at_92%_18%,#0891b2_0,transparent_34%),linear-gradient(165deg,#08142f,#0d1b3f)] p-3 md:p-5">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/20 bg-white/10 shadow-[0_28px_70px_rgba(4,20,55,0.65)] backdrop-blur-2xl">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#ff9933_0%,#ffffff_45%,#ffffff_55%,#138808_100%)]" />
        <div className="flex items-center justify-between border-b border-white/10 bg-[#082149]/80 px-5 py-2 text-[11px] text-slate-200">
          <p className="uppercase tracking-[0.18em]">Tripura Rural Livelihood Mission | Official Administrative Portal</p>
          <p className="font-semibold">Date: {today}</p>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="relative overflow-hidden bg-[linear-gradient(145deg,rgba(116,158,255,0.55),rgba(26,44,88,0.82))] p-6 text-white md:p-8">
            <div className="absolute -top-12 -right-10 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute bottom-4 -left-10 h-36 w-36 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute right-0 top-0 hidden h-full w-[2px] bg-gradient-to-b from-white/0 via-white/30 to-white/0 lg:block" />

            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-[64px] w-[64px] place-items-center rounded-2xl border border-white/40 bg-white shadow-[0_10px_24px_rgba(8,20,47,0.3)]">
                  <img src="/trlm-logo.png" alt="TRLM Logo" className="h-10 w-10 object-contain" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">Tripura State Project</p>
                  <p className="text-2xl font-black leading-[1.02] text-white md:text-[34px]">Tripura Rural Livelihood Mission</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-100">Government of Tripura</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/40 bg-white/12 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">Rural Development Department</span>
                <span className="rounded-full border border-white/40 bg-white/12 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">Secure Government Access</span>
                <span className="rounded-full border border-white/40 bg-white/12 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">Service Monitoring Enabled</span>
              </div>

              <p className="text-xs uppercase tracking-[0.32em] text-cyan-100">TRLM Governance Portal</p>
              <p className="mt-3 max-w-lg text-[14px] text-slate-100/90">
                Centralized platform for state, district, block, and staff-level administration, onboarding, field monitoring, and official program reporting.
              </p>

              <div className="mt-5 grid max-w-lg gap-2.5 sm:grid-cols-2">
                {[
                  ['Access Control', 'Role-Based Permissions'],
                  ['Account Security', 'Protected Sign-In'],
                  ['Staff Onboarding', 'Self Signup + Admin Review'],
                  ['Official Reporting', 'PDF / Excel Exports'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/20 bg-white/10 p-3.5">
                    <p className="text-xs text-cyan-100">{label}</p>
                    <p className="mt-1 font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 max-w-lg rounded-2xl border border-white/20 bg-white/10 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100">Workflow</p>
                <p className="mt-1.5 text-[13px] leading-6 text-slate-100/95">
                  Staff users fill their own signup form with district and block details. Admin reviews new entries from the admin panel before operational access is granted.
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-y-auto bg-[#f8fbff] p-5 md:p-7">
            <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-5 shadow-[0_24px_60px_rgba(15,32,70,0.16)] md:p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,#dbeafe_0%,rgba(219,234,254,0)_72%)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Portal Access</p>
                  <span className="rounded-full border border-emerald-300 bg-[linear-gradient(180deg,#f0fdf4,#dcfce7)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 shadow-sm">Secure</span>
                </div>

                <div className="mt-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5">
                  <button
                    type="button"
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('login')}>
                    Login
                  </button>
                  <button
                    type="button"
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${activeTab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('signup')}>
                    Sign Up
                  </button>
                </div>

                {signupMessage ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {signupMessage}
                  </div>
                ) : null}

                {activeTab === 'login' ? (
                  <form className="mt-5" onSubmit={onSubmit}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">Official Login</div>
                    <h2 className="mt-3 text-4xl font-black leading-none text-slate-900 md:text-[42px]">Sign In</h2>
                    <p className="mt-3 max-w-sm text-[14px] leading-7 text-slate-500">Enter your official tracker ID and password. Your role is assigned automatically after login.</p>

                    <div className="mt-6 space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700">User ID</label>
                        <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100">
                          <span className="pr-3 text-lg text-slate-400">#</span>
                          <input
                            className="w-full bg-transparent py-3 text-lg uppercase text-slate-800 outline-none placeholder:text-slate-300"
                            value={userId}
                            placeholder="Enter user ID"
                            onChange={(e) => {
                              if (error) dispatch(clearAuthError());
                              setUserId(e.target.value);
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700">Password</label>
                        <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100">
                          <span className="pr-3 text-lg text-slate-400">*</span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="w-full bg-transparent py-3 text-lg text-slate-800 outline-none placeholder:text-slate-300"
                            value={password}
                            placeholder="Enter password"
                            onChange={(e) => {
                              if (error) dispatch(clearAuthError());
                              setPassword(e.target.value);
                            }}
                          />
                          <EyeButton visible={showPassword} onClick={() => setShowPassword((prev) => !prev)} />
                        </div>
                      </div>
                    </div>

                    {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-6 w-full rounded-2xl bg-[linear-gradient(90deg,#1d4ed8,#0ea5e9)] px-4 py-4 text-lg font-black text-white shadow-[0_18px_30px_rgba(10,111,209,0.28)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_20px_34px_rgba(10,111,209,0.35)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0">
                      {loading ? 'Signing In...' : 'Secure Login'}
                    </button>
                  </form>
                ) : (
                  <form className="mt-5 space-y-5" onSubmit={onSignup}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Staff Registration</div>
                    <h2 className="mt-3 text-4xl font-black leading-none text-slate-900 md:text-[42px]">Sign Up</h2>
                    <p className="mt-3 max-w-sm text-[14px] leading-7 text-slate-500">District and block staff must fill their own details here. Your account will be reviewed by admin before approval.</p>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Staff Type</label>
                        <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" value={signupForm.role} onChange={(e) => updateSignupField('role', e.target.value)}>
                          {signupRoleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Tracker ID</label>
                        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" value={signupForm.livelihoodTrackerId} onChange={(e) => updateSignupField('livelihoodTrackerId', e.target.value)} placeholder="Enter tracker ID" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Official Name</label>
                        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" value={signupForm.officialName} onChange={(e) => updateSignupField('officialName', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Designation</label>
                        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" value={signupForm.designation} onChange={(e) => updateSignupField('designation', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">District Name</label>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                          value={signupForm.districtId}
                          onChange={(e) => onDistrictChange(e.target.value)}>
                          <option value="">{districtLoading ? 'Loading districts...' : 'Select district'}</option>
                          {districtOptions.map((district, index) => {
                            const optionValue = getDistrictOptionValue(district);
                            const optionLabel = getDistrictOptionLabel(district);
                            return (
                              <option key={district?.id ?? district?.districtId ?? optionValue ?? index} value={optionValue}>
                                {optionLabel}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Block Name</label>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-400"
                          value={signupForm.blockId}
                          onChange={(e) => onBlockChange(e.target.value)}
                          disabled={!signupForm.districtId || blockLoading}>
                          <option value="">
                            {!signupForm.districtId ? 'Select district first' : blockLoading ? 'Loading blocks...' : 'Select block'}
                          </option>
                          {blockOptions.map((block, index) => {
                            const optionValue = getBlockOptionValue(block);
                            const optionLabel = getBlockOptionLabel(block);
                            return (
                              <option key={block?.id ?? block?.blockId ?? block?.BlockId ?? optionValue ?? index} value={optionValue}>
                                {optionLabel}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Official Email</label>
                        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" value={signupForm.officialEmail} onChange={(e) => updateSignupField('officialEmail', e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Contact Number</label>
                        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" value={signupForm.contactNumber} onChange={(e) => updateSignupField('contactNumber', e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-700">Password</label>
                      <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-1 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100">
                        <input type={showSignupPassword ? 'text' : 'password'} className="w-full py-3 outline-none" value={signupForm.password} onChange={(e) => updateSignupField('password', e.target.value)} placeholder="Create password" />
                        <EyeButton visible={showSignupPassword} onClick={() => setShowSignupPassword((prev) => !prev)} />
                      </div>
                    </div>

                    {signupError ? <p className="text-sm text-red-600">{signupError}</p> : null}

                    <button type="submit" disabled={signupLoading} className="w-full rounded-2xl bg-[linear-gradient(90deg,#0891b2,#0ea5e9)] px-4 py-4 text-lg font-black text-white shadow-[0_18px_30px_rgba(8,145,178,0.22)] transition hover:brightness-110 disabled:opacity-70">
                      {signupLoading ? 'Submitting...' : 'Submit For Approval'}
                    </button>
                  </form>
                )}

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs leading-6 text-slate-500">
                  Access is restricted to authorized users. Staff signup requests should be reviewed by admin before operational access is granted.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
