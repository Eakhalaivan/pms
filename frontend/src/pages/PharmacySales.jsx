import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Printer, XCircle, Trash2, PlusCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';
import PharmacyInvoice from '../components/pharmacy/PharmacyInvoice';

export default function PharmacySales() {
  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const [salesItems, setSalesItems] = useState([
    { id: 1, stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }
  ]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await pharmacyService.getSales();
      if (response.success) {
        setSalesList(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch sales list');
    } finally {
      setLoading(false);
    }
  };

  const handleStockSearch = async (val, idx) => {
    if (val.length < 2) {
      setSearchResults([]);
      setActiveSearchIdx(null);
      return;
    }
    setActiveSearchIdx(idx);
    try {
      const response = await pharmacyService.searchStocks(val);
      const results = response?.data || response || [];
      setSearchResults(results);
      
      // Auto-select if there's an exact match (case insensitive)
      const exactMatch = results.find(s => 
        s.medicine?.name?.toLowerCase() === val.toLowerCase()
      );
      if (exactMatch) {
        selectStock(exactMatch, idx);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const selectStock = (stock, idx) => {
    const newItems = [...salesItems];
    const rate = Number(stock.sellingRate) || 0;
    const qty = newItems[idx].qty || 1;
    const gstPercent = Number(stock.medicine?.taxPercentage || stock.medicine?.gstPercent || 0);
    const baseAmount = rate * qty;
    const gstAmount = parseFloat(((baseAmount * gstPercent) / 100).toFixed(2));
    newItems[idx] = {
      ...newItems[idx],
      stockId: stock.id,
      name: stock.medicine?.name || '',
      batch: stock.batchNumber || '',
      expiry: stock.expiryDate || '',
      rate,
      gstPercent,
      gstAmount,
      amount: parseFloat((baseAmount + gstAmount).toFixed(2))
    };
    setSalesItems(newItems);
    setSearchResults([]);
    setActiveSearchIdx(null);
  };

  const updateQty = (qty, idx) => {
    const newItems = [...salesItems];
    const q = parseInt(qty) || 0;
    const baseAmount = newItems[idx].rate * q;
    const gstAmount = parseFloat(((baseAmount * newItems[idx].gstPercent) / 100).toFixed(2));
    newItems[idx].qty = q;
    newItems[idx].gstAmount = gstAmount;
    newItems[idx].amount = parseFloat((baseAmount + gstAmount).toFixed(2));
    setSalesItems(newItems);
  };

  const saveBill = async (options = { shouldPrint: false }) => {
    if (!patientName) { toast.error('Please enter patient name'); return; }
    const validItems = salesItems.filter(i => i.stockId && i.qty > 0);
    if (validItems.length === 0) { toast.error('Add at least one medicine'); return; }

    const payload = {
      patientName,
      doctorName,
      items: validItems.map(item => ({ stockId: item.stockId, quantity: item.qty })),
      paymentMode,
      discountAmount: 0,
      amountPaid: calculateNet(),
      useAdvance: false
    };

    try {
      const response = await pharmacyService.createSale(payload);
      const billData = response.data || response;
      const billNumber = billData?.billNumber;

      if (response && billNumber) {
        toast.success('Bill saved successfully!');
        setIsModalOpen(false);
        resetModal();
        fetchSales();
        
        // RE-FETCH absolute latest data for the print preview
        if (options.shouldPrint) {
          try {
            const fullBill = await pharmacyService.getSaleByNumber(billNumber);
            setSelectedInvoice(fullBill.data || fullBill);
            setIsInvoiceModalOpen(true);
          } catch (e) {
            // Fallback if re-fetch fails
            setSelectedInvoice(billData);
            setIsInvoiceModalOpen(true);
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save bill');
    }
  };

  const cancelBill = async () => {
    if (!billToDelete) return;
    try {
      const response = await pharmacyService.deleteSale(billToDelete);
      if (response.success) {
        toast.success(response.message || 'Bill cancelled successfully');
        setIsDeleteModalOpen(false);
        setBillToDelete(null);
        fetchSales();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel bill');
    }
  };

  const resetModal = () => {
    setPatientName('');
    setDoctorName('');
    setPaymentMode('CASH');
    setSalesItems([{ id: 1, stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }]);
    setSearchResults([]);
    setActiveSearchIdx(null);
  };

  const calculateSubtotal = () => salesItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
  const calculateGST = () => salesItems.reduce((acc, item) => acc + (item.gstAmount || 0), 0);
  const calculateNet = () => salesItems.reduce((acc, item) => acc + (item.amount || 0), 0);

  const addRow = () => {
    setSalesItems([...salesItems, { id: Date.now(), stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }]);
  };

  const removeRow = (id) => {
    if (salesItems.length > 1) setSalesItems(salesItems.filter(item => item.id !== id));
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Bill No', accessor: 'billNumber' },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'UHID', render: () => 'N/A' },
    { header: 'Bill Date', render: (row) => new Date(row.billingDate).toLocaleDateString('en-IN') },
    { header: 'Total Amount', render: (row) => `₹ ${Number(row.netAmount).toFixed(2)}` },
    { header: 'Net Amount', render: (row) => <span className="font-bold">₹ {Number(row.netAmount).toFixed(2)}</span> },
    { header: 'Payment Mode', render: (row) => row.paymentMode || 'CASH' },
    {
      header: 'Status', render: (row) => (
        <Badge variant={row.paymentStatus === 'PAID' ? 'success' : 'warning'}>
          {row.paymentStatus || 'PENDING'}
        </Badge>
      )
    },
    {
      header: 'Action', render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            title="View" 
            onClick={() => { setSelectedInvoice(row); setIsInvoiceModalOpen(true); }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            title="Print" 
            onClick={() => { setSelectedInvoice(row); setIsInvoiceModalOpen(true); }}
            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button 
            title="Cancel" 
            onClick={() => { setBillToDelete(row.id); setIsDeleteModalOpen(true); }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pharmacy Sales List</h2>
        <p className="text-sm text-gray-500 font-medium">Manage and review all patient medicine bills</p>
      </div>

      <ModuleFilterBar
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        actions={[
          { label: 'New Sale', icon: Plus, variant: 'primary', onClick: () => setIsModalOpen(true) }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 font-semibold">Loading sales...</div>
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={salesList.filter(bill => {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = !searchTerm || 
                  bill.billNumber?.toLowerCase().includes(searchLower) ||
                  bill.patientName?.toLowerCase().includes(searchLower);
                
                const billDate = new Date(bill.billingDate);
                const matchesFrom = !dateRange.from || billDate >= dateRange.from;
                const matchesTo = !dateRange.to || billDate <= dateRange.to;
                
                return matchesSearch && matchesFrom && matchesTo;
              })} 
              hover 
              striped 
            />
            <Pagination
              totalRecords={salesList.length}
              currentPage={1}
              pageSize={10}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
            />
          </>
        )}
      </div>

      {/* New Sale Modal */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetModal(); }}
        title="Create New Pharmacy Sale"
        maxWidth="sm:max-w-6xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <button 
              onClick={() => { setIsModalOpen(false); resetModal(); }} 
              className="px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => saveBill({ shouldPrint: false })} 
                className="px-6 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Save Only
              </button>
              <button 
                onClick={() => saveBill({ shouldPrint: true })} 
                className="px-8 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" /> Save & Print Bill
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Patient Name..."
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor Name</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Doctor name..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward / OPD</label>
              <input type="text" readOnly value="General OPD" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-slate-600 outline-none" />
            </div>
          </div>

          {/* Medicine Entry Table */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary" /> Medicine Entry
            </h4>
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 text-white text-[11px] uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3 text-left">Medicine Name</th>
                      <th className="px-4 py-3 text-left">Batch</th>
                      <th className="px-4 py-3 text-left">Expiry</th>
                      <th className="px-4 py-3 text-center w-20">Qty</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-center w-16">GST%</th>
                      <th className="px-4 py-3 text-right">GST Amt</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {salesItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 relative">
                          <input
                            type="text"
                            placeholder="Search medicine..."
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newItems = [...salesItems];
                              newItems[idx].name = val;
                              setSalesItems(newItems);
                              handleStockSearch(val, idx);
                            }}
                            onBlur={() => {
                              // If search results has exactly one item, auto select it on blur
                              setTimeout(() => {
                                if (searchResults.length === 1 && !salesItems[idx].stockId) {
                                  selectStock(searchResults[0], idx);
                                }
                                setSearchResults([]);
                              }, 200);
                            }}
                            className="w-full bg-transparent outline-none focus:text-primary font-medium"
                          />
                          {searchResults.length > 0 && activeSearchIdx === idx && item.name.length > 1 && (
                            <div className="absolute z-50 left-0 top-full mt-1 w-80 bg-white shadow-2xl border border-blue-100 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-widest">
                                Search Results ({searchResults.length})
                              </div>
                              {searchResults.map((stock) => (
                                <div
                                  key={stock.id}
                                  onClick={() => selectStock(stock, idx)}
                                  className="px-4 py-3 hover:bg-blue-600 hover:text-white cursor-pointer border-b last:border-0 transition-all group"
                                >
                                  <div className="font-bold group-hover:text-white transition-colors">{stock.medicine?.name}</div>
                                  <div className="text-[10px] opacity-70 mt-0.5">
                                    BATCH: <span className="font-mono">{stock.batchNumber}</span> | 
                                    EXP: {stock.expiryDate} | 
                                    STOCK: <span className="font-bold">{stock.quantityAvailable}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 uppercase">{item.batch || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{item.expiry || '-'}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateQty(e.target.value, idx)}
                            className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">₹{Number(item.rate).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.gstPercent > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {item.gstPercent || 0}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-amber-600 font-medium">₹{Number(item.gstAmount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">₹{Number(item.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => removeRow(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addRow}
                className="w-full py-3 bg-slate-50 text-primary text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all border-t border-slate-100"
              >
                + Add Medicine Row
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-col md:flex-row gap-8 items-start justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5 w-64">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="ADVANCE">Advance Adjust</option>
                </select>
              </div>
              <div className="space-y-1.5 w-full">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</label>
                <textarea className="w-full h-20 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white resize-none text-sm" placeholder="Any special notes..." />
              </div>
            </div>

            <div className="w-full md:w-80 space-y-3 p-4 bg-white rounded-xl shadow-inner border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal (excl. GST)</span>
                <span className="font-bold text-slate-700">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">GST Amount</span>
                <span className="font-bold text-amber-600">₹{calculateGST().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Discount</span>
                <span className="font-bold text-slate-700">₹0.00</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Round Off</span>
                <span className="font-bold text-slate-700">₹0.00</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-slate-100">
                <span className="font-bold text-gray-800 uppercase tracking-tighter">Net Amount</span>
                <span className="font-black text-primary">₹{calculateNet().toFixed(2)}</span>
              </div>
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
          bill={selectedInvoice} 
          onClose={() => setIsInvoiceModalOpen(false)} 
        />
      </AppModal>

      {/* Delete Confirmation Modal */}
      <AppModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Cancellation"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setIsDeleteModalOpen(false)} 
              className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              No, Keep Bill
            </button>
            <button 
              onClick={cancelBill} 
              className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
              Yes, Cancel Bill
            </button>
          </div>
        }
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">Are you sure?</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            This action will cancel the bill and return <strong>all medicine quantities</strong> back to the inventory. This action cannot be undone.
          </p>
        </div>
      </AppModal>
    </div>
  );
}
