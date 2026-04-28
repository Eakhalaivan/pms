import React, { useState, useEffect } from 'react';
import { Search, CreditCard, Eye, Printer, CheckCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

export default function MedicineCreditBills() {
  const [creditBillsList, setCreditBillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [reference, setReference] = useState('');

  useEffect(() => {
    fetchCreditBills();
  }, []);

  const fetchCreditBills = async () => {
    setLoading(true);
    try {
      const response = await pharmacyService.getCreditBills();
      if (response && response.success) {
        setCreditBillsList(Array.isArray(response.data) ? response.data : []);
      } else {
        setCreditBillsList([]);
      }
    } catch (error) {
      console.error('Credit Bills Error:', error);
      setCreditBillsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount) {
      toast.error('Please enter amount');
      return;
    }
    try {
      const response = await pharmacyService.addCreditPayment(selectedBill.id, paymentAmount, paymentMode, reference);
      if (response.success) {
        toast.success('Payment recorded successfully!');
        setIsModalOpen(false);
        fetchCreditBills();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Bill No', render: (row) => row.bill.billNumber },
    { header: 'Patient Name', render: (row) => row.bill.patientName },
    { header: 'Bill Date', render: (row) => new Date(row.bill.billingDate).toLocaleDateString() },
    { header: 'Total Amount', render: (row) => `₹${row.totalAmount.toFixed(2)}` },
    { header: 'Paid Amount', render: (row) => `₹${row.paidAmount.toFixed(2)}` },
    { header: 'Balance', render: (row) => <span className="text-red-600 font-bold">₹{row.balanceAmount.toFixed(2)}</span> },
    { header: 'Status', render: (row) => {
      let variant = row.status === 'PAID' ? 'success' : row.status === 'PARTIAL' ? 'warning' : 'danger';
      return <Badge variant={variant}>{row.status}</Badge>;
    }},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button title="View" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
        {row.status !== 'PAID' && (
          <button 
            title="Collect Payment" 
            onClick={() => { setSelectedBill(row); setPaymentAmount(row.balanceAmount); setIsModalOpen(true); }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <CreditCard className="w-4 h-4" />
          </button>
        )}
        <button title="Print" className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"><Printer className="w-4 h-4" /></button>
      </div>
    )}
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Credit Bills...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Medicine Credit Bills</h2>
        <p className="text-sm text-gray-500 font-medium">Track outstanding balances and manage credit settlements</p>
      </div>

      <ModuleFilterBar 
        onSearch={() => {}}
        onDateChange={() => {}}
        actions={[]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={creditBillsList} hover striped />
        <Pagination totalRecords={creditBillsList.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Collect Credit Payment"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={handleRecordPayment} className="flex-1 px-6 py-2.5 bg-success text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all">Record Payment</button>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
                  <span>Bill Reference</span>
                  <span className="text-slate-900">{selectedBill.bill.billNumber}</span>
               </div>
               <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                  <span>Patient</span>
                  <span className="text-slate-900">{selectedBill.bill.patientName}</span>
               </div>
            </div>

            <div className="text-center py-4">
               <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Outstanding Balance</p>
               <p className="text-4xl font-black text-red-600 tracking-tighter">₹{selectedBill.balanceAmount.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Amount</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-lg font-bold outline-none focus:ring-2 focus:ring-success/20 transition-all" 
                    />
                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₹</span>
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Mode</label>
                  <select 
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-success/20 transition-all font-semibold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Scan</option>
                    <option value="CARD">Card Payment</option>
                  </select>
               </div>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
