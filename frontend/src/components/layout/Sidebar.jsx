import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
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
  LogOut
} from 'lucide-react';

const allNavItems = [
  { name: 'Pharmacy Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Medicine Master', path: '/medicines', icon: Pill, roles: ['ADMIN', 'MEDICINE_USER'] },
  { name: 'Pharmacy Sales', path: '/sales', icon: ShoppingCart, roles: ['ADMIN', 'BILLING_USER'] },
  { name: 'Medicine Returns', path: '/returns', icon: RotateCcw, roles: ['ADMIN'] },
  { name: 'Medicine Credit Bills', path: '/credit-bills', icon: CreditCard, roles: ['ADMIN', 'BILLING_USER'] },
  { name: 'Direct Pharmacy Sales', path: '/direct-sales', icon: Store, roles: ['ADMIN', 'BILLING_USER'] },
  { name: 'Direct Medicine Returns', path: '/direct-returns', icon: Undo2, roles: ['ADMIN'] },
  { name: 'Return Worklists', path: '/return-worklists', icon: ClipboardList, roles: ['ADMIN'] },
  { name: 'Dispense Worklists', path: '/dispense-worklists', icon: Syringe, roles: ['ADMIN'] },
  { name: 'Pending Prescriptions', path: '/pending-prescriptions', icon: Stethoscope, roles: ['ADMIN'] },
  { name: 'Pending Indent Pres.', path: '/pending-indents', icon: ListTodo, roles: ['ADMIN'] },
  { name: 'Pending Pharmacy Rep.', path: '/pending-replacement', icon: RefreshCw, roles: ['ADMIN'] },
  { name: 'Pending Rep. Returns', path: '/pending-replacement-returns', icon: Box, roles: ['ADMIN'] },
  { name: 'Consolidated Bills', path: '/consolidated-bills', icon: Receipt, roles: ['ADMIN', 'BILLING_USER'] },
  { name: 'Pharmacy Advances', path: '/advances', icon: Banknote, roles: ['ADMIN'] },
  { name: 'Pharmacy Clearance', path: '/clearance', icon: FileCheck, roles: ['ADMIN'] },
  { name: 'Medicine Credit Returns', path: '/credit-returns', icon: ArrowLeftRight, roles: ['ADMIN'] },
  { name: 'Product Sales Perf.', path: '/performance', icon: BarChart3, roles: ['ADMIN'] },
  { name: 'Pharmacy Admin Dash', path: '/admin', icon: Settings, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = allNavItems.filter(item => {
    if (!item.roles) return true; // accessible by everyone (e.g. dashboard)
    return item.roles.includes(user?.role);
  });

  return (
    <aside className="fixed top-0 left-0 h-screen w-72 bg-sidebarBg text-white flex flex-col shadow-2xl z-20">
      <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
        <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">PharmaDesk</h1>
          <p className="text-[10px] text-blue-200 uppercase font-bold tracking-widest">DRHMS INTEGRATED</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <p className="px-3 text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-4 opacity-50">Main Modules</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
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
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/10">
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            {user?.name?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">{user?.name || 'Unknown User'}</p>
            <p className="text-[10px] text-blue-300/80 truncate uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
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
