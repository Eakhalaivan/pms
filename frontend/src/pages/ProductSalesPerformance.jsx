import React, { useState } from 'react';
import { IndianRupee, FileDown, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';

const mockPerformanceData = [
  { id: 1, name: 'Amoxicillin 500mg', category: 'Tablet', qtySold: 1205, salesAmt: 145000, returnsQty: 12, returnsAmt: 1440, netSales: 143560 },
  { id: 2, name: 'Dolo 650', category: 'Tablet', qtySold: 980, salesAmt: 45000, returnsQty: 5, returnsAmt: 225, netSales: 44775 },
  { id: 3, name: 'Cough Syrup 100ml', category: 'Syrup', qtySold: 450, salesAmt: 85000, returnsQty: 2, returnsAmt: 370, netSales: 84630 },
];

const topMedicines = [
  { name: 'Amoxicillin', qty: 1205 },
  { name: 'Dolo 650', qty: 980 },
  { name: 'Pantocid 40', qty: 850 },
  { name: 'Cetzine', qty: 720 },
  { name: 'Azithromycin', qty: 650 },
];

const categoryData = [
  { name: 'Tablet', value: 450 },
  { name: 'Syrup', value: 300 },
  { name: 'Injection', value: 200 },
  { name: 'Capsule', value: 150 },
];

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626'];

export default function ProductSalesPerformance() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = mockPerformanceData.filter(row => {
    const s = searchTerm.toLowerCase();
    return !searchTerm || 
      row.name.toLowerCase().includes(s) || 
      row.category.toLowerCase().includes(s);
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Medicine Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Total Qty Sold', accessor: 'qtySold' },
    { header: 'Total Sales Amount', render: (row) => `₹${row.salesAmt.toLocaleString()}` },
    { header: 'Returns Qty', accessor: 'returnsQty' },
    { header: 'Returns Amount', render: (row) => `₹${row.returnsAmt.toLocaleString()}` },
    { header: 'Net Sales', render: (row) => <span className="font-bold text-primary">₹{row.netSales.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Product Sales Performance</h2>
        <p className="text-sm text-gray-500 font-medium">Analyze individual medicine performance and department-wise sales metrics</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={[
          { label: 'Category', name: 'cat', options: [{ label: 'Tablet', value: 't' }, { label: 'Syrup', value: 's' }] },
          { label: 'Supplier', name: 'sup', options: [{ label: 'PharmaCorp', value: 'pc' }] }
        ]}
        onDateChange={() => {}}
        actions={[{ label: 'Export Excel', icon: FileDown, variant: 'success', onClick: () => {} }]}
      />

      {/* Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Top 10 Medicines by Qty
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height={300} minWidth={100}>
              <BarChart data={topMedicines} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} width={80} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="qty" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-6 font-sans">Sales by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height={300} minWidth={100}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredData} hover striped />
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center px-10">
           <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Net Sales</span>
           <span className="text-xl font-black text-blue-400">₹2,72,965.00</span>
        </div>
        <Pagination totalRecords={filteredData.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>
    </div>
  );
}
