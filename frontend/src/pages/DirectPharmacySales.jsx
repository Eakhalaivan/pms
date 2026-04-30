import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Eye, Printer, XCircle, Trash2, PlusCircle, CheckCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';
import PharmacyInvoice from '../components/pharmacy/PharmacyInvoice';

export default function DirectPharmacySales() {
  const location = useLocation();
  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  // OTC Sale Form State
  const [patientName, setPatientName] = useState('Walk-in');
  const [mobile, setMobile] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [salesItems, setSalesItems] = useState([
    { id: Math.random(), stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }
  ]);
  
  // Stock Search State
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [location.key]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await pharmacyService.getSales();
      if (response && response.success) {
        // Extract the array from Spring Data's Page object if present
        const salesData = response.data?.content || response.data || [];
        const otcSales = salesData.filter(sale => sale.billType === 'OTC');
        setSalesList(otcSales);
      }
    } catch (error) {
      console.error('Fetch Sales Error:', error);
      toast.error('Failed to load sales data');
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
    setIsSearching(true);
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
    } finally {
      setIsSearching(false);
    }
  };

  const selectStock = (stock, idx) => {
    const newItems = [...salesItems];
    const rate = Number(stock.sellingRate) || 0;
    const qty = newItems[idx].qty || 1;
    const gstPercent = Number(stock.medicine?.taxPercentage || stock.medicine?.gstPercent || 0);
    
    newItems[idx] = {
      ...newItems[idx],
      stockId: stock.id,
      name: stock.medicine?.name || '',
      batch: stock.batchNumber || '',
      expiry: stock.expiryDate || '',
      rate,
      gstPercent,
    };
    
    recalculateRow(newItems[idx]);
    setSalesItems(newItems);
    setSearchResults([]);
    setActiveSearchIdx(null);
  };

  const updateQty = (qty, idx) => {
    const newItems = [...salesItems];
    newItems[idx].qty = parseInt(qty) || 0;
    recalculateRow(newItems[idx]);
    setSalesItems(newItems);
  };

  const updateRate = (val, idx) => {
    const newItems = [...salesItems];
    newItems[idx].rate = parseFloat(val) || 0;
    recalculateRow(newItems[idx]);
    setSalesItems(newItems);
  };

  const updateGst = (val, idx) => {
    const newItems = [...salesItems];
    newItems[idx].gstPercent = parseFloat(val) || 0;
    recalculateRow(newItems[idx]);
    setSalesItems(newItems);
  };

  const recalculateRow = (item) => {
    const rate = Number(item.rate) || 0;
    const qty = Number(item.qty) || 0;
    const gstPercent = Number(item.gstPercent) || 0;
    
    const baseAmount = rate * qty;
    const gstAmount = parseFloat(((baseAmount * gstPercent) / 100).toFixed(2));
    
    item.gstAmount = gstAmount;
    item.amount = parseFloat((baseAmount + gstAmount).toFixed(2));
  };

  const addRow = () => {
    setSalesItems([...salesItems, { id: Math.random(), stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }]);
  };

  const removeRow = (id) => {
    if (salesItems.length > 1) setSalesItems(salesItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => salesItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
  const calculateGST = () => salesItems.reduce((acc, item) => acc + (item.gstAmount || 0), 0);
  const calculateNet = () => salesItems.reduce((acc, item) => acc + (item.amount || 0), 0);

  const saveBill = async (options = { shouldPrint: false }) => {
    const validItems = salesItems.filter(i => i.stockId && i.qty > 0);
    if (validItems.length === 0) { toast.error('Add at least one medicine'); return; }

    const payload = {
      patientName: patientName || 'name',
      doctorName: 'Self (OTC)',
      billType: 'OTC',
      paymentMode: paymentMode,
      items: validItems.map(item => ({ 
        stockId: item.stockId, 
        quantity: item.qty,
        unitPrice: item.rate,
        gstPercent: item.gstPercent
      }))
    };

    try {
      const response = await pharmacyService.createSale(payload);
      const billData = response.data || response;
      if (response.success) {
        toast.success('OTC Sale completed!');
        setIsModalOpen(false);
        resetModal();
        fetchSales();
        
        if (options.shouldPrint) {
           setSelectedInvoice(billData);
           setIsInvoiceModalOpen(true);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save OTC sale');
    }
  };

  const cancelBill = async () => {
    if (!billToDelete) return;
    try {
      const response = await pharmacyService.deleteSale(billToDelete);
      if (response.success) {
        toast.success('Sale cancelled and stock reverted');
        setIsDeleteModalOpen(false);
        setBillToDelete(null);
        fetchSales();
      }
    } catch (error) {
      toast.error('Failed to cancel sale');
    }
  };

  const resetModal = () => {
    setPatientName('name');
    setMobile('');
    setPaymentMode('CASH');
    setSalesItems([{ id: Math.random(), stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }]);
    setSearchResults([]);
    setActiveSearchIdx(null);
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Receipt No', accessor: 'billNumber' },
    { header: 'Customer Name', accessor: 'patientName' },
    { header: 'Sale Date', render: (row) => new Date(row.billingDate).toLocaleDateString('en-IN') },
    { header: 'Total Amount', render: (row) => <span className="font-bold text-gray-900">₹{Number(row.netAmount).toFixed(2)}</span> },
    { header: 'Paid Amount', render: (row) => `₹${Number(row.amountPaid).toFixed(2)}` },
    { header: 'Mode', render: (row) => <Badge variant="info">{row.paymentMode}</Badge> },
    { header: 'Action', render: (row) => (
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
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Direct Sales (OTC)</h2>
        <p className="text-sm text-gray-500 font-medium">Manage over-the-counter transactions for walk-in customers</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        actions={[
          { label: 'New OTC Entry', icon: Plus, variant: 'primary', onClick: () => setIsModalOpen(true) }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
        <Pagination totalRecords={salesList.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>

      {/* Entry Modal */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetModal(); }}
        title="Direct OTC Entry"
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
                <CheckCircle className="w-4 h-4" /> Save & Print Bill
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Customer Name (Optional)</label>
              <input 
                type="text" 
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white" 
                placeholder="Walk-in" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mobile Number</label>
              <input 
                type="text" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white" 
                placeholder="Contact number" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#1e293b] text-white text-[11px] uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3 text-left">Medicine Name</th>
                      <th className="px-4 py-3 text-left">Batch</th>
                      <th className="px-4 py-3 text-left">Expiry</th>
                      <th className="px-4 py-3 text-center w-24">Qty</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-center w-20">GST %</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {salesItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 relative">
                          <input 
                            type="text" 
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newItems = [...salesItems];
                              newItems[idx].name = val;
                              setSalesItems(newItems);
                              handleStockSearch(val, idx);
                            }}
                            onFocus={() => {
                              setActiveSearchIdx(idx);
                              if (item.name.length >= 2) handleStockSearch(item.name, idx);
                            }}
                            onBlur={() => {
                              setTimeout(() => setActiveSearchIdx(null), 200);
                            }}
                            placeholder="Search medicine..." 
                            className="w-full bg-transparent outline-none focus:text-primary font-bold placeholder:text-slate-300 placeholder:font-normal" 
                          />
                          {activeSearchIdx === idx && item.name.length >= 2 && (
                            <div className="absolute z-50 left-0 top-full mt-1 w-96 bg-white shadow-2xl border border-blue-100 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              {isSearching ? (
                                <div className="px-4 py-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                  Searching Inventory...
                                </div>
                              ) : searchResults.length > 0 ? (
                                <>
                                  <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-widest">
                                    Available Stock ({searchResults.length})
                                  </div>
                                  {searchResults.map((stock) => (
                                    <div
                                      key={stock.id}
                                      onClick={() => selectStock(stock, idx)}
                                      className="px-4 py-3 hover:bg-primary hover:text-white cursor-pointer border-b last:border-0 transition-all group"
                                    >
                                      <div className="font-bold group-hover:text-white">{stock.medicine?.name}</div>
                                      <div className="flex items-center gap-2 text-[10px] opacity-70 mt-0.5 group-hover:text-white/80">
                                        <span className="font-mono bg-slate-100 group-hover:bg-white/20 px-1 rounded">BATCH: {stock.batchNumber}</span>
                                        <span>EXP: {stock.expiryDate}</span>
                                        <span className="font-bold">STOCK: {stock.quantityAvailable}</span>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <div className="px-4 py-8 text-center text-slate-400 text-xs">
                                  <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                  <p className="font-bold text-slate-500 uppercase tracking-widest mb-1">No Results Found</p>
                                  <p className="opacity-70 italic">Try searching for generic name or batch</p>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 uppercase font-mono">{item.batch || <span className="text-slate-300">-</span>}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{item.expiry || <span className="text-slate-300">-</span>}</td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            value={item.qty}
                            onChange={(e) => updateQty(e.target.value, idx)}
                            className="w-full text-center border border-slate-200 rounded-lg py-1 outline-none focus:border-primary font-bold" 
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            value={item.rate}
                            onChange={(e) => updateRate(e.target.value, idx)}
                            className="w-full text-right bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary outline-none py-1" 
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <input 
                              type="number" 
                              value={item.gstPercent}
                              onChange={(e) => updateGst(e.target.value, idx)}
                              className="w-12 text-center bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary outline-none py-1 text-xs font-bold text-amber-600" 
                            />
                            <span className="text-[10px] font-bold text-amber-400">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">₹{Number(item.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => removeRow(item.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addRow} className="w-full py-3 bg-slate-50 text-primary text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all border-t border-slate-100">+ Add Medicine Row</button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
            <div className="flex-1 w-full space-y-4">
               <div className="w-64 space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Mode</label>
                  <select 
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-semibold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI / QR Code</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</label>
                  <textarea className="w-full h-20 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white resize-none text-sm" placeholder="Any special notes for this OTC sale..." />
               </div>
            </div>
            
            <div className="w-full md:w-80 space-y-3 p-6 bg-slate-900 text-white rounded-2xl shadow-xl">
               <div className="flex justify-between text-xs text-slate-400 uppercase tracking-widest font-bold">
                 <span>Subtotal</span>
                 <span>₹{calculateSubtotal().toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-xs text-slate-400 uppercase tracking-widest font-bold">
                 <span>GST Total</span>
                 <span>₹{calculateGST().toFixed(2)}</span>
               </div>
               <div className="border-t border-white/10 pt-3 flex justify-between text-xl font-black">
                 <span className="tracking-tighter uppercase">Total Amount</span>
                 <span className="text-blue-400">₹{calculateNet().toFixed(2)}</span>
               </div>
            </div>
          </div>
        </div>
      </AppModal>

      {/* Invoice Print Modal */}
      <AppModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        size="xl"
        title="Tax Invoice"
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
        title="Confirm Sale Cancellation"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">No, Keep Sale</button>
            <button onClick={cancelBill} className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all">Yes, Cancel Sale</button>
          </div>
        }
      >
        <div className="p-8 text-center text-gray-500">
           <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <p className="font-bold text-gray-900 mb-1">Are you sure?</p>
           <p className="text-sm">This will cancel the OTC receipt and return items to stock. This action cannot be undone.</p>
        </div>
      </AppModal>
    </div>
  );
}
