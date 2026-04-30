import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import RoleGuard from './components/auth/RoleGuard';
import { ROLES, DASHBOARD_ROUTES } from './config/roles.config';
import { useAuth } from './context/AuthContext';

// Eager load critical pages to avoid Suspense hangs during auth flow
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';

// Lazy load other modules
const PharmacySales = lazy(() => import('./pages/PharmacySales'));
const MedicineReturns = lazy(() => import('./pages/MedicineReturns'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const MedicineCreditBills = lazy(() => import('./pages/MedicineCreditBills'));
const MedicineCreditReturns = lazy(() => import('./pages/MedicineCreditReturns'));
const DirectPharmacySales = lazy(() => import('./pages/DirectPharmacySales'));
const DirectMedicineReturns = lazy(() => import('./pages/DirectMedicineReturns'));
const ReturnWorklists = lazy(() => import('./pages/ReturnWorklists'));
const DispenseWorklists = lazy(() => import('./pages/DispenseWorklists'));
const PharmacyAdvances = lazy(() => import('./pages/PharmacyAdvances'));
const ConsolidatedBills = lazy(() => import('./pages/ConsolidatedBills'));
const PharmacyClearance = lazy(() => import('./pages/PharmacyClearance'));
const PendingPrescriptions = lazy(() => import('./pages/PendingPrescriptions'));
const PendingPharmacyReplacement = lazy(() => import('./pages/PendingPharmacyReplacement'));
const PendingReplacementReturns = lazy(() => import('./pages/PendingReplacementReturns'));
const ProductSalesPerformance = lazy(() => import('./pages/ProductSalesPerformance'));
const PendingIndentPrescriptions = lazy(() => import('./pages/PendingIndentPrescriptions'));
const MedicineMaster = lazy(() => import('./pages/MedicineMaster'));
const MedicineStock = lazy(() => import('./pages/MedicineStock'));
const RoleDashboard = lazy(() => import('./pages/RoleDashboard'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Patients = lazy(() => import('./pages/Patients'));
const Reports = lazy(() => import('./pages/Reports'));

const RootRedirect = () => {
  const { activeRole, roles, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      console.log('RootRedirect: Not authenticated, to /login');
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
      return;
    }

    // Find the first role that has a dashboard route
    const roleToUse = activeRole || (roles && roles[0]) || 'SYSTEM_ADMIN';
    const target = DASHBOARD_ROUTES[roleToUse] || '/dashboard/admin';

    console.log('RootRedirect: Authenticated, target is', target, 'current is', location.pathname);
    
    if (location.pathname !== target) {
      console.log('RootRedirect: Redirecting to', target);
      navigate(target, { replace: true });
    }
  }, [loading, isAuthenticated, activeRole, roles, navigate, location.pathname]);

  return null; // render nothing while redirecting
};

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading PharmaDesk...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" reverseOrder={false} />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Main app shell */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<RootRedirect />} />
              
              {/* Role-Specific Dashboards */}
              <Route path="dashboard">
                <Route index element={<RootRedirect />} />
                <Route path="admin" element={<RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN]}><AdminDashboard /></RoleGuard>} />
                <Route path="supervisor" element={<RoleGuard allowedRoles={[ROLES.SUPERVISOR]}><RoleDashboard title="Supervisor Dashboard" description="Team activity feed, pending approvals queue" /></RoleGuard>} />
                <Route path="senior-medical" element={<RoleGuard allowedRoles={[ROLES.SENIOR_MEDICAL_STAFF]}><RoleDashboard title="Senior Medical Dashboard" description="Prescription queue, patient history" /></RoleGuard>} />
                <Route path="medical" element={<RoleGuard allowedRoles={[ROLES.MEDICAL_STAFF]}><RoleDashboard title="Medical Staff Dashboard" description="Dispense worklist, tasks" /></RoleGuard>} />
                <Route path="billing" element={<RoleGuard allowedRoles={[ROLES.BILLING_STAFF]}><RoleDashboard title="Billing Dashboard" description="Bill queue, advances, clearance list" /></RoleGuard>} />
                <Route path="pharmacy" element={<RoleGuard allowedRoles={[ROLES.PHARMACY_STAFF]}><PharmacyDashboard /></RoleGuard>} />
                <Route path="reception" element={<RoleGuard allowedRoles={[ROLES.RECEPTIONIST]}><RoleDashboard title="Reception Dashboard" description="Patient registration, appointments" /></RoleGuard>} />
                <Route path="audit" element={<RoleGuard allowedRoles={[ROLES.AUDIT_COMPLIANCE]}><RoleDashboard title="Audit & Compliance Dashboard" description="Read-only report viewer, logs" /></RoleGuard>} />
                <Route path="lab" element={<RoleGuard allowedRoles={[ROLES.LAB_TECHNICIAN]}><RoleDashboard title="Lab Technician Dashboard" description="Lab requests, reports" /></RoleGuard>} />
                <Route path="store" element={<RoleGuard allowedRoles={[ROLES.STOREKEEPER]}><RoleDashboard title="Storekeeper Dashboard" description="Purchase orders, stock management" /></RoleGuard>} />
              </Route>

              {/* Shared Modules */}
              <Route path="medicines" element={
                <RoleGuard allowedRoles={[
                  ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR,
                  ROLES.SENIOR_MEDICAL_STAFF, ROLES.MEDICAL_STAFF,
                  ROLES.PHARMACY_STAFF, ROLES.STOREKEEPER,
                  ROLES.BILLING_STAFF
                ]}>
                  <MedicineMaster />
                </RoleGuard>
              } />
              <Route path="stocks" element={
                <RoleGuard allowedRoles={[
                  ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR,
                  ROLES.PHARMACY_STAFF, ROLES.STOREKEEPER,
                  ROLES.SENIOR_MEDICAL_STAFF
                ]}>
                  <MedicineStock />
                </RoleGuard>
              } />
              <Route path="sales" element={
                <RoleGuard allowedRoles={[
                  ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR,
                  ROLES.BILLING_STAFF, ROLES.PHARMACY_STAFF
                ]}>
                  <PharmacySales />
                </RoleGuard>
              } />
              <Route path="returns" element={
                <RoleGuard allowedRoles={[
                  ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR,
                  ROLES.BILLING_STAFF, ROLES.PHARMACY_STAFF,
                  ROLES.MEDICAL_STAFF, ROLES.SENIOR_MEDICAL_STAFF
                ]}>
                  <MedicineReturns />
                </RoleGuard>
              } />
              <Route path="users" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                  <UserManagement />
                </RoleGuard>
              } />
              
              <Route path="credit-bills" element={<MedicineCreditBills />} />
              <Route path="credit-returns" element={<MedicineCreditReturns />} />
              <Route path="direct-sales" element={<DirectPharmacySales />} />
              <Route path="direct-returns" element={<DirectMedicineReturns />} />
              <Route path="return-worklists" element={<ReturnWorklists />} />
              <Route path="dispense-worklists" element={<DispenseWorklists />} />
              <Route path="advances" element={<PharmacyAdvances />} />
              <Route path="consolidated-bills" element={<ConsolidatedBills />} />
              <Route path="clearance" element={<PharmacyClearance />} />
              <Route path="pending-prescriptions" element={<PendingPrescriptions />} />
              <Route path="pending-replacement" element={<PendingPharmacyReplacement />} />
              <Route path="pending-replacement-returns" element={<PendingReplacementReturns />} />
              <Route path="performance" element={<ProductSalesPerformance />} />
              <Route path="pending-indents" element={<PendingIndentPrescriptions />} />
              
              <Route path="suppliers" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.STOREKEEPER]}>
                  <Suppliers />
                </RoleGuard>
              } />
              <Route path="patients" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF, ROLES.RECEPTIONIST]}>
                  <Patients />
                </RoleGuard>
              } />
              <Route path="reports" element={
                <RoleGuard allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR]}>
                  <Reports />
                </RoleGuard>
              } />
            </Route>

            {/* Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
