import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Eye, Printer, RotateCcw, CheckCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';
import PharmacyInvoice from '../components/pharmacy/PharmacyInvoice';

export default function DirectMedicineReturns() {
  const location = useLocation();
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('Wrong Medicine');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceToView, setInvoiceToView] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  useEffect(() => {
    fetchReturns();
  }, [location.key]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await pharmacyService.getAllReturns();
      if (response && response.success) {
        // Filter for returns where the original bill was OTC
        const data = Array.isArray(response.data) ? response.data : [];
        const otcReturns = data.filter(ret => ret.originalBill?.billType === 'OTC');
        setReturnsList(otcReturns);
      }
    } catch (error) {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const loadBill = async () => {
    const trimmedNo = billNumber.trim();
    if (!trimmedNo) return;
    try {
      const response = await pharmacyService.getSaleByNumber(trimmedNo);
      if (response.success) {
        if (response.data.billType !== 'OTC' && response.data.billType !== 'CASH') {
          // Allowing CASH as well since OTC are often saved as CASH or categorized similarly
        }
        setSelectedBill(response.data);
        setReturnItems(response.data.items.map(item => ({
          ...item,
          returnQty: 0,
          checked: false
        })));
        toast.success('Receipt loaded successfully');
      }
    } catch (error) {
      toast.error('Receipt not found');
    }
  };

  const handleSaveReturn = async () => {
    const itemsToReturn = returnItems
      .filter(item => item.checked && item.returnQty > 0)
      .map(item => ({
        billItemId: item.id,
        quantity: item.returnQty
      }));

    if (itemsToReturn.length === 0) {
      toast.error('Please select items to return');
      return;
    }

    try {
      const response = await pharmacyService.initiateReturn(selectedBill.id, itemsToReturn, returnReason);
      if (response.success) {
        toast.success('Return processed successfully');
        setIsModalOpen(false);
        resetForm();
        fetchReturns();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save return');
    }
  };

  const resetForm = () => {
    setSelectedBill(null);
    setReturnItems([]);
    setBillNumber('');
  };

  const calculateTotalRefund = () => {
    return returnItems
      .filter(item => item.checked)
      .reduce((acc, item) => acc + (item.unitPrice * item.returnQty), 0);
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Return No', render: (row) => `RET-${row.id}` },
    { header: 'Receipt No', render: (row) => row.originalBill?.billNumber },
    { header: 'Customer', render: (row) => row.originalBill?.patientName || 'Walk-in' },
    { header: 'Return Date', render: (row) => new Date(row.returnDate).toLocaleDateString('en-IN') },
    { header: 'Refund Amount', render: (row) => <span className="font-bold text-red-600">₹{row.totalReturnAmount.toFixed(2)}</span> },
    { header: 'Status', render: (row) => <Badge variant={row.status === 'APPROVED' ? 'success' : 'warning'}>{row.status}</Badge> },
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View Original" 
          onClick={() => { setInvoiceToView(row.originalBill); setIsInvoiceModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Direct Medicine Returns</h2>
        <p className="text-sm text-gray-500 font-medium">Manage returns for over-the-counter (OTC) transactions</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        actions={[
          { label: 'New Return', icon: Plus, variant: 'primary', onClick: () => setIsModalOpen(true) }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 font-semibold italic">Loading returns...</div>
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={returnsList.filter(row => {
                const searchLower = searchTerm.toLowerCase();
                const receiptNum = row.originalBill?.billNumber?.toLowerCase() || '';
                const patientName = row.originalBill?.patientName?.toLowerCase() || '';
                return !searchTerm || receiptNum.includes(searchLower) || patientName.includes(searchLower);
              })} 
              hover 
              striped 
            />
            <Pagination totalRecords={returnsList.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
          </>
        )}
      </div>

      {/* New Return Modal */}
      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="Direct Medicine Return Process"
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex gap-3">
             <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-6 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={handleSaveReturn} className="px-8 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2">
                <RotateCcw className="w-4 h-4"/> Save Return
             </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-1.5 flex-1">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Receipt Number</label>
               <div className="relative">
                 <input 
                  type="text" 
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadBill()}
                  placeholder="Enter Receipt No (e.g. BILL-9901)..." 
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white" 
                 />
                 <Search className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
               </div>
            </div>
            <button onClick={loadBill} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all shadow-sm">Load Receipt Items</button>
          </div>

          {!selectedBill ? (
            <div className="py-20 text-center text-slate-400 font-medium bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                Enter a Receipt Number to fetch items for return.
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
               <div className="flex justify-between items-center text-sm px-2">
                 <div className="flex gap-4">
                   <div className="text-slate-500 uppercase font-bold text-[10px] tracking-widest">Customer: <span className="text-slate-900 ml-1">{selectedBill.patientName}</span></div>
                   <div className="text-slate-500 uppercase font-bold text-[10px] tracking-widest">Date: <span className="text-slate-900 ml-1">{new Date(selectedBill.billingDate).toLocaleDateString()}</span></div>
                 </div>
                 <div className="text-slate-500 uppercase font-bold text-[10px] tracking-widest">Bill Total: <span className="text-primary ml-1">₹{selectedBill.netAmount.toFixed(2)}</span></div>
               </div>

               <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                 <table className="w-full text-sm">
                   <thead className="bg-[#1e293b] text-white text-[11px] uppercase tracking-widest">
                     <tr>
                       <th className="px-4 py-3 text-center w-10"></th>
                       <th className="px-4 py-3 text-left">Medicine</th>
                       <th className="px-4 py-3 text-center">Qty</th>
                       <th className="px-4 py-3 text-center">Return Qty</th>
                       <th className="px-4 py-3 text-right">Rate</th>
                       <th className="px-4 py-4 text-right">Refund</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 bg-white">
                     {returnItems.map((item, idx) => (
                       <tr key={item.id} className="hover:bg-slate-50/50">
                         <td className="px-4 py-3 text-center">
                           <input 
                            type="checkbox" 
                            checked={item.checked}
                            onChange={(e) => {
                              const newItems = [...returnItems];
                              newItems[idx].checked = e.target.checked;
                              if (e.target.checked && newItems[idx].returnQty === 0) newItems[idx].returnQty = 1;
                              setReturnItems(newItems);
                            }}
                            className="rounded accent-primary w-4 h-4 cursor-pointer"
                           />
                         </td>
                         <td className="px-4 py-3 font-medium text-slate-800">{item.stock?.medicine?.name}
                           <div className="text-[10px] text-slate-400 font-mono">BATCH: {item.stock?.batchNumber}</div>
                         </td>
                         <td className="px-4 py-3 text-center font-bold text-slate-600">{item.quantity}</td>
                         <td className="px-4 py-3 w-32">
                           <input 
                            type="number" 
                            min="0"
                            max={item.quantity}
                            value={item.returnQty}
                            disabled={!item.checked}
                            onChange={(e) => {
                              const v = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                              const newItems = [...returnItems];
                              newItems[idx].returnQty = v;
                              setReturnItems(newItems);
                            }}
                            className="w-20 mx-auto block text-center border border-slate-200 rounded-lg py-1 outline-none focus:border-red-400 text-red-600 font-black disabled:bg-slate-50" 
                           />
                         </td>
                         <td className="px-4 py-3 text-right text-slate-600 font-mono text-xs">₹{item.unitPrice.toFixed(2)}</td>
                         <td className="px-4 py-3 text-right font-black text-red-500">₹{(item.unitPrice * item.returnQty).toFixed(2)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               <div className="flex flex-col md:flex-row gap-8 items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex-1 w-full max-w-xs space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Return Reason</label>
                    <select 
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-400/20"
                    >
                      <option>Wrong Medicine</option>
                      <option>Expiring Soon</option>
                      <option>Excess Stock</option>
                      <option>Patient Refused</option>
                    </select>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Refund</div>
                    <div className="text-3xl font-black text-red-600">₹{calculateTotalRefund().toFixed(2)}</div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </AppModal>

      {/* Invoice Modal */}
      <AppModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        maxWidth="sm:max-w-4xl"
        padding={false}
      >
        <PharmacyInvoice 
          bill={invoiceToView} 
          onClose={() => setIsInvoiceModalOpen(false)} 
        />
      </AppModal>
    </div>
  );
}
