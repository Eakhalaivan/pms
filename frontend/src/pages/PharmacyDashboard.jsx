import React, { useState } from 'react';
import { IndianRupee, RotateCcw, Stethoscope, AlertTriangle, Eye, Printer } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import KPICard from '../components/ui/KPICard';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import AppModal from '../components/ui/AppModal';
import PharmacyInvoice from '../components/pharmacy/PharmacyInvoice';
import pharmacyService from '../utils/pharmacyService';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#1e3a8a'];

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-8 w-64 bg-slate-200 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
      <div className="lg:col-span-6 h-[400px] bg-slate-200 rounded-2xl"></div>
      <div className="lg:col-span-4 h-[400px] bg-slate-200 rounded-2xl"></div>
    </div>
  </div>
);

export default function PharmacyDashboard() {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['pharmacy-stats'],
    queryFn: async () => {
      const res = await pharmacyService.getDashboardStats();
      return res?.data || { todaySales: 0, todayReturns: 0, lowStockCount: 0, lowStockMedicines: [] };
    }
  });

  const { data: recentBills, isLoading: activitiesLoading } = useQuery({
    queryKey: ['pharmacy-recent-bills'],
    queryFn: async () => {
      const res = await pharmacyService.getRecentActivities();
      if (res?.success) {
        return res.data
          .sort((a, b) => new Date(b.billingDate) - new Date(a.billingDate))
          .slice(0, 5);
      }
      return [];
    }
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['pharmacy-charts'],
    queryFn: async () => {
      const res = await pharmacyService.getChartData();
      return res?.data || { salesReturns: [], categories: [] };
    }
  });

  if (statsLoading || activitiesLoading || chartLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pharmacy Dashboard</h2>
        <p className="text-sm text-gray-500 font-medium">Daily operations and financial overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Today's Sales Amount" 
          value={`₹ ${stats?.todaySales?.toLocaleString() || '0.00'}`} 
          icon={IndianRupee} 
          trend="up" 
          subtext="+12.5% from yesterday"
          className="border-l-4 border-l-success"
        />
        <KPICard 
          title="Today's Returns Amount" 
          value={`₹ ${stats?.todayReturns?.toLocaleString() || '0.00'}`} 
          icon={RotateCcw} 
          trend="down" 
          subtext="-5% from yesterday"
          className="border-l-4 border-l-danger"
        />
        <KPICard 
          title="Pending Prescriptions" 
          value="48" 
          icon={Stethoscope} 
          className="border-l-4 border-l-primary"
        />
        <KPICard 
          title="Low Stock Medicines" 
          value={stats?.lowStockCount?.toString() || '0'} 
          icon={AlertTriangle} 
          className="border-l-4 border-l-warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-6">Sales vs Returns (Last 7 Days)</h3>
          <div className="h-[350px] w-full mt-4 min-w-0">
            <ResponsiveContainer width="100%" height={300} minWidth={100}>
              <AreaChart data={chartData?.salesReturns}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Sales" />
                <Area type="monotone" dataKey="returns" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorReturns)" name="Returns" />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-6">Sales by Category</h3>
          <div className="h-[350px] w-full mt-4 min-w-0">
            <ResponsiveContainer width="100%" height={300} minWidth={100}>
              <PieChart>
                <Pie
                  data={chartData?.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData?.categories?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-gray-800">Recent Bills</h3>
            <button className="text-primary text-xs font-bold hover:underline">View All</button>
          </div>
          <DataTable 
            data={recentBills || []}
            columns={[
              { header: 'Bill No', accessor: 'billNumber' },
              { header: 'Patient Name', accessor: 'patientName' },
              { header: 'Amount', render: (row) => `₹ ${(row.netAmount || 0).toLocaleString()}` },
              { header: 'Status', render: (row) => (
                <Badge variant={row.status === 'PAID' || row.status === 'Completed' ? 'success' : 'warning'}>{row.status}</Badge>
              )},
              { header: 'Action', render: (row) => (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setSelectedInvoice(row); setIsInvoiceModalOpen(true); }}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { setSelectedInvoice(row); setIsInvoiceModalOpen(true); }}
                    className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              )}
            ]}
          />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-gray-800">Low Stock Alerts</h3>
            <button className="text-danger text-xs font-bold hover:underline">View All Alerts</button>
          </div>
          <DataTable 
            data={stats?.lowStockMedicines || []}
            columns={[
              { header: 'Medicine Name', render: (row) => row.medicine?.name },
              { header: 'Batch', accessor: 'batchNumber' },
              { header: 'Available', render: (row) => (
                <span className="font-bold text-red-600">{row.quantityAvailable}</span>
              )},
              { header: 'Unit', render: (row) => row.medicine?.unit },
              { header: 'Action', render: () => (
                <button className="text-[10px] font-bold uppercase tracking-wider bg-indigo-900 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-800 transition-all">
                  Reorder
                </button>
              )}
            ]}
          />
        </div>
      </div>

      {/* Invoice Print Modal */}
      <AppModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        maxWidth="sm:max-w-4xl"
        padding={false}
      >
        <PharmacyInvoice 
          bill={selectedInvoice} 
          onClose={() => setIsInvoiceModalOpen(false)} 
        />
      </AppModal>
    </div>
  );
}
