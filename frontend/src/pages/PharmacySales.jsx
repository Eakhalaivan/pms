import React, { useState } from 'react';
import { Search, Plus, Eye, Printer, XCircle, Trash2, PlusCircle, Barcode } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';
import PharmacyInvoice from '../components/pharmacy/PharmacyInvoice';
import { usePageData } from '../hooks/usePageData';

export default function PharmacySales() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState(null);
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const { items: salesList, isLoading, page, totalPages, totalElements, goToPage, refetch } = usePageData(
    'pharmacy-sales',
    '/pharmacy/sales',
    { 
      searchTerm, 
      fromDate: dateRange.from?.toISOString(), 
      toDate: dateRange.to?.toISOString() 
    }
  );

  const [salesItems, setSalesItems] = useState([
    { id: 1, stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }
  ]);

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

  const handleBarcodeScan = async (e) => {
    if (e.key === 'Enter' && barcodeInput) {
      try {
        const response = await pharmacyService.getStockByBarcode(barcodeInput);
        if (response && response.success) {
          const stock = response.data;
          const existingIdx = salesItems.findIndex(item => item.stockId === stock.id);
          if (existingIdx > -1) {
            updateQty(salesItems[existingIdx].qty + 1, existingIdx);
          } else {
            const emptyIdx = salesItems.findIndex(item => !item.stockId);
            if (emptyIdx > -1) {
              selectStock(stock, emptyIdx);
            } else {
              const newIdx = salesItems.length;
              setSalesItems([...salesItems, { id: Date.now(), stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }]);
              setTimeout(() => selectStock(stock, newIdx), 0);
            }
          }
          setBarcodeInput('');
          toast.success(`${stock.medicine?.name} added`);
        } else {
          toast.error('Medicine not found for this barcode');
        }
      } catch (error) {
        toast.error('Barcode not found');
      }
    }
  };

  const saveBill = async (options = { shouldPrint: false }) => {
    if (!patientName) { toast.error('Please enter patient name'); return; }
    const validItems = salesItems.filter(i => i.stockId && i.qty > 0);
    if (validItems.length === 0) { toast.error('Add at least one medicine'); return; }

    const payload = {
      patientName,
      patientId,
      doctorName,
      items: validItems.map(item => ({ stockId: item.stockId, quantity: item.qty })),
      paymentMode: paymentMode === 'ADVANCE' ? 'CASH' : paymentMode,
      discountAmount: 0,
      amountPaid: paymentMode === 'ADVANCE' ? 0 : calculateNet(),
      useAdvance: paymentMode === 'ADVANCE'
    };

    try {
      const response = await pharmacyService.createSale(payload);
      if (response) {
        toast.success('Bill saved successfully!');
        setIsModalOpen(false);
        resetModal();
        refetch();
        if (options.shouldPrint) {
          const billData = response.data || response;
          const fullBill = await pharmacyService.getSaleByNumber(billData.billNumber);
          setSelectedInvoice(fullBill.data || fullBill);
          setIsInvoiceModalOpen(true);
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
        refetch();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel bill');
    }
  };

  const resetModal = () => {
    setPatientName('');
    setPatientId(null);
    setPatientSearchResults([]);
    setDoctorName('');
    setPaymentMode('CASH');
    setSalesItems([{ id: 1, stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }]);
  };

  const calculateSubtotal = () => salesItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
  const calculateGST = () => salesItems.reduce((acc, item) => acc + (item.gstAmount || 0), 0);
  const calculateNet = () => salesItems.reduce((acc, item) => acc + (item.amount || 0), 0);

  const columns = [
    { header: 'S.No', render: (_, i) => (page * 20) + i + 1 },
    { header: 'Bill No', accessor: 'billNumber' },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'Bill Date', render: (row) => new Date(row.billingDate).toLocaleDateString('en-IN') },
    { header: 'Total Amount', render: (row) => `₹ ${Number(row.netAmount).toFixed(2)}` },
    { header: 'Payment Mode', render: (row) => row.paymentMode || 'CASH' },
    {
      header: 'Status', render: (row) => (
        <Badge variant={row.status === 'PAID' ? 'success' : row.status === 'CANCELLED' ? 'danger' : 'warning'}>
          {row.status || 'PENDING'}
        </Badge>
      )
    },
    {
      header: 'Action', render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setSelectedInvoice(row); setIsInvoiceModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedInvoice(row); setIsInvoiceModalOpen(true); }} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Printer className="w-4 h-4" />
          </button>
          {row.status !== 'CANCELLED' && (
            <button onClick={() => { setBillToDelete(row.id); setIsDeleteModalOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
              <XCircle className="w-4 h-4" />
            </button>
          )}
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
        {isLoading ? (
          <div className="p-10 text-center text-slate-400 font-semibold animate-pulse">Loading sales...</div>
        ) : (
          <>
            <DataTable columns={columns} data={salesList} hover striped />
            <Pagination
              totalRecords={totalElements}
              currentPage={page + 1}
              pageSize={20}
              onPageChange={(p) => goToPage(p - 1)}
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
            <button onClick={() => { setIsModalOpen(false); resetModal(); }} className="px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Cancel
            </button>
            <div className="flex gap-3">
              <button onClick={() => saveBill({ shouldPrint: false })} className="px-6 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">
                Save Only
              </button>
              <button onClick={() => saveBill({ shouldPrint: true })} className="px-8 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
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
                  placeholder="Search Patient..."
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    if (e.target.value.length >= 2) {
                      pharmacyService.searchPatients(e.target.value).then(res => setPatientSearchResults(res.data || []));
                    } else {
                      setPatientSearchResults([]);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                />
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                {patientSearchResults.length > 0 && (
                  <div className="absolute z-[60] left-0 top-full mt-1 w-full bg-white shadow-2xl border border-blue-100 rounded-xl overflow-hidden">
                    {patientSearchResults.map(p => (
                      <div key={p.id} onClick={() => { setPatientName(p.name); setPatientId(p.id); setPatientSearchResults([]); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase">UHID: {p.uhid} | PHONE: {p.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor Name</label>
              <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Doctor name..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward / OPD</label>
              <input type="text" readOnly value="General OPD" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 outline-none" />
            </div>
          </div>

          {/* Barcode Scan */}
          <div className="bg-blue-600 p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-blue-200">
            <Barcode className="w-6 h-6 text-white" />
            <input
              type="text"
              placeholder="Scan Barcode here..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeScan}
              autoFocus
              className="flex-1 bg-transparent border-b-2 border-white/30 text-white placeholder:text-white/60 py-2 outline-none text-lg font-bold"
            />
          </div>

          {/* Medicine Entry */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white text-[11px] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 text-left">Medicine Name</th>
                    <th className="px-4 py-3 text-left">Batch</th>
                    <th className="px-4 py-3 text-center w-20">Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-center w-16">GST%</th>
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
                          className="w-full bg-transparent outline-none font-medium"
                        />
                        {searchResults.length > 0 && activeSearchIdx === idx && item.name.length > 1 && (
                          <div className="absolute z-50 left-0 top-full mt-1 w-80 bg-white shadow-2xl border border-blue-100 rounded-xl overflow-hidden">
                            {searchResults.map((stock) => (
                              <div key={stock.id} onClick={() => selectStock(stock, idx)} className="px-4 py-3 hover:bg-blue-600 hover:text-white cursor-pointer border-b">
                                <div className="font-bold">{stock.medicine?.name}</div>
                                <div className="text-[10px] opacity-70">BATCH: {stock.batchNumber} | STOCK: {stock.quantityAvailable}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 uppercase">{item.batch || '-'}</td>
                      <td className="px-4 py-3">
                        <input type="number" value={item.qty} onChange={(e) => updateQty(e.target.value, idx)} className="w-full text-center border rounded-lg py-1" />
                      </td>
                      <td className="px-4 py-3 text-right">₹{Number(item.rate).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">{item.gstPercent}%</td>
                      <td className="px-4 py-3 text-right font-bold">₹{Number(item.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setSalesItems(salesItems.filter(s => s.id !== item.id))} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setSalesItems([...salesItems, { id: Date.now(), stockId: null, name: '', batch: '', expiry: '', qty: 1, rate: 0, gstPercent: 0, gstAmount: 0, amount: 0 }])} className="w-full py-3 bg-slate-50 text-primary text-xs font-bold uppercase tracking-widest border-t">
              + Add Medicine Row
            </button>
          </div>

          {/* Summary */}
          <div className="flex flex-col md:flex-row gap-8 items-start justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex-1 space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full max-w-xs px-4 py-2.5 rounded-xl border outline-none">
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="ADVANCE">Advance Adjust</option>
              </select>
            </div>
            <div className="w-full md:w-80 space-y-3 p-4 bg-white rounded-xl shadow-inner border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">GST Amount</span>
                <span className="font-bold text-amber-600">₹{calculateGST().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t font-bold">
                <span className="text-gray-800">Net Amount</span>
                <span className="text-primary">₹{calculateNet().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </AppModal>

      <AppModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} maxWidth="sm:max-w-4xl" padding={false}>
        <PharmacyInvoice bill={selectedInvoice} onClose={() => setIsInvoiceModalOpen(false)} />
      </AppModal>

      <AppModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Cancellation" maxWidth="sm:max-w-md" footer={
          <div className="flex gap-3 w-full">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-6 py-2 border rounded-xl font-bold text-gray-500">No, Keep Bill</button>
            <button onClick={cancelBill} className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200">Yes, Cancel Bill</button>
          </div>
        }>
        <div className="p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Are you sure?</h3>
          <p className="text-gray-500 text-sm">This action will cancel the bill and return stock to inventory.</p>
        </div>
      </AppModal>
    </div>
  );
}
