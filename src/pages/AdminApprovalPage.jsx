import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../services/api';

const tabs = ['Pending', 'Approved', 'Rejected'];

const readStatus = (row) => String(row?.status || row?.userStatus || row?.approvalStatus || 'Pending');
const readId = (row) => Number(row?.id ?? row?.userId ?? row?.adminUserId ?? row?.staffId ?? 0) || 0;
const readRole = (row) => String(row?.roleName || row?.role || row?.userRole || row?.roleId || '');
const readName = (row) => row?.officialName || row?.fullName || row?.name || row?.userName || 'Unknown User';
const readEmail = (row) => row?.officialEmail || row?.email || 'NA';
const readContact = (row) => row?.contactNumber || row?.mobile || row?.phoneNumber || 'NA';
const readDesignation = (row) => row?.designation || 'NA';
const readDistrictId = (row) => row?.districtId ?? row?.DistrictId ?? 'NA';
const readBlockId = (row) => row?.blockId ?? row?.BlockId ?? 'NA';
const readTrackerId = (row) => row?.livelihoodTrackerId || row?.trackerId || 'NA';

export default function AdminApprovalPage() {
  const user = useSelector((state) => state.auth.user);
  const normalizedRoleId = Number(user?.roleId) || 0;
  const normalizedRole = String(user?.role || '').trim().toUpperCase();
  const normalizedApiRole = String(user?.apiRole || '').trim().toUpperCase();
  const canApprove =
    normalizedRoleId === 1 ||
    normalizedRole === 'STATE_ADMIN' ||
    normalizedApiRole === 'ADMINUSER01' ||
    normalizedApiRole === 'ADMINUSER02';

  const [filter, setFilter] = useState('Pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(0);
  const [message, setMessage] = useState('');

  const loadPendingUsers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await api.getPendingRegistrations();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      setRows([]);
      setMessage(error?.message || 'Unable to load approval records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canApprove) return;
    loadPendingUsers();
  }, [canApprove]);

  const filteredUsers = useMemo(
    () => rows.filter((row) => readStatus(row).toLowerCase() === filter.toLowerCase()),
    [rows, filter]
  );

  const stats = useMemo(
    () => [
      { label: 'Total Records', value: rows.length, tone: 'text-slate-900' },
      { label: 'Pending', value: rows.filter((row) => readStatus(row) === 'Pending').length, tone: 'text-yellow-600' },
      { label: 'Approved', value: rows.filter((row) => readStatus(row) === 'Approved').length, tone: 'text-green-600' },
      { label: 'Rejected', value: rows.filter((row) => readStatus(row) === 'Rejected').length, tone: 'text-red-600' },
    ],
    [rows]
  );

  const handleApprove = async (id) => {
    const userId = Number(id) || 0;
    if (!userId) return;
    setActionLoadingId(userId);
    setMessage('');
    try {
      await api.approveUser(userId);
      await loadPendingUsers();
      setMessage(`Approved user id ${userId}`);
    } catch (error) {
      setMessage(error?.message || `Unable to approve user id ${userId}`);
    } finally {
      setActionLoadingId(0);
    }
  };

  const handleReject = async (id) => {
    const userId = Number(id) || 0;
    if (!userId) return;
    setActionLoadingId(userId);
    setMessage('');
    try {
      await api.rejectUser(userId);
      await loadPendingUsers();
      setMessage(`Rejected user id ${userId}`);
    } catch (error) {
      setMessage(error?.message || `Unable to reject user id ${userId}`);
    } finally {
      setActionLoadingId(0);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">Approved</span>;
      case 'Rejected':
        return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-800">Rejected</span>;
      default:
        return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-800">Pending</span>;
    }
  };

  if (!canApprove) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-xl font-bold text-red-800">Access Denied</h2>
          <p className="mt-2 text-red-600">Only users with `roleId = 1` can access approve, pending, and reject actions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="portal-title">User Approval Management</h2>
        </div>
        <button onClick={loadPendingUsers} disabled={loading} className="portal-btn-outline">
          {loading ? 'Refreshing...' : 'Refresh Pending API'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="portal-card p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {message ? <div className="portal-card p-4 text-sm text-slate-700">{message}</div> : null}

      <div className="portal-card p-4">
        <div className="mb-4 flex gap-2">
          {tabs.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === status ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {status}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {!loading && filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No {filter.toLowerCase()} records found from `/admin/pending`.
            </div>
          ) : null}

          {filteredUsers.map((registration) => {
            const userId = readId(registration);
            const status = readStatus(registration);
            return (
              <div key={userId || readEmail(registration)} className="rounded-xl border border-slate-200 p-4 transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[220px] flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{readName(registration)}</h3>
                      {getStatusBadge(status)}
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm md:grid-cols-2">
                      <p><span className="text-slate-500">ID:</span> <span className="font-medium">{userId || 'NA'}</span></p>
                      <p><span className="text-slate-500">Role:</span> <span className="font-medium">{readRole(registration)}</span></p>
                      <p><span className="text-slate-500">Email:</span> <span className="font-medium">{readEmail(registration)}</span></p>
                      <p><span className="text-slate-500">Contact:</span> <span className="font-medium">{readContact(registration)}</span></p>
                      <p><span className="text-slate-500">Designation:</span> <span className="font-medium">{readDesignation(registration)}</span></p>
                      <p><span className="text-slate-500">Tracker ID:</span> <span className="font-medium">{readTrackerId(registration)}</span></p>
                      <p><span className="text-slate-500">District ID:</span> <span className="font-medium">{readDistrictId(registration)}</span></p>
                      <p><span className="text-slate-500">Block ID:</span> <span className="font-medium">{readBlockId(registration)}</span></p>
                    </div>
                  </div>

                  {status === 'Pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(userId)}
                        disabled={actionLoadingId === userId}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
                        {actionLoadingId === userId ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(userId)}
                        disabled={actionLoadingId === userId}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                        {actionLoadingId === userId ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
