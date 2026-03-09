import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { approveUser, rejectUser } from '../store/slices/authSlice';

export default function AdminApprovalPage() {
  const dispatch = useDispatch();
  const { user, pendingRegistrations } = useSelector((state) => state.auth);
  const [filter, setFilter] = useState('Pending');

  // Only State Admin 01 can approve/reject registrations.
  const canApprove = String(user?.apiRole || '').toLowerCase() === 'adminuser01';

  const filteredUsers = pendingRegistrations.filter(u => u.status === filter);

  const handleApprove = (userId) => {
    dispatch(approveUser({ userId }));
  };

  const handleReject = (userId) => {
    dispatch(rejectUser({ userId }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">Pending</span>;
      case 'Approved':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Rejected</span>;
      default:
        return null;
    }
  };

  if (!canApprove) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-red-800">Access Denied</h2>
          <p className="text-red-600 mt-2">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="portal-title">User Approval Management</h2>
        <p className="portal-subtitle mt-1">Review and approve pending District Admin and Block Admin registrations.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="portal-card p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Total Registrations</p>
          <p className="text-2xl font-bold text-slate-900">{pendingRegistrations.length}</p>
        </div>
        <div className="portal-card p-4">
          <p className="text-xs uppercase tracking-wider text-yellow-600">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingRegistrations.filter(u => u.status === 'Pending').length}</p>
        </div>
        <div className="portal-card p-4">
          <p className="text-xs uppercase tracking-wider text-green-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">{pendingRegistrations.filter(u => u.status === 'Approved').length}</p>
        </div>
        <div className="portal-card p-4">
          <p className="text-xs uppercase tracking-wider text-red-600">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{pendingRegistrations.filter(u => u.status === 'Rejected').length}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="portal-card p-4">
        <div className="flex gap-2 mb-4">
          {['Pending', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {status}
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>No {filter.toLowerCase()} registrations found</p>
            </div>
          ) : (
            filteredUsers.map((registration) => (
              <div
                key={registration.id}
                className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-900">{registration.officialName}</h3>
                      {getStatusBadge(registration.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <p><span className="text-slate-500">Role:</span> <span className="font-medium">{registration.role === 'DISTRICT_ADMIN' ? 'District Admin' : 'Block Admin'}</span></p>
                      <p><span className="text-slate-500">Email:</span> <span className="font-medium">{registration.officialEmail}</span></p>
                      <p><span className="text-slate-500">Contact:</span> <span className="font-medium">{registration.contactNumber}</span></p>
                      <p><span className="text-slate-500">Designation:</span> <span className="font-medium">{registration.designation}</span></p>
                      <p><span className="text-slate-500">District:</span> <span className="font-medium">{registration.districtName || 'N/A'}</span></p>
                      <p><span className="text-slate-500">Block:</span> <span className="font-medium">{registration.blockName || 'N/A'}</span></p>
                      {registration.livelihoodTrackerId && (
                        <p><span className="text-slate-500">Tracker ID:</span> <span className="font-medium">{registration.livelihoodTrackerId}</span></p>
                      )}
                      <p><span className="text-slate-500">Registered:</span> <span className="font-medium">{new Date(registration.registrationDate).toLocaleDateString('en-IN')}</span></p>
                    </div>
                  </div>
                  
                  {registration.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(registration.id)}
                        className="px-4 py-2 rounded-lg font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition">
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(registration.id)}
                        className="px-4 py-2 rounded-lg font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}



