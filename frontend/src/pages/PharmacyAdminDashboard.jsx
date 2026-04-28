import React, { useEffect, useState } from 'react';
import { TrendingUp, RotateCcw, IndianRupee, Package, AlertTriangle, Users } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ComposedChart, Line
} from 'recharts';
import KPICard from '../components/ui/KPICard';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import pharmacyService from '../utils/pharmacyService';
import { toast } from 'react-hot-toast';

const monthlyTrend = [
  { mon: 'Jan', sales: 45000, revenue: 38000 },
  { mon: 'Feb', sales: 52000, revenue: 44000 },
  { mon: 'Mar', sales: 48000, revenue: 41000 },
  { mon: 'Apr', sales: 61000, revenue: 53000 },
  { mon: 'May', sales: 55000, revenue: 47000 },
  { mon: 'Jun', sales: 67000, revenue: 58000 },
  { mon: 'Jul', sales: 72000, revenue: 63000 },
  { mon: 'Aug', sales: 59000, revenue: 51000 },
  { mon: 'Sep', sales: 63000, revenue: 55000 },
  { mon: 'Oct', sales: 81000, revenue: 71000 },
  { mon: 'Nov', sales: 75000, revenue: 66000 },
  { mon: 'Dec', sales: 92000, revenue: 81000 },
];

const topMedicines = [
  { name: 'Amoxicillin', qty: 1205 },
  { name: 'Dolo 650', qty: 980 },
  { name: 'Pantocid 40', qty: 850 },
  { name: 'Cetzine', qty: 720 },
  { name: 'Azithromycin', qty: 650 },
  { name: 'Metformin', qty: 590 },
  { name: 'Atorvastatin', qty: 540 },
  { name: 'Voglibose', qty: 480 },
  { name: 'Glimiperide', qty: 420 },
  { name: 'Paracetamol', qty: 390 },
];

const staffPerformance = [
  { user: 'John Doe', bills: 1450, sales: '₹4,50,000', returns: 45 },
  { user: 'Sarah Mehra', bills: 1210, sales: '₹3,80,000', returns: 32 },
  { user: 'Michael Scott', bills: 980, sales: '₹2,90,000', returns: 28 },
  { user: 'Jane Smith', bills: 850, sales: '₹2,45,000', returns: 15 },
];

export default function PharmacyAdminDashboard() {
  const [stats, setStats] = useState({ totalSales: 0, totalReturns: 0, totalStockValue: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await pharmacyService.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        toast.error('Failed to fetch admin dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Analysing Global Pharmacy Metrics...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Admin Analytics Dashboard</h2>
        <p className="text-sm text-gray-500 font-medium">Strategic oversight and performance metrics</p>
      </div>

      <ModuleFilterBar 
        filters={[
          { name: 'month', label: 'Month', options: [
            { label: 'January', value: '1' }, { label: 'February', value: '2' }, { label: 'October', value: '10' }
          ]},
          { name: 'year', label: 'Year', options: [{ label: '2026', value: '2026' }, { label: '2025', value: '2025' }]}
        ]}
        onFilterChange={() => {}}
        onSearch={() => {}}
        onDateChange={() => {}}
      />

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Sales" value={`₹ ${(stats.totalSales / 1000).toFixed(1)}K`} icon={TrendingUp} trend="up" className="bg-blue-50/30" />
        <KPICard title="Total Returns" value={`₹ ${stats.totalReturns.toLocaleString()}`} icon={RotateCcw} trend="down" />
        <KPICard title="Net Revenue" value={`₹ ${((stats.totalSales - stats.totalReturns) / 1000).toFixed(1)}K`} icon={IndianRupee} className="bg-green-50/30" />
        <KPICard title="Stock Value" value={`₹ ${stats.totalStockValue ? (stats.totalStockValue / 100000).toFixed(1) + 'L' : '0.0'}`} icon={Package} />
        <KPICard title="Low Stock" value={stats.lowStockCount.toString()} icon={AlertTriangle} className="bg-red-50/30" />
        <KPICard title="Staff Active" value="12" icon={Users} />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-6 font-sans">Monthly Sales Trend (12 Months)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height={300} minWidth={100}>
              <ComposedChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mon" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip />
                <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={{fill: '#16a34a'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-6">Top 10 Selling Medicines</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height={300} minWidth={100}>
              <BarChart data={topMedicines} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} width={80} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="qty" fill="#1e3a8a" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#64748b' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Staff Performance Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 pb-10">
        <h3 className="font-bold text-lg text-gray-800 mb-6">Staff Performance Overview</h3>
        <DataTable 
          data={staffPerformance}
          columns={[
            { header: 'User', accessor: 'user' },
            { header: 'Bills Processed', accessor: 'bills' },
            { header: 'Sales Amount', accessor: 'sales' },
            { header: 'Returns Processed', accessor: 'returns' },
            { header: 'Performance', render: (_, i) => (
              <div className="w-24 bg-gray-100 rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full" 
                  style={{ width: `${100 - (i * 15)}%` }}
                ></div>
              </div>
            )}
          ]}
        />
      </div>
    </div>
  );
}
