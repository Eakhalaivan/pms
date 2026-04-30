// Role definitions and configurations

export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  SENIOR_MEDICAL_STAFF: 'SENIOR_MEDICAL_STAFF',
  MEDICAL_STAFF: 'MEDICAL_STAFF',
  BILLING_STAFF: 'BILLING_STAFF',
  PHARMACY_STAFF: 'PHARMACY_STAFF',
  RECEPTIONIST: 'RECEPTIONIST',
  AUDIT_COMPLIANCE: 'AUDIT_COMPLIANCE',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  STOREKEEPER: 'STOREKEEPER'
};

export const ROLE_LABELS = {
  [ROLES.SYSTEM_ADMIN]: 'System Admin',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.SENIOR_MEDICAL_STAFF]: 'Senior Medical Staff',
  [ROLES.MEDICAL_STAFF]: 'Medical Staff',
  [ROLES.BILLING_STAFF]: 'Billing Staff',
  [ROLES.PHARMACY_STAFF]: 'Pharmacy Staff',
  [ROLES.RECEPTIONIST]: 'Receptionist',
  [ROLES.AUDIT_COMPLIANCE]: 'Audit & Compliance',
  [ROLES.LAB_TECHNICIAN]: 'Lab Technician',
  [ROLES.STOREKEEPER]: 'Storekeeper'
};

export const ROLE_COLORS = {
  [ROLES.SYSTEM_ADMIN]: 'bg-slate-800 text-slate-100 border-slate-700', // Dark Navy
  [ROLES.SUPERVISOR]: 'bg-purple-100 text-purple-700 border-purple-200', // Purple
  [ROLES.SENIOR_MEDICAL_STAFF]: 'bg-teal-100 text-teal-700 border-teal-200', // Teal
  [ROLES.MEDICAL_STAFF]: 'bg-emerald-100 text-emerald-700 border-emerald-200', // Green
  [ROLES.BILLING_STAFF]: 'bg-amber-100 text-amber-700 border-amber-200', // Amber
  [ROLES.PHARMACY_STAFF]: 'bg-blue-100 text-blue-700 border-blue-200', // Blue
  [ROLES.RECEPTIONIST]: 'bg-rose-100 text-rose-700 border-rose-200', // Pink/Rose
  [ROLES.AUDIT_COMPLIANCE]: 'bg-orange-100 text-orange-700 border-orange-200', // Orange
  [ROLES.LAB_TECHNICIAN]: 'bg-cyan-100 text-cyan-700 border-cyan-200', // Cyan
  [ROLES.STOREKEEPER]: 'bg-stone-200 text-stone-700 border-stone-300' // Brown/Warm Gray
};

export const DASHBOARD_ROUTES = {
  [ROLES.SYSTEM_ADMIN]: '/dashboard/admin',
  [ROLES.SUPERVISOR]: '/dashboard/supervisor',
  [ROLES.SENIOR_MEDICAL_STAFF]: '/dashboard/senior-medical',
  [ROLES.MEDICAL_STAFF]: '/dashboard/medical',
  [ROLES.BILLING_STAFF]: '/dashboard/billing',
  [ROLES.PHARMACY_STAFF]: '/dashboard/pharmacy',
  [ROLES.RECEPTIONIST]: '/dashboard/reception',
  [ROLES.AUDIT_COMPLIANCE]: '/dashboard/audit',
  [ROLES.LAB_TECHNICIAN]: '/dashboard/lab',
  [ROLES.STOREKEEPER]: '/dashboard/store',
  // Legacy keys (safety net)
  'ADMIN':               '/dashboard/admin',
  'MEDICINE_USER':       '/dashboard/pharmacy',
  'BILLING_USER':        '/dashboard/billing',
};

export const MODULE_PERMISSIONS = {
  CLINICAL: [
    { id: 'PRESCRIPTIONS', label: 'Manage Prescriptions' },
    { id: 'CLINICAL_RECORDS', label: 'View Clinical Records' },
    { id: 'BASIC_PRESCRIPTIONS', label: 'Basic Prescriptions' }
  ],
  BILLING: [
    { id: 'BILLING', label: 'Process Billing' },
    { id: 'INVOICES', label: 'Manage Invoices' },
    { id: 'ADVANCES', label: 'Process Advances' },
    { id: 'CLEARANCE', label: 'Clearance Processing' }
  ],
  INVENTORY: [
    { id: 'INVENTORY', label: 'Manage Inventory' },
    { id: 'INDENT', label: 'Process Indents' },
    { id: 'RETURNS', label: 'Process Returns' },
    { id: 'STOCK_MANAGEMENT', label: 'Stock Management' },
    { id: 'PURCHASE_ORDERS', label: 'Purchase Orders' }
  ],
  REPORTS: [
    { id: 'VIEW_REPORTS', label: 'View Reports' },
    { id: 'VIEW_LOGS', label: 'View Logs' },
    { id: 'REPORTS', label: 'Manage Reports' }
  ],
  ADMINISTRATION: [
    { id: 'ALL', label: 'Full System Access' },
    { id: 'APPROVALS', label: 'Manage Approvals' },
    { id: 'PATIENT_REGISTRATION', label: 'Patient Registration' },
    { id: 'UHID', label: 'UHID Creation' }
  ]
};

export const getRoleColor = (roleName) => {
  if (!roleName) return 'bg-gray-100 text-gray-700 border-gray-200';
  const normalized = roleName.replace(/ /g, '_').toUpperCase();
  return ROLE_COLORS[normalized] || ROLE_COLORS[roleName] || 'bg-gray-100 text-gray-700 border-gray-200';
};
