import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { ROLES, getRoleColor, ROLE_LABELS, DASHBOARD_ROUTES } from '../../config/roles.config';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Building2, 
  ShoppingCart, 
  RotateCcw, 
  LayoutDashboard, 
  CreditCard,
  Settings,
  ArrowLeftRight,
  ClipboardList,
  Store,
  Undo2,
  Syringe,
  Banknote,
  Receipt,
  FileCheck,
  Stethoscope,
  RefreshCw,
  Box,
  BarChart3,
  ListTodo,
  Pill,
  LogOut,
  ChevronDown,
  Truck,
  Users,
  FileText
} from 'lucide-react';

const allNavItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Medicine Master', path: '/medicines', icon: Pill, roles: [ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF] },
  { name: 'Stock Management', path: '/stocks', icon: Box, roles: [ROLES.SYSTEM_ADMIN, ROLES.STOREKEEPER] },
  { name: 'Pharmacy Sales', path: '/sales', icon: ShoppingCart, roles: [ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF] },
  { name: 'Medicine Returns', path: '/returns', icon: RotateCcw, roles: [ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF] },
  { name: 'Medicine Credit Bills', path: '/credit-bills', icon: CreditCard, roles: [ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF] },
  { name: 'Direct Pharmacy Sales', path: '/direct-sales', icon: Store, roles: [ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF] },
  { name: 'Direct Medicine Returns', path: '/direct-returns', icon: Undo2, roles: [ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF] },
  { name: 'Return Worklists', path: '/return-worklists', icon: ClipboardList, roles: [ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR] },
  { name: 'Dispense Worklists', path: '/dispense-worklists', icon: Syringe, roles: [ROLES.SYSTEM_ADMIN, ROLES.MEDICAL_STAFF, ROLES.SENIOR_MEDICAL_STAFF] },
  { name: 'Pending Prescriptions', path: '/pending-prescriptions', icon: Stethoscope, roles: [ROLES.SYSTEM_ADMIN, ROLES.MEDICAL_STAFF, ROLES.SENIOR_MEDICAL_STAFF] },
  { name: 'Pending Indent Pres.', path: '/pending-indents', icon: ListTodo, roles: [ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF] },
  { name: 'Pending Pharmacy Rep.', path: '/pending-replacement', icon: RefreshCw, roles: [ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF] },
  { name: 'Pending Rep. Returns', path: '/pending-replacement-returns', icon: Box, roles: [ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF] },
  { name: 'Consolidated Bills', path: '/consolidated-bills', icon: Receipt, roles: [ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF] },
  { name: 'Pharmacy Advances', path: '/advances', icon: Banknote, roles: [ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF] },
  { name: 'Pharmacy Clearance', path: '/clearance', icon: FileCheck, roles: [ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF] },
  { name: 'Medicine Credit Returns', path: '/credit-returns', icon: ArrowLeftRight, roles: [ROLES.SYSTEM_ADMIN, ROLES.PHARMACY_STAFF] },
  { name: 'Product Sales Perf.', path: '/performance', icon: BarChart3, roles: [ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR, ROLES.AUDIT_COMPLIANCE] },
  { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: [ROLES.SYSTEM_ADMIN, ROLES.STOREKEEPER] },
  { name: 'Patients', path: '/patients', icon: Users, roles: [ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF, ROLES.RECEPTIONIST] },
  { name: 'Reports', path: '/reports', icon: FileText, roles: [ROLES.SYSTEM_ADMIN, ROLES.SUPERVISOR] },
  { name: 'User Management', path: '/users', icon: Settings, roles: [ROLES.SYSTEM_ADMIN] },
];

export default function Sidebar() {
  const { user, roles, activeRole, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Use activeRole for current context, fallback to first role
  const currentRole = activeRole || roles?.[0] || '';

  const navItems = allNavItems.filter(item => {
    if (!item.roles) return true; // accessible by everyone (e.g. dashboard)
    return (
      item.roles.includes(currentRole) ||     // matches active role
      item.roles.includes('ALL') ||           // visible to everyone
      roles.some(r => item.roles.includes(r)) // matches any assigned role
    );
  });

  const getDashboardPath = () => {
    return DASHBOARD_ROUTES[activeRole] || '/dashboard/pharmacy';
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-72 bg-sidebarBg text-white flex flex-col shadow-2xl z-20">
      <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3 shrink-0">
        <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">PharmaDesk</h1>
          <p className="text-[10px] text-blue-200 uppercase font-bold tracking-widest">DRHMS INTEGRATED</p>
        </div>
      </div>
      
      {/* Role Switcher */}
      {user?.roles?.length > 1 && (
        <div className="px-4 py-3 border-b border-white/5 relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
          >
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">Active Role</span>
              <span className="text-sm font-medium text-white truncate w-full text-left">{ROLE_LABELS[activeRole] || activeRole || 'Staff'}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-blue-300 transition-transform", isRoleDropdownOpen ? "rotate-180" : "")} />
          </button>
          
          <AnimatePresence>
            {isRoleDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-4 right-4 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden"
              >
                {user.roles.map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      switchRole(role);
                      setIsRoleDropdownOpen(false);
                      navigate(DASHBOARD_ROUTES[role] || '/');
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors",
                      activeRole === role ? "bg-primary text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {ROLE_LABELS[role] || role}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">
        <p className="px-3 text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-4 opacity-50">Main Modules</p>
        {navItems.map((item) => {
          const path = item.path === '/' ? getDashboardPath() : item.path;
          const isActive = location.pathname === path || (item.path === '/' && location.pathname.startsWith('/dashboard'));
          
          return (
            <NavLink
              key={item.path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
                isActive 
                  ? "bg-primary text-white shadow-xl shadow-primary/30 translate-x-1" 
                  : "text-blue-100/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-transform duration-300",
                "group-hover:scale-110"
              )} />
              <span className="truncate">
                {item.path === '/' ? `${ROLE_LABELS[activeRole] || 'System'} Dashboard` : item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/10">
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            {user?.name?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">{user?.name || 'Unknown User'}</p>
            <p className="text-[10px] text-blue-300/80 truncate uppercase tracking-wider">{ROLE_LABELS[activeRole] || activeRole || 'Staff'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
