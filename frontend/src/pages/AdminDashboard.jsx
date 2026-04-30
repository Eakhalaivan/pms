import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Pill, 
  Receipt, 
  AlertTriangle, 
  FileText, 
  Users, 
  Clock, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Activity,
  ShoppingBag,
  UserCheck
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import QuickOrderModal from '../components/pharmacy/QuickOrderModal';
import StaffActivityDrawer from '../components/pharmacy/StaffActivityDrawer';

const fetchDashboard    = () => api.get('/pharmacy/dashboard').then(r => r.data.data);
const fetchLowStock     = () => api.get('/pharmacy/dashboard/low-stock').then(r => r.data.data);
const fetchStaff        = () => api.get('/pharmacy/dashboard/staff-on-duty').then(r => r.data.data);
const fetchActivities   = () => api.get('/pharmacy/dashboard/recent-activities').then(r => r.data.data);

// --- COMPONENTS ---

const KPICard = ({ data }) => {
  const { label, value, trend, trendType, icon: Icon, color, bgColor } = data;
  
  return (
    <div className="bg-white border border-[#E2E6F0] rounded-[12px] p-4 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.04)]">
      {/* Accent color bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }}></div>
      
      <div className="flex justify-between items-start mb-2">
        <span className="text-[13px] font-medium text-[#6B7280]">{label}</span>
        <div className={cn("p-2 rounded-lg transition-colors", bgColor)}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      
      <div className="mt-1">
        <h3 className="text-2xl font-bold text-[#1E2A5E] tracking-tight">{value}</h3>
        <div className={cn(
          "mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
          trendType === 'positive' ? "bg-teal-50 text-[#0F6E56]" : 
          trendType === 'critical' ? "bg-red-50 text-[#A32D2D]" : 
          "bg-slate-100 text-slate-500"
        )}>
          {trendType === 'positive' && <TrendingUp size={10} className="mr-1" />}
          {trendType === 'critical' && <Activity size={10} className="mr-1" />}
          {trend}
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  const { data: stats,      isLoading: l1 } = useQuery({ queryKey: ['dashboard-stats'],    queryFn: fetchDashboard,  staleTime: 30000 });
  const { data: lowStock,   isLoading: l2 } = useQuery({ queryKey: ['dashboard-lowstock'], queryFn: fetchLowStock,   staleTime: 60000 });
  const { data: staff,      isLoading: l3 } = useQuery({ queryKey: ['dashboard-staff'],    queryFn: fetchStaff,      staleTime: 60000 });
  const { data: activities, isLoading: l4 } = useQuery({ queryKey: ['dashboard-activity'], queryFn: fetchActivities, staleTime: 15000 });

  const [orderModal, setOrderModal] = useState({ open: false, medicine: null });
  const [activityDrawer, setActivityDrawer] = useState({ open: false, staff: null });
  const [orderedItems, setOrderedItems] = useState(new Set());

  if (l1 || l2 || l3 || l4) return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="h-8 w-64 bg-slate-200 rounded mb-8" />
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-white border border-slate-100 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-96 bg-white border border-slate-100 rounded-xl" />
        <div className="h-96 bg-white border border-slate-100 rounded-xl" />
      </div>
    </div>
  );

  const kpiCards = [
    { 
      label: "Today's Sales", 
      value: stats ? `₹${Number(stats.todaySales).toLocaleString('en-IN')}` : '—', 
      trend: "+12% vs yesterday", 
      trendType: "positive",
      icon: Pill, 
      color: "#0F6E56", 
      bgColor: "bg-teal-50/50" 
    },
    { 
      label: "Pending Prescriptions", 
      value: stats?.pendingPrescriptions ?? '—', 
      trend: "Action required", 
      trendType: "positive",
      icon: Receipt, 
      color: "#185FA5", 
      bgColor: "bg-blue-50/50" 
    },
    { 
      label: "Low Stock Alerts", 
      value: stats?.lowStockAlerts ?? '—', 
      trend: "Critical", 
      trendType: "critical",
      icon: AlertTriangle, 
      color: "#A32D2D", 
      bgColor: "bg-red-50/50" 
    },
    { 
      label: "Bills Generated Today", 
      value: stats?.billsToday ?? '—', 
      trend: "Updated", 
      trendType: "positive",
      icon: FileText, 
      color: "#BA7517", 
      bgColor: "bg-amber-50/50" 
    },
    { 
      label: "Active Staff", 
      value: stats?.activeStaff ?? '—', 
      trend: "On shift", 
      trendType: "neutral",
      icon: Users, 
      color: "#534AB7", 
      bgColor: "bg-purple-50/50" 
    },
  ];

  const moduleStats = [
    { name: "Pharmacy Sales", count: `${stats?.billsToday ?? 0} bills`, path: "/sales" },
    { name: "Medicine Returns", count: `${stats?.pendingReturns ?? 0} pending`, path: "/returns" },
    { name: "Direct Pharmacy Sales", count: `${stats?.directSalesCount ?? 0}`, path: "/direct-sales" },
    { name: "Dispense Worklists", count: "View", path: "/dispense-worklists" },
    { name: "Pending Prescriptions", count: `${stats?.pendingPrescriptions ?? 0}`, path: "/pending-prescriptions" },
    { name: "Medicine Credit Bills", count: `${stats?.creditBillsOpen ?? 0} open`, path: "/credit-bills" },
  ];

  const handleOrderNow = (medicine) => {
    setOrderModal({ open: true, medicine });
  };

  const handleViewActivity = (staffMember) => {
    setActivityDrawer({ open: true, staff: staffMember });
  };

  const handleOrderSuccess = (medicineName) => {
    setOrderedItems(prev => new Set([...prev, medicineName]));
  };

  return (
    <div className="min-h-full bg-[#F0F2FA] p-6 animate-in fade-in duration-500">
      
      {/* 1. TOP GREETING BAR */}
      <div className="mb-8 border-b border-slate-200/60 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#1E2A5E]">
            Good Morning, <span className="font-bold">System Admin</span>
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 font-medium">
            Welcome back! Here's what's happening in your pharmacy today.
          </p>
        </div>
        <div className="flex items-center text-[13px] font-semibold text-[#1E2A5E]/70 bg-white/50 px-4 py-2 rounded-full border border-white">
          <Clock size={14} className="mr-2 text-[#1E2A5E]/40" />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          <span className="mx-3 h-3 w-[1px] bg-slate-300"></span>
          Main Branch
        </div>
      </div>

      {/* 2. KPI SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        {kpiCards.map((kpi, idx) => (
          <KPICard key={idx} data={kpi} />
        ))}
      </div>

      {/* 3. TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* LEFT — Today's Activity Timeline (60%) */}
        <div className="lg:col-span-7 bg-white rounded-[12px] border border-[#E2E6F0] flex flex-col h-full overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#1E2A5E] flex items-center gap-2">
              <Activity size={16} className="text-[#534AB7]" />
              Today's Activity Timeline
            </h2>
            <button className="text-[11px] font-bold text-[#534AB7] hover:underline uppercase tracking-wider">Real-time</button>
          </div>
          
          <div className="p-6 flex-1 relative">
            <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-slate-100"></div>
            
            <div className="space-y-8 relative">
              {activities?.map((item, idx) => (
                <div key={idx} className="flex gap-4 group cursor-default">
                  <div className="w-6 shrink-0 relative z-10 flex flex-col items-center">
                    <div className={cn(
                      "w-3 h-3 rounded-full mt-1.5 ring-4 ring-white transition-transform group-hover:scale-125 shadow-sm",
                      item.category === 'billing' ? "bg-[#BA7517]" :
                      item.category === 'stock' ? "bg-[#A32D2D]" :
                      item.category === 'medical' ? "bg-[#185FA5]" :
                      item.category === 'return' ? "bg-[#0F6E56]" :
                      "bg-[#534AB7]"
                    )}></div>
                  </div>
                  
                  <div className="flex-1 transition-all duration-200 p-3 -m-3 rounded-xl hover:bg-slate-50/80">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11px] font-bold text-[#6B7280]">{item.time}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200/50">
                        {item.actor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1E2A5E]">{item.event}</span>
                      {item.detail && (
                        <span className="text-sm font-bold text-[#0F6E56]">— {item.detail}</span>
                      )}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-10 text-slate-400 text-sm">No recent activities</div>
              )}
            </div>
          </div>
          
          <button onClick={() => navigate('/activity-log')} className="w-full py-3.5 border-t border-slate-100 text-[12px] font-bold text-[#1E2A5E] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            View Full Activity Log
            <ChevronRight size={14} />
          </button>
        </div>

        {/* RIGHT — Module Quick Stats (40%) */}
        <div className="lg:col-span-5 bg-white rounded-[12px] border border-[#E2E6F0] flex flex-col h-full shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-[#1E2A5E]">Module Quick Stats</h2>
          </div>
          
          <div className="p-2 flex-1 flex flex-col divide-y divide-slate-50">
            {moduleStats.map((module, idx) => (
              <button 
                key={idx}
                onClick={() => navigate(module.path)}
                className="flex items-center justify-between p-3.5 hover:bg-[#F0F2FA]/50 transition-all rounded-lg group"
              >
                <span className="text-[13px] font-medium text-[#1E2A5E] group-hover:text-[#534AB7] transition-colors">{module.name}</span>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[11px] font-bold px-2.5 py-1 rounded-full min-w-[70px] text-center",
                    module.count.includes('pending') || module.count.includes('open') ? "bg-amber-50 text-[#BA7517]" : "bg-blue-50 text-[#185FA5]"
                  )}>
                    {module.count}
                  </span>
                  <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 4. BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT — Low Stock Alerts Table */}
        <div className="bg-white rounded-[12px] border border-[#E2E6F0] shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-[#1E2A5E]">Low Stock Alerts</h2>
              {stats?.lowStockAlerts > 0 && (
                <span className="bg-red-50 text-[#A32D2D] text-[10px] font-black px-2 py-0.5 rounded-full border border-red-100">
                  {stats.lowStockAlerts} CRITICAL
                </span>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Medicine Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Stock / Reorder</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lowStock?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="text-[13px] font-bold text-[#1E2A5E]">{item.medicineName}</div>
                      <div className="text-[11px] text-[#6B7280] font-medium">{item.category}</div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="text-[13px] font-bold text-[#1E2A5E]">{item.currentStock} {item.unit}</div>
                      <div className="text-[10px] text-[#6B7280] font-medium">Req: {item.reorderLevel}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right relative">
                      <div className="group-hover:opacity-0 transition-opacity">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full inline-block",
                          item.status === 'CRITICAL' ? "bg-red-50 text-[#A32D2D]" : "bg-amber-50 text-[#BA7517]"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleOrderNow(item)}
                        disabled={orderedItems.has(item.medicineName)}
                        className={cn(
                          "absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg shadow-navy-200",
                          orderedItems.has(item.medicineName) 
                            ? "bg-green-600 text-white" 
                            : "bg-[#1E2A5E] text-white hover:bg-[#1E2A5E]/90"
                        )}
                      >
                        {orderedItems.has(item.medicineName) ? (
                          <>Order Placed ✓</>
                        ) : (
                          <>
                            <ShoppingBag size={12} />
                            Order Now
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                )) || (
                  <tr><td colSpan="3" className="px-5 py-10 text-center text-slate-400 text-sm">No low stock items</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <button onClick={() => navigate('/stocks')} className="w-full py-3.5 border-t border-slate-100 text-[12px] font-bold text-[#1E2A5E] hover:bg-slate-50 transition-colors">
            View All Stock Alerts
          </button>
        </div>

        {/* RIGHT — Staff On Duty Now */}
        <div className="bg-white rounded-[12px] border border-[#E2E6F0] shadow-sm flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-[#1E2A5E]">Staff On Duty Now</h2>
          </div>
          
          <div className="p-5 space-y-4">
            {staff?.map((staffMember, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-[12px] border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all group relative">
                <div 
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-bold relative shadow-sm"
                  style={{ backgroundColor: staffMember.color }}
                >
                  {staffMember.id}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-bold text-[#1E2A5E]">{staffMember.name}</span>
                    <span className="text-[11px] font-bold text-[#6B7280]">{staffMember.since}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#6B7280] bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                    {staffMember.role}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleViewActivity(staffMember)}
                  className="opacity-0 group-hover:opacity-100 transition-all text-[#534AB7] text-[11px] font-bold flex items-center gap-1 hover:underline"
                >
                  <UserCheck size={12} />
                  View Activity
                </button>
              </div>
            )) || (
              <div className="text-center py-10 text-slate-400 text-sm">No staff on duty</div>
            )}
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#6B7280] px-1">
              <span>Current Shift: {staff?.[0]?.shift || 'Morning'}</span>
              <span className="text-[#0F6E56]">{staff?.length > 0 ? 'Active' : 'No Active Staff'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODALS & DRAWERS */}
      <QuickOrderModal 
        isOpen={orderModal.open}
        onClose={() => setOrderModal({ ...orderModal, open: false })}
        medicine={orderModal.medicine}
        onSuccess={handleOrderSuccess}
      />

      <StaffActivityDrawer 
        isOpen={activityDrawer.open}
        onClose={() => setActivityDrawer({ ...activityDrawer, open: false })}
        staff={activityDrawer.staff}
      />
    </div>
  );
}
