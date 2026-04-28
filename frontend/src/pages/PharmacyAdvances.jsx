import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, RotateCcw, IndianRupee } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

export default function PharmacyAdvances() {
  const [advancesList, setAdvancesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  useEffect(() => {
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    setLoading(true);
    try {
      const response = await pharmacyService.getAllAdvances();
      if (response && response.success) {
        setAdvancesList(Array.isArray(response.data) ? response.data : []);
      } else {
        setAdvancesList([]);
      }
    } catch (error) {
      console.error('Pharmacy Advances Error:', error);
      setAdvancesList([]);
    } finally {
      setLoading(false);
    }
  };

  const saveAdvance = async () => {
    if (!patientName || !amount) {
      toast.error('Please enter patient name and amount');
      return;
    }
    try {
      const response = await pharmacyService.addAdvance(patientName, amount);
      if (response.success) {
        toast.success('Advance collected successfully!');
        setIsModalOpen(false);
        setPatientName('');
        setAmount('');
        fetchAdvances();
      }
    } catch (error) {
      toast.error('Failed to save advance');
    }
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'Advance Date', render: (row) => new Date(row.advanceDate).toLocaleDateString() },
    { header: 'Total Collected', render: (row) => `₹${row.amount.toFixed(2)}` },
    { header: 'Balance', render: (row) => <span className="font-bold text-success">₹{row.balanceAmount.toFixed(2)}</span> },
    { header: 'Status', render: (row) => {
      let variant = row.balanceAmount > 0 ? 'info' : 'success';
      let label = row.balanceAmount > 0 ? 'Active' : 'Utilized';
      return <Badge variant={variant}>{label}</Badge>;
    }},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedAdvance(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button title="History" className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg"><RotateCcw className="w-4 h-4" /></button>
      </div>
    )}
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Advances...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pharmacy Advances</h2>
        <p className="text-sm text-gray-500 font-medium">Manage and track patient advance payments for future bills</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        actions={[
          { label: 'New Advance', icon: Plus, variant: 'primary', onClick: () => setIsModalOpen(true) }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={advancesList.filter(row => {
             const s = searchTerm.toLowerCase();
             const matchesSearch = !searchTerm || row.patientName.toLowerCase().includes(s);
             
             const advDate = new Date(row.advanceDate);
             const normalizedAdvDate = new Date(advDate.getFullYear(), advDate.getMonth(), advDate.getDate()).getTime();
             const matchesFrom = !dateRange.from || normalizedAdvDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
             const matchesTo = !dateRange.to || normalizedAdvDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();

             return matchesSearch && matchesFrom && matchesTo;
          })} 
          hover 
          striped 
        />
        <Pagination totalRecords={advancesList.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>

      {/* New Advance Modal */}
      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Add New Pharmacy Advance"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all font-display">Cancel</button>
             <button onClick={saveAdvance} className="flex-1 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-display">
                <IndianRupee className="w-4 h-4"/> Save Advance
             </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Patient Name</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter Patient Name..." 
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
              />
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Advance Amount</label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="Enter Amount" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
              />
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₹</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Mode</label>
            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold">
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
            </select>
          </div>
        </div>
      </AppModal>

      {/* View Modal */}
      <AppModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)}
        title="Advance Payment Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedAdvance && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Patient</p>
                <p className="font-bold">{selectedAdvance.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Date</p>
                <p className="font-bold">{new Date(selectedAdvance.advanceDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Total Collected</p>
                <p className="font-bold text-primary">₹{selectedAdvance.amount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Current Balance</p>
                <p className="font-bold text-success">₹{selectedAdvance.balanceAmount.toFixed(2)}</p>
              </div>
            </div>
            <div className="p-8 text-center text-slate-400 italic text-sm">
                Advance ledger history and adjustment logs are available for review.
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
