import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Calendar, TrendingUp, AlertTriangle, Package, DollarSign, Filter, RefreshCcw } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchReport();
  }, [activeTab, dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;
      const from = `${dateRange.from}T00:00:00`;
      const to = `${dateRange.to}T23:59:59`;

      if (activeTab === 'sales') {
        response = await pharmacyService.getSalesReport(from, to);
      } else if (activeTab === 'tax') {
        response = await pharmacyService.getTaxReport(from, to);
      } else if (activeTab === 'stock') {
        response = await pharmacyService.getStockReport();
      } else if (activeTab === 'expiry') {
        response = await pharmacyService.getExpiryReport(60); // next 60 days
      }

      if (response.success) {
        if (activeTab === 'tax') {
          setSummary(response.data);
          setReportData([]); // Tax report is summary-heavy
        } else {
          setReportData(response.data);
          setSummary(null);
        }
      }
    } catch (error) {
      toast.error(`Failed to fetch ${activeTab} report`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0 && !summary) return;
    
    let headers = [];
    let rows = [];

    if (activeTab === 'sales') {
      headers = ['Bill Number', 'Date', 'Patient', 'Amount', 'Tax', 'Status'];
      rows = reportData.map(r => [r.billNumber, new Date(r.date).toLocaleDateString(), r.patient, r.amount, r.tax, r.status]);
    } else if (activeTab === 'stock') {
      headers = ['Medicine', 'Batch', 'Quantity', 'Unit Price', 'Expiry', 'Total Value'];
      rows = reportData.map(r => [r.medicine, r.batch, r.quantity, r.unitPrice, r.expiry, r.value]);
    } else if (activeTab === 'expiry') {
      headers = ['Medicine', 'Batch', 'Expiry Date', 'Available Quantity'];
      rows = reportData.map(r => [r.medicine, r.batch, r.expiry, r.quantity]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_report_${dateRange.from}_to_${dateRange.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = {
    sales: [
      { header: 'Bill No', accessor: 'billNumber' },
      { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
      { header: 'Patient', accessor: 'patient' },
      { header: 'Tax Amt', render: (row) => <span className="text-slate-500">₹{row.tax?.toFixed(2)}</span> },
      { header: 'Net Total', render: (row) => <span className="font-bold text-slate-800">₹{row.amount?.toFixed(2)}</span> },
      { header: 'Status', render: (row) => <Badge variant={row.status === 'PAID' ? 'success' : 'warning'}>{row.status}</Badge> }
    ],
    stock: [
      { header: 'Medicine Name', accessor: 'medicine' },
      { header: 'Batch', accessor: 'batch' },
      { header: 'Quantity', accessor: 'quantity' },
      { header: 'Price', render: (row) => `₹${row.unitPrice?.toFixed(2)}` },
      { header: 'Total Value', render: (row) => <span className="font-bold">₹{row.value?.toFixed(2)}</span> },
      { header: 'Expiry', render: (row) => <Badge variant="info">{row.expiry}</Badge> }
    ],
    expiry: [
        { header: 'Medicine Name', accessor: 'medicine' },
        { header: 'Batch', accessor: 'batch' },
        { header: 'Expiry Date', render: (row) => <span className="text-red-600 font-bold">{row.expiry}</span> },
        { header: 'In Stock', accessor: 'quantity' },
        { header: 'Status', render: () => <Badge variant="danger">Expiring Soon</Badge> }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-display">Business Intelligence & Reports</h2>
          <p className="text-sm text-gray-500 font-medium">Analyze sales performance, tax liabilities, and inventory health</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={fetchReport} className="p-2 text-slate-400 hover:text-primary transition-colors">
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
            >
                <Download className="w-4 h-4" /> Export CSV
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-full max-w-2xl">
        {[
          { id: 'sales', label: 'Sales Report', icon: TrendingUp },
          { id: 'tax', label: 'Tax Report', icon: DollarSign },
          { id: 'stock', label: 'Stock Valuation', icon: Package },
          { id: 'expiry', label: 'Expiry Alerts', icon: AlertTriangle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Filters (only for sales/tax) */}
      {(activeTab === 'sales' || activeTab === 'tax') && (
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 text-xs font-bold" 
              />
              <span className="text-slate-400 font-bold">to</span>
              <input 
                type="date" 
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 text-xs font-bold" 
              />
           </div>
        </div>
      )}

      {/* Content Area */}
      {activeTab === 'tax' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl">
                    <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Tax Liability</p>
                    <h3 className="text-3xl font-black mb-4">₹{summary?.totalTax?.toFixed(2) || '0.00'}</h3>
                    <div className="h-px bg-white/20 mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-indigo-200 text-[9px] uppercase font-bold">Period Total</p>
                            <p className="text-sm font-bold">₹{summary?.totalAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-[9px] uppercase font-bold">Total Invoices</p>
                            <p className="text-sm font-bold">{summary?.billCount || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tax Distribution</h4>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'CGST (9%)', value: (summary?.totalTax || 0) / 2 },
                                        { name: 'SGST (9%)', value: (summary?.totalTax || 0) / 2 }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-2">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0088FE]"></div><span className="text-[10px] font-bold text-slate-500">CGST</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00C49F]"></div><span className="text-[10px] font-bold text-slate-500">SGST</span></div>
                    </div>
                </div>
            </div>
            <div className="col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <FileText className="w-10 h-10" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">GST-1 Summary Ready</h3>
                    <p className="text-sm text-slate-500 max-w-sm">Your tax summary for {summary?.period} has been calculated based on settled invoices.</p>
                </div>
                <button className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all">Download GSTR-1 Draft</button>
            </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <DataTable 
             columns={columns[activeTab]} 
             data={reportData} 
             loading={loading}
             hover 
             striped 
           />
           {reportData.length > 0 && (
             <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Records: {reportData.length}</span>
                <span className="text-lg font-black text-slate-800">
                    Total: ₹{reportData.reduce((acc, curr) => acc + (curr.amount || curr.value || 0), 0).toFixed(2)}
                </span>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
