import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminLayout from '../layouts/AdminLayout';
import DashboardPage from '../pages/DashboardPage';
import UserManagementPage from '../pages/UserManagementPage';
import GeographyMasterPage from '../pages/GeographyMasterPage';
import LoanMasterPage from '../pages/LoanMasterPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import DBTTrackingPage from '../pages/DBTTrackingPage';
import ReportsPage from '../pages/ReportsPage';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import AdminApprovalPage from '../pages/AdminApprovalPage';
import AllAdminStaffPage from '../pages/AllAdminStaffPage';
import ApiStatusPage from '../pages/ApiStatusPage';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="user-management" element={<UserManagementPage />} />
        <Route path="api-status" element={<ApiStatusPage />} />
        <Route path="admin-approval" element={<AdminApprovalPage />} />
        <Route path="all-admin-staff" element={<AllAdminStaffPage />} />
        <Route path="geography-master" element={<GeographyMasterPage />} />
        <Route path="loan-master" element={<LoanMasterPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="dbt-tracking" element={<DBTTrackingPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
