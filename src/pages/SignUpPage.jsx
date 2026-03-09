import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { signUp, clearAuthError } from '../store/slices/authSlice';
import { api } from '../services/api';

const roleOptions = [
  { label: 'District Admin', value: 'DISTRICT_ADMIN', hint: 'For district-level monitoring and approvals.' },
  { label: 'Block Admin', value: 'BLOCK_ADMIN', hint: 'For block-level execution and local reporting.' },
];

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition text-slate-800 placeholder:text-slate-400';

const labelClass = 'block text-sm font-semibold text-slate-700';

export default function SignUpPage() {
  const dispatch = useDispatch();
  const { error, registeredUsers, pendingRegistrations } = useSelector((state) => state.auth);
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const [form, setForm] = useState({
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
    confirmPassword: '',
    role: 'DISTRICT_ADMIN',
  });

  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [districtLoadError, setDistrictLoadError] = useState('');
  const [blockLoadError, setBlockLoadError] = useState('');

  const selectedRole = roleOptions.find((item) => item.value === form.role);

  useEffect(() => {
    let active = true;
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      setDistrictLoadError('');
      const data = await api.getDistricts();
      if (active) {
        console.log('District API result count:', data.length);
        setDistricts(data);
        if (!data.length) {
          setDistrictLoadError('Unable to load districts. Please refresh and try again.');
        }
      }
      setLoadingDistricts(false);
    };
    loadDistricts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadBlocks = async () => {
      if (form.role !== 'BLOCK_ADMIN' || !form.districtId) {
        setBlocks([]);
        setBlockLoadError('');
        return;
      }
      setLoadingBlocks(true);
      setBlockLoadError('');
      const data = await api.getBlocksByDistrict(form.districtId);
      if (active) {
        setBlocks(data);
        if (!data.length) {
          setBlockLoadError('Unable to load blocks for this district.');
        }
      }
      setLoadingBlocks(false);
    };
    loadBlocks();
    return () => {
      active = false;
    };
  }, [form.role, form.districtId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) dispatch(clearAuthError());
    if (validationError) setValidationError('');
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      role: value,
      blockId: '',
      blockName: '',
    }));
    setBlocks([]);
    setBlockLoadError('');
    if (error) dispatch(clearAuthError());
    if (validationError) setValidationError('');
  };

  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    const selectedDistrict = districts.find((d) => String(d.districtId) === String(districtId));
    setForm((prev) => ({
      ...prev,
      districtId,
      districtName: selectedDistrict?.districtName || '',
      blockId: '',
      blockName: '',
    }));
    setBlocks([]);
    if (error) dispatch(clearAuthError());
    if (validationError) setValidationError('');
  };

  const handleBlockChange = (e) => {
    const blockId = e.target.value;
    const selectedBlock = blocks.find((b) => String(b.blockId) === String(blockId));
    setForm((prev) => ({
      ...prev,
      blockId,
      blockName: selectedBlock?.blockName || '',
    }));
    if (error) dispatch(clearAuthError());
    if (validationError) setValidationError('');
  };

  const validateForm = () => {
    if (!form.officialName.trim()) return 'Official Name is required';
    if (!form.officialEmail.trim()) return 'Official Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail)) return 'Invalid email format';
    if (!form.contactNumber.trim()) return 'Contact Number is required';
    if (!/^\d{10}$/.test(form.contactNumber)) return 'Contact Number must be 10 digits';
    if (!form.password) return 'Password is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!form.designation.trim()) return 'Designation is required';
    if (!form.livelihoodTrackerId.trim()) return 'Livelihood Tracker ID is required';
    if (!form.districtId) return 'District Name is required';
    if (form.role === 'BLOCK_ADMIN' && !form.blockId) return 'Block Name is required for Block Admin';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const nextValidationError = validateForm();
    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = form.officialEmail.trim().toLowerCase();
      const existingUser = [...registeredUsers, ...pendingRegistrations].find(
        (u) => u.officialEmail?.toLowerCase() === normalizedEmail && u.role === form.role,
      );
      if (existingUser) {
        setValidationError(
          existingUser.status === 'Rejected'
            ? 'This email was rejected for this role. Please contact State Admin.'
            : `This email is already registered for ${form.role === 'DISTRICT_ADMIN' ? 'District Admin' : 'Block Admin'}.`,
        );
        setSubmitting(false);
        return;
      }

      dispatch(signUp({
        districtName: form.districtName,
        blockName: form.blockName,
        officialName: form.officialName,
        contactNumber: form.contactNumber,
        officialEmail: normalizedEmail,
        designation: form.designation,
        livelihoodTrackerId: form.livelihoodTrackerId,
        password: form.password,
        role: form.role,
      }));

      setSuccess(true);
    } catch (err) {
      setValidationError(err?.message || 'Failed to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="h-screen overflow-hidden p-3 md:p-5 bg-[radial-gradient(circle_at_12%_8%,#2563eb_0,transparent_32%),radial-gradient(circle_at_92%_18%,#0891b2_0,transparent_34%),linear-gradient(165deg,#08142f,#0d1b3f)]">
        <div className="mx-auto max-w-xl h-full rounded-[30px] border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_28px_70px_rgba(4,20,55,0.65)] overflow-hidden flex flex-col">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#ff9933_0%,#ffffff_45%,#ffffff_55%,#138808_100%)]" />
          <div className="flex items-center justify-between px-5 py-2 text-[11px] text-slate-200 bg-[#082149]/80 border-b border-white/10">
            <p className="uppercase tracking-[0.18em]">Tripura Rural Livelihood Mission | Official Administrative Portal</p>
            <p className="font-semibold">Date: {today}</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-7 md:p-9 text-center text-white">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-300 flex items-center justify-center">
              <svg className="h-10 w-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-5 text-3xl font-black">Registration Submitted</h2>
            <p className="mt-2 text-slate-200">
              Your request has been sent for State Admin approval. You can sign in after approval.
            </p>

            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-left space-y-1.5 w-full max-w-md">
              <p className="text-sm text-slate-200">Submitted details</p>
              <p className="text-sm"><span className="font-semibold text-cyan-200">Name:</span> {form.officialName}</p>
              <p className="text-sm"><span className="font-semibold text-cyan-200">Email:</span> {form.officialEmail}</p>
              <p className="text-sm"><span className="font-semibold text-cyan-200">Role:</span> {selectedRole?.label || form.role}</p>
              <p className="text-sm"><span className="font-semibold text-cyan-200">Status:</span> <span className="text-yellow-300 font-semibold">Pending Approval</span></p>
            </div>

            <Link
              to="/login"
              className="mt-6 inline-flex w-full max-w-md items-center justify-center rounded-xl bg-[linear-gradient(90deg,#0b3faf,#0ea5e9)] px-5 py-3 font-bold text-white transition hover:brightness-110 hover:shadow-[0_12px_22px_rgba(10,111,209,0.35)]">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden p-3 md:p-5 bg-[radial-gradient(circle_at_12%_8%,#2563eb_0,transparent_32%),radial-gradient(circle_at_92%_18%,#0891b2_0,transparent_34%),linear-gradient(165deg,#08142f,#0d1b3f)]">
      <div className="mx-auto max-w-6xl h-full rounded-[30px] border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_28px_70px_rgba(4,20,55,0.65)] overflow-hidden flex flex-col">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#ff9933_0%,#ffffff_45%,#ffffff_55%,#138808_100%)]" />

        <div className="flex items-center justify-between px-5 py-2 text-[11px] text-slate-200 bg-[#082149]/80 border-b border-white/10">
          <p className="uppercase tracking-[0.18em]">Tripura Rural Livelihood Mission | Official Administrative Portal</p>
          <div className="flex items-center gap-4">
            <p className="font-semibold">Date: {today}</p>
            <Link to="/login" className="text-cyan-300 hover:text-white transition font-semibold">Back to Login</Link>
          </div>
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
                  District & Block Onboarding
                </span>
                <span className="rounded-full border border-white/40 bg-white/12 px-3.5 py-1 text-[10px] tracking-[0.14em] uppercase font-semibold">
                  Secure Registration
                </span>
                <span className="rounded-full border border-white/40 bg-white/12 px-3.5 py-1 text-[10px] tracking-[0.14em] uppercase font-semibold">
                  Approval Workflow Enabled
                </span>
              </div>

              <p className="text-xs uppercase tracking-[0.32em] text-cyan-100">TRLM Registration Portal</p>
              <p className="mt-3 text-slate-100/90 max-w-lg text-[14px]">
                Use official details to request access. State Admin will review and approve your account before login access is granted.
              </p>

              <div className="mt-5 grid sm:grid-cols-2 gap-2.5 max-w-lg">
                {[
                  ['Step 1', 'Choose role and district'],
                  ['Step 2', 'Enter official details'],
                  ['Step 3', 'Set secure password'],
                  ['Step 4', 'Submit for approval'],
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
                  Use government-authorized details only. All registration requests are logged and reviewed for compliance.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#f8fbff] p-5 md:p-7 overflow-y-auto">
            <form onSubmit={onSubmit} className="w-full max-w-[500px] mx-auto rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-[0_18px_36px_rgba(15,32,70,0.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Authority Registration</p>
                  <h2 className="mt-1 text-3xl md:text-[34px] font-black text-slate-900">Sign Up</h2>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Secure Form
                </span>
              </div>
              <p className="text-[13px] text-slate-500 mt-1">District and Block Admin registrations require State Admin approval.</p>

              <label className="block mt-4 text-sm font-semibold text-slate-700">Register As *</label>
              <select name="role" value={form.role} onChange={handleRoleChange} className={fieldClass}>
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">{selectedRole?.hint}</p>

              <label className="block mt-4 text-sm font-semibold text-slate-700">District Name *</label>
              <select name="districtId" value={form.districtId} onChange={handleDistrictChange} className={fieldClass}>
                <option value="">{loadingDistricts ? 'Loading districts...' : 'Select District'}</option>
                {districts.map((d) => (
                  <option key={d.districtId} value={d.districtId}>{d.districtName}</option>
                ))}
              </select>
              {districtLoadError ? <p className="mt-1 text-xs text-red-600">{districtLoadError}</p> : null}

              {form.role === 'BLOCK_ADMIN' && (
                <>
                  <label className="block mt-4 text-sm font-semibold text-slate-700">Block Name *</label>
                  <select
                    name="blockId"
                    value={form.blockId}
                    onChange={handleBlockChange}
                    className={fieldClass}
                    disabled={!form.districtId || loadingBlocks}>
                    <option value="">
                      {!form.districtId ? 'Select district first' : loadingBlocks ? 'Loading blocks...' : 'Select Block'}
                    </option>
                    {blocks.map((b) => (
                      <option key={b.blockId} value={b.blockId}>{b.blockName}</option>
                    ))}
                  </select>
                  {blockLoadError ? <p className="mt-1 text-xs text-red-600">{blockLoadError}</p> : null}
                </>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`${labelClass} mt-4`}>Official Name *</label>
                  <input
                    type="text"
                    name="officialName"
                    value={form.officialName}
                    onChange={handleChange}
                    placeholder="Enter Official Name"
                    autoComplete="name"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={`${labelClass} mt-4`}>Designation *</label>
                  <input
                    type="text"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="e.g., District Programme Manager"
                    autoComplete="organization-title"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`${labelClass} mt-4`}>Official Email *</label>
                  <input
                    type="email"
                    name="officialEmail"
                    value={form.officialEmail}
                    onChange={handleChange}
                    placeholder="official@email.gov.in"
                    autoComplete="email"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={`${labelClass} mt-4`}>Contact Number *</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel"
                    className={fieldClass}
                  />
                </div>
              </div>

              <label className={`${labelClass} mt-4`}>Livelihood Tracker ID (Optional)</label>
              <input
                type="text"
                name="livelihoodTrackerId"
                value={form.livelihoodTrackerId}
                onChange={handleChange}
                placeholder="Enter Livelihood Tracker ID"
                className={fieldClass}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`${labelClass} mt-4`}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={`${labelClass} mt-4`}>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className={fieldClass}
                  />
                </div>
              </div>

              {(validationError || error) && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-200 text-red-700 text-sm" aria-live="polite">
                  {validationError || error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full rounded-xl bg-[linear-gradient(90deg,#0b3faf,#0ea5e9)] text-white font-bold py-3 hover:brightness-110 hover:shadow-[0_12px_22px_rgba(10,111,209,0.35)] transition disabled:opacity-70 disabled:cursor-not-allowed">
                {submitting ? 'Submitting...' : 'Submit Registration Request'}
              </button>

              <div className="mt-4 flex justify-center">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Already registered? Back to Login
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-500 border-t border-slate-200 pt-3">
                After submission, your account remains pending until State Admin approval.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
