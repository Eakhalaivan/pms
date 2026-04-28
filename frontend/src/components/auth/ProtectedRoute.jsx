import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

// Define explicit path permissions based on roles.
const rolePermissions = {
  ADMIN: null, // null means access to everything
  MEDICINE_USER: ['/', '/medicines'],
  BILLING_USER: ['/', '/sales', '/direct-sales', '/credit-bills', '/consolidated-bills']
};

// Map paths to descriptive module names for the error message
const moduleNames = {
  '/': 'Pharmacy Dashboard',
  '/medicines': 'Medicine Master',
  '/sales': 'Pharmacy Sales',
  '/returns': 'Medicine Returns',
  '/credit-bills': 'Medicine Credit Bills',
  '/direct-sales': 'Direct Pharmacy Sales',
  '/direct-returns': 'Direct Medicine Returns',
  '/return-worklists': 'Return Worklists',
  '/dispense-worklists': 'Dispense Worklists',
  '/pending-prescriptions': 'Pending Prescriptions',
  '/pending-indents': 'Pending Indent Prescriptions',
  '/pending-replacement': 'Pending Pharmacy Replacement',
  '/pending-replacement-returns': 'Pending Replacement Returns',
  '/consolidated-bills': 'Consolidated Bills',
  '/advances': 'Pharmacy Advances',
  '/clearance': 'Pharmacy Clearance',
  '/credit-returns': 'Medicine Credit Returns',
  '/performance': 'Product Sales Performance',
  '/admin': 'Pharmacy Admin Dashboard'
};

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-background">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role;
  
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  const allowedPaths = rolePermissions[userRole];
  
  // ADMIN has full access (allowedPaths is null)
  if (allowedPaths !== null) {
    // If not admin, check if current path starts with any allowed path
    const hasAccess = allowedPaths.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`));
    
    if (!hasAccess) {
      const moduleName = moduleNames[location.pathname] || 'this module';
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] bg-background text-white p-8">
          <AlertTriangle className="w-24 h-24 text-red-500 mb-6" />
          <h2 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h2>
          <p className="text-lg text-blue-100 text-center max-w-lg mb-8">
            Access Denied: You do not have permission to access {moduleName}. Please contact your administrator.
          </p>
        </div>
      );
    }
  }

  return children;
}
