import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/layout/MainLayout';
import PharmacyDashboard from './pages/PharmacyDashboard';
import PharmacySales from './pages/PharmacySales';
import MedicineReturns from './pages/MedicineReturns';
import PharmacyAdminDashboard from './pages/PharmacyAdminDashboard';
import MedicineCreditBills from './pages/MedicineCreditBills';
import MedicineCreditReturns from './pages/MedicineCreditReturns';
import DirectPharmacySales from './pages/DirectPharmacySales';
import DirectMedicineReturns from './pages/DirectMedicineReturns';
import ReturnWorklists from './pages/ReturnWorklists';
import DispenseWorklists from './pages/DispenseWorklists';
import PharmacyAdvances from './pages/PharmacyAdvances';
import ConsolidatedBills from './pages/ConsolidatedBills';
import PharmacyClearance from './pages/PharmacyClearance';
import PendingPrescriptions from './pages/PendingPrescriptions';
import PendingPharmacyReplacement from './pages/PendingPharmacyReplacement';
import PendingReplacementReturns from './pages/PendingReplacementReturns';
import ProductSalesPerformance from './pages/ProductSalesPerformance';
import PendingIndentPrescriptions from './pages/PendingIndentPrescriptions';
import MedicineMaster from './pages/MedicineMaster';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Main app shell */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PharmacyDashboard />} />
            <Route path="medicines" element={<MedicineMaster />} />
            <Route path="sales" element={<PharmacySales />} />
            <Route path="returns" element={<MedicineReturns />} />
            <Route path="credit-bills" element={<MedicineCreditBills />} />
            <Route path="admin" element={<PharmacyAdminDashboard />} />
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
          </Route>

          {/* Redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
