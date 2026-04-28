import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Printer, RotateCcw, CheckCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';
import PharmacyInvoice from '../components/pharmacy/PharmacyInvoice';

export default function MedicineReturns() {
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
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await pharmacyService.getAllReturns();
      if (response && response.success) {
        setReturnsList(Array.isArray(response.data) ? response.data : []);
      } else {
        setReturnsList([]);
      }
    } catch (error) {
      // Silently handle – auth errors are handled by the api interceptor
      setReturnsList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBill = async () => {
    if (!billNumber) return;
    try {
      const response = await pharmacyService.getSaleByNumber(billNumber);
      if (response.success) {
        setSelectedBill(response.data);
        setReturnItems(response.data.items.map(item => ({
          ...item,
          returnQty: 0,
          checked: false
        })));
        toast.success('Bill loaded');
      }
    } catch (error) {
      toast.error('Bill not found');
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
        toast.success('Return initiated and pending approval');
        setIsModalOpen(false);
        fetchReturns();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate return');
    }
  };

  const calculateTotalRefund = () => {
    return returnItems
      .filter(item => item.checked)
      .reduce((acc, item) => acc + (item.netAmount / item.quantity) * item.returnQty, 0);
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Return ID', accessor: 'id' },
    { header: 'Bill No', render: (row) => row.originalBill.billNumber },
    { header: 'Patient Name', render: (row) => row.originalBill.patientName },
    { header: 'Return Date', render: (row) => new Date(row.returnDate).toLocaleDateString() },
    { header: 'Return Amount', render: (row) => <span className="text-red-600 font-bold">₹{row.totalReturnAmount.toFixed(2)}</span> },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Status', render: (row) => <Badge variant={row.status === 'APPROVED' ? 'success' : 'warning'}>{row.status}</Badge> },
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View Original Bill" 
          onClick={() => { setInvoiceToView(row.originalBill); setIsInvoiceModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status === 'PENDING' && (
          <button 
            title="Approve" 
            onClick={async () => {
              try {
                await pharmacyService.approveReturn(row.id);
                toast.success('Return approved');
                fetchReturns();
              } catch (e) { toast.error('Approval failed'); }
            }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Medicine Returns List</h2>
        <p className="text-sm text-gray-500 font-medium">Manage returns and issue credit notes</p>
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
        <DataTable 
          columns={columns} 
          data={returnsList.filter(row => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
              row.id?.toString().includes(searchLower) ||
              row.originalBill?.billNumber?.toLowerCase().includes(searchLower) ||
              row.originalBill?.patientName?.toLowerCase().includes(searchLower);
            
            const returnDate = new Date(row.returnDate);
            const matchesFrom = !dateRange.from || returnDate >= dateRange.from;
            const matchesTo = !dateRange.to || returnDate <= dateRange.to;
            
            return matchesSearch && matchesFrom && matchesTo;
          })} 
          hover 
          striped 
        />
        <Pagination totalRecords={returnsList.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedBill(null); setReturnItems([]); setBillNumber(''); }}
        title="Process Medicine Return"
        maxWidth="sm:max-w-3xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => { setIsModalOpen(false); setSelectedBill(null); setReturnItems([]); setBillNumber(''); }}
              className="px-6 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReturn}
              className="px-8 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200/50 hover:bg-red-700 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4"/> Save Return
            </button>
          </div>
        }
      >
        <div className="space-y-5">

          {/* Search Bill No */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-3">
              Search Bill No
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Bill Number (e.g. PH-45091)..."
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadBill()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm"
                />
              </div>
              <button
                onClick={loadBill}
                className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all shadow whitespace-nowrap"
              >
                Load Bill Items
              </button>
            </div>
          </div>

          {/* Bill Items Table — shown only after loading */}
          {selectedBill && returnItems.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white text-[11px] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 text-center w-10"></th>
                    <th className="px-4 py-3 text-left">Medicine</th>
                    <th className="px-4 py-3 text-left">Batch</th>
                    <th className="px-4 py-3 text-center">Billed Qty</th>
                    <th className="px-4 py-3 text-center">Return Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {returnItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => {
                            const newItems = [...returnItems];
                            newItems[idx].checked = e.target.checked;
                            setReturnItems(newItems);
                          }}
                          className="rounded accent-primary w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.stock?.medicine?.name}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.stock?.batchNumber}</td>
                      <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={item.returnQty}
                          onChange={(e) => {
                            const newItems = [...returnItems];
                            newItems[idx].returnQty = parseInt(e.target.value) || 0;
                            setReturnItems(newItems);
                          }}
                          className="w-20 mx-auto block text-center border border-slate-200 rounded-lg py-1 outline-none focus:border-red-400 text-red-600 font-bold"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">
                        ₹{((item.netAmount / item.quantity) * item.returnQty).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Return Reason + Total Refund */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 flex items-center justify-between gap-8">
            <div className="flex-1 max-w-xs">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-3">
                Return Reason
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-red-400/20 text-sm font-medium text-gray-700"
              >
                <option>Wrong Medicine</option>
                <option>Excess Quantity</option>
                <option>Duplicate Entry</option>
                <option>Product Defect / Expiry near</option>
                <option>Refused by Patient</option>
                <option>Other</option>
              </select>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">Total Refund Amount</p>
              <p className="text-4xl font-black text-red-600 tracking-tight">₹{calculateTotalRefund().toFixed(2)}</p>
            </div>
          </div>

        </div>
      </AppModal>

      {/* Invoice Print Modal */}
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
