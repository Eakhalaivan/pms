import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Printer, RotateCcw, Trash2, RefreshCw, Info, X,
  ChevronDown, AlertCircle, CreditCard, ShoppingCart, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

const DOCTORS = ['Dr. Arun Kumar', 'Dr. Priya Sharma', 'Dr. Ramesh Gupta', 'Dr. Meena Iyer'];
const PHARMACIES = ['OP Pharmacy', 'IP Pharmacy', 'Emergency Pharmacy'];
const PATIENT_TYPES = ['General', 'Insurance', 'Corporate', 'Government'];
const DISCOUNT_TYPES = ['%', 'Amount'];
const PAYMENT_TYPES = ['Cash', 'Card', 'UPI', 'Insurance', 'Advance'];

const emptyRow = () => ({
  id: Date.now() + Math.random(),
  stockId: null,
  codeName: '',
  genericName: '',
  uom: '',
  rack: '',
  totalQty: 0,
  batchQty: 0,
  qty: '',
  batchNo: '',
  expiryDate: '',
  rate: 0.0,
  gst: 0,
  discount: '',
  amount: 0.0,
  searchResults: [],
});

export default function PharmacyPOS() {
  const navigate = useNavigate();

  // Header state
  const [visitType, setVisitType] = useState('OP');
  const [uhidSearch, setUhidSearch] = useState('');
  const [visitSearch, setVisitSearch] = useState('');

  // Patient info
  const [patientName, setPatientName] = useState('');
  const [ageSex, setAgeSex] = useState('');
  const [uhid, setUhid] = useState('');
  const [doctor, setDoctor] = useState('');
  const [insurance, setInsurance] = useState('');
  const [patientType, setPatientType] = useState('');
  const [pharmacy, setPharmacy] = useState('OP Pharmacy');
  const [discountType, setDiscountType] = useState('%');
  const [discountCategory, setDiscountCategory] = useState('');
  const [location, setLocation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstNo, setGstNo] = useState('');

  // Item rows
  const [rows, setRows] = useState([emptyRow()]);
  const [isGenericSearch, setIsGenericSearch] = useState(false);
  const [barcodeSearch, setBarcodeSearch] = useState('');

  // Payment
  const [paymentType, setPaymentType] = useState('Cash');
  const [isMultiplePayment, setIsMultiplePayment] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [receiptAmount, setReceiptAmount] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Calculations ──────────────────────────────────────────────
  const grossAmount = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discountAmt = discountType === '%'
    ? (grossAmount * Number(discount)) / 100
    : Number(discount);
  const netAmount = Math.max(0, grossAmount - discountAmt);
  const refund = Math.max(0, Number(receiptAmount) - netAmount);
  const overallDue = Math.max(0, netAmount - Number(receiptAmount));

  // ── Row helpers ───────────────────────────────────────────────
  const handleNameChange = useCallback(async (idx, val) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], codeName: val, searchResults: [] };
      return next;
    });
    if (val.length < 2) return;
    try {
      const res = await pharmacyService.searchStocks(val);
      const data = res?.data || res || [];
      setRows(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], searchResults: Array.isArray(data) ? data : [] };
        return next;
      });
    } catch (_) {}
  }, []);

  const selectStock = (idx, stock) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        stockId: stock.id,
        codeName: stock.medicine?.name || '',
        genericName: stock.medicine?.genericName || '',
        uom: stock.medicine?.unit || '',
        rack: '',
        totalQty: stock.quantityAvailable || 0,
        batchQty: stock.quantityAvailable || 0,
        batchNo: stock.batchNumber || '',
        expiryDate: stock.expiryDate || '',
        rate: stock.sellingRate || 0,
        gst: stock.medicine?.taxPercentage || 0,
        qty: 1,
        amount: stock.sellingRate || 0,
        searchResults: [],
      };
      return next;
    });
  };

  const updateQty = (idx, val) => {
    setRows(prev => {
      const next = [...prev];
      const qty = parseInt(val) || 0;
      next[idx] = { ...next[idx], qty, amount: next[idx].rate * qty };
      return next;
    });
  };

  const updateDiscount = (idx, val) => {
    setRows(prev => {
      const next = [...prev];
      const disc = parseFloat(val) || 0;
      const baseAmt = next[idx].rate * (next[idx].qty || 0);
      const discAmt = (baseAmt * disc) / 100;
      next[idx] = { ...next[idx], discount: val, amount: baseAmt - discAmt };
      return next;
    });
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const removeRow = (idx) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const resetRow = (idx) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = emptyRow();
      return next;
    });
  };

  // ── Save Bill ─────────────────────────────────────────────────
  const saveBill = async () => {
    if (!patientName.trim()) { toast.error('Patient name is required'); return; }
    const validItems = rows.filter(r => r.stockId && r.qty > 0);
    if (validItems.length === 0) { toast.error('Add at least one medicine'); return; }

    setSaving(true);
    try {
      const payload = {
        patientName,
        doctorName: doctor,
        items: validItems.map(r => ({ stockId: r.stockId, quantity: Number(r.qty) })),
        paymentMode: paymentType.toUpperCase(),
        discountAmount: discountAmt,
        amountPaid: Number(receiptAmount) || netAmount,
        useAdvance: false,
      };
      const res = await pharmacyService.createSale(payload);
      if (res?.success) {
        toast.success('Bill saved successfully!');
        navigate('/sales');
      } else {
        toast.error(res?.message || 'Failed to save bill');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-xs">

      {/* ── Top Header Bar ─────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 flex-wrap shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors font-bold mr-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-sm font-black text-gray-800 tracking-tight whitespace-nowrap">Pharmacy Sales</h1>

        {/* Visit Type */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-gray-500 font-semibold whitespace-nowrap">Visit Type</span>
          <div className="relative">
            <select
              value={visitType}
              onChange={e => setVisitType(e.target.value)}
              className="appearance-none pl-2 pr-6 py-1 border border-gray-300 rounded text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option>OP</option>
              <option>IP</option>
              <option>Emergency</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* UHID Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Name/Phone/UHID..."
            value={uhidSearch}
            onChange={e => setUhidSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          />
        </div>

        {/* Visit Identifier Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Your VisitIdentifier..."
            value={visitSearch}
            onChange={e => setVisitSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          />
        </div>

        {/* Action Buttons */}
        <button className="px-3 py-1 bg-slate-700 text-white rounded text-xs font-bold hover:bg-slate-600 whitespace-nowrap flex items-center gap-1 transition-colors">
          <CreditCard className="w-3 h-3" /> Credit Bills
        </button>
        <button className="px-3 py-1 bg-slate-700 text-white rounded text-xs font-bold hover:bg-slate-600 whitespace-nowrap flex items-center gap-1 transition-colors">
          <ShoppingCart className="w-3 h-3" /> Direct Sales
        </button>
      </div>

      {/* ── Patient Demographics ───────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="grid grid-cols-3 gap-x-6 gap-y-2">
          {/* Col 1 */}
          <div className="space-y-2">
            <FormRow label="Patient Name">
              <span className="pl-2 py-1 text-gray-700 font-medium">{patientName || ':'}</span>
            </FormRow>
            <FormRow label="Doctor">
              <SelectField value={doctor} onChange={setDoctor} options={DOCTORS} placeholder="Select Doctor" />
            </FormRow>
            <FormRow label="Pharmacy">
              <SelectField value={pharmacy} onChange={setPharmacy} options={PHARMACIES} placeholder="Select Pharmacy" />
            </FormRow>
            <FormRow label="Location">
              <SelectField value={location} onChange={setLocation} options={['Ward A', 'Ward B', 'OPD']} placeholder="Select" />
            </FormRow>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <FormRow label="Age / Sex">
              <span className="pl-2 py-1 text-gray-700">: /</span>
            </FormRow>
            <FormRow label="Insurance*">
              <SelectField value={insurance} onChange={setInsurance} options={['None', 'Star Health', 'HDFC Ergo', 'LIC HFL']} placeholder="" />
            </FormRow>
            <FormRow label="Discount Type">
              <SelectField value={discountType} onChange={setDiscountType} options={DISCOUNT_TYPES} placeholder="" />
            </FormRow>
            <FormRow label="Company Name">
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </FormRow>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <FormRow label="UHID">
              <span className="pl-2 py-1 text-gray-700">:</span>
            </FormRow>
            <FormRow label="Patient Type">
              <SelectField value={patientType} onChange={setPatientType} options={PATIENT_TYPES} placeholder="Please Select" />
            </FormRow>
            <FormRow label="Discount Category*">
              <SelectField value={discountCategory} onChange={setDiscountCategory} options={['None', 'Staff', 'Senior Citizen']} placeholder="" />
            </FormRow>
            <FormRow label="GST No">
              <input
                type="text"
                value={gstNo}
                onChange={e => setGstNo(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </FormRow>
          </div>
        </div>
      </div>

      {/* ── Clinical Alert & Barcode Row ──────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
        <span className="text-red-600 font-bold text-xs flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> Clinical Alert Type :
        </span>
        <label className="flex items-center gap-1.5 text-gray-600 font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isGenericSearch}
            onChange={e => setIsGenericSearch(e.target.checked)}
            className="w-3 h-3 accent-primary"
          />
          Is Generic Search
        </label>
        <div className="flex-1 relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Your Barcode Here..."
            value={barcodeSearch}
            onChange={e => setBarcodeSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          />
        </div>
      </div>

      {/* ── Medicine Items Table ───────────────────── */}
      <div className="bg-white border-b border-gray-200 flex-1 overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase tracking-wider font-bold">
              <th className="px-2 py-2 text-center w-8 border-r border-gray-200">#</th>
              <th className="px-2 py-2 text-left border-r border-gray-200 w-40">Code / Name</th>
              <th className="px-2 py-2 text-left border-r border-gray-200 w-32">Generic Name</th>
              <th className="px-2 py-2 text-center border-r border-gray-200 w-16">UOM</th>
              <th className="px-2 py-2 text-center border-r border-gray-200 w-14">Rack</th>
              <th className="px-2 py-2 text-center border-r border-gray-200 w-16">Total Qty</th>
              <th className="px-2 py-2 text-center border-r border-gray-200 w-16">Batch Qty</th>
              <th className="px-2 py-2 text-center border-r border-gray-200 w-14">Qty</th>
              <th className="px-2 py-2 text-center border-r border-gray-200 w-20">Batch #</th>
              <th className="px-2 py-2 text-center border-r border-gray-200 w-24">Expiry Date</th>
              <th className="px-2 py-2 text-right border-r border-gray-200 w-20">Rate</th>
              <th className="px-2 py-2 text-center border-r border-gray-200 w-14">GST(%)</th>
              <th className="px-2 py-2 text-center border-r border-gray-200 w-16">Discount</th>
              <th className="px-2 py-2 text-right border-r border-gray-200 w-20">Amount</th>
              <th className="px-2 py-2 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-blue-50/30">
                {/* # */}
                <td className="px-2 py-1.5 text-center text-gray-500 border-r border-gray-100">{idx + 1}</td>

                {/* Code / Name with autocomplete */}
                <td className="px-2 py-1.5 border-r border-gray-100 relative">
                  <input
                    type="text"
                    value={row.codeName}
                    onChange={e => handleNameChange(idx, e.target.value)}
                    placeholder="Search medicine..."
                    className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary text-gray-800"
                  />
                  {row.searchResults.length > 0 && (
                    <div className="absolute z-50 left-0 top-full mt-0.5 w-72 bg-white shadow-2xl border border-gray-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                      {row.searchResults.map(stock => (
                        <div
                          key={stock.id}
                          onClick={() => selectStock(idx, stock)}
                          className="px-3 py-2 hover:bg-primary hover:text-white cursor-pointer border-b last:border-0 transition-colors"
                        >
                          <div className="font-bold">{stock.medicine?.name}</div>
                          <div className="text-[10px] opacity-70">
                            Batch: {stock.batchNumber} &nbsp;|&nbsp; Exp: {stock.expiryDate} &nbsp;|&nbsp; Qty: {stock.quantityAvailable} &nbsp;|&nbsp; ₹{stock.sellingRate}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                {/* Generic Name */}
                <td className="px-2 py-1.5 text-gray-500 border-r border-gray-100">{row.genericName || ''}</td>

                {/* UOM */}
                <td className="px-2 py-1.5 text-center text-gray-500 border-r border-gray-100">{row.uom || ''}</td>

                {/* Rack */}
                <td className="px-2 py-1.5 text-center text-gray-500 border-r border-gray-100">{row.rack || ''}</td>

                {/* Total Qty */}
                <td className="px-2 py-1.5 text-center text-gray-600 border-r border-gray-100">{row.totalQty || 0}</td>

                {/* Batch Qty */}
                <td className="px-2 py-1.5 text-center text-gray-600 border-r border-gray-100">{row.batchQty || 0}</td>

                {/* Qty */}
                <td className="px-2 py-1.5 border-r border-gray-100">
                  <input
                    type="number"
                    min={0}
                    value={row.qty}
                    onChange={e => updateQty(idx, e.target.value)}
                    className="w-full text-center bg-white border border-red-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary text-red-600 font-bold"
                  />
                </td>

                {/* Batch # */}
                <td className="px-2 py-1.5 text-center text-gray-600 uppercase border-r border-gray-100">{row.batchNo || ''}</td>

                {/* Expiry Date */}
                <td className="px-2 py-1.5 text-center text-gray-600 border-r border-gray-100">{row.expiryDate || ''}</td>

                {/* Rate */}
                <td className="px-2 py-1.5 text-right text-gray-700 border-r border-gray-100">
                  ₹ {Number(row.rate || 0).toFixed(2)}
                </td>

                {/* GST(%) */}
                <td className="px-2 py-1.5 text-center text-gray-600 border-r border-gray-100">{row.gst || 0}</td>

                {/* Discount */}
                <td className="px-2 py-1.5 border-r border-gray-100">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.discount}
                    onChange={e => updateDiscount(idx, e.target.value)}
                    className="w-full text-center bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </td>

                {/* Amount */}
                <td className="px-2 py-1.5 text-right font-bold text-gray-800 border-r border-gray-100">
                  ₹ {Number(row.amount || 0).toFixed(2)}
                </td>

                {/* Action */}
                <td className="px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => resetRow(idx)} title="Reset" className="p-0.5 text-gray-400 hover:text-blue-500 transition-colors">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button title="Info" className="p-0.5 text-gray-400 hover:text-indigo-500 transition-colors">
                      <Info className="w-3 h-3" />
                    </button>
                    <button onClick={() => resetRow(idx)} title="Refresh" className="p-0.5 text-gray-400 hover:text-green-500 transition-colors">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeRow(idx)} title="Delete" className="p-0.5 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add Row Button */}
        <button
          onClick={addRow}
          className="w-full py-2 text-primary text-xs font-bold uppercase tracking-widest hover:bg-blue-50 transition-all border-t border-gray-100 flex items-center justify-center gap-1"
        >
          + Add Medicine Row
        </button>
      </div>

      {/* ── Footer: Payment + Summary ─────────────── */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex gap-6 flex-wrap">

          {/* Left: Links + Payment Config */}
          <div className="flex-1 min-w-[320px] space-y-3">
            {/* Links */}
            <div className="flex items-center gap-4">
              <button className="text-blue-600 font-bold hover:underline text-xs">Pending Prescriptions()</button>
              <button className="text-blue-600 font-bold hover:underline text-xs">PendingBills()</button>
            </div>

            {/* Payment Controls Row */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 items-end">
              {/* Discount Type */}
              <div className="space-y-0.5">
                <label className="text-gray-500 font-semibold text-[10px] uppercase">Discount Type</label>
                <SelectField value={discountType} onChange={setDiscountType} options={DISCOUNT_TYPES} placeholder="" />
              </div>

              {/* Multiple Payment */}
              <label className="flex items-center gap-1.5 text-gray-600 font-semibold cursor-pointer text-[11px] pb-1">
                <input
                  type="checkbox"
                  checked={isMultiplePayment}
                  onChange={e => setIsMultiplePayment(e.target.checked)}
                  className="w-3 h-3 accent-primary"
                />
                Is Multiple Payment
              </label>

              {/* Payment Type */}
              <div className="space-y-0.5">
                <label className="text-gray-500 font-semibold text-[10px] uppercase">Payment Type <span className="text-red-500">*</span></label>
                <SelectField value={paymentType} onChange={setPaymentType} options={PAYMENT_TYPES} placeholder="" />
              </div>
            </div>

            {/* Discount + Receipt Amount */}
            <div className="flex gap-6 items-end flex-wrap">
              <div className="space-y-0.5">
                <label className="text-gray-500 font-semibold text-[10px] uppercase">Discount</label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="w-24 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-gray-500 font-semibold text-[10px] uppercase">Receipt Amount</label>
                <input
                  type="number"
                  min={0}
                  value={receiptAmount}
                  onChange={e => setReceiptAmount(e.target.value)}
                  className="w-32 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-0.5">
              <label className="text-gray-500 font-semibold text-[10px] uppercase">Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Remarks..."
                className="w-full max-w-sm border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Right: Summary Panel */}
          <div className="w-56 flex-shrink-0">
            {/* Overall Due Header */}
            <div className="flex justify-between items-center px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-t-lg">
              <span className="text-red-600 font-bold text-[11px] uppercase">Overall Due</span>
              <span className="text-red-600 font-black text-sm">₹ {overallDue.toFixed(2)}</span>
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
              {[
                { label: 'Available Amount', value: '₹ 0.00', className: '' },
                { label: 'Gross Amount', value: `₹ ${grossAmount.toFixed(2)}`, className: '' },
                { label: 'Discount', value: `₹ ${discountAmt.toFixed(2)}`, className: '' },
                { label: 'Net Amount', value: `₹ ${netAmount.toFixed(2)}`, className: '' },
                { label: 'Paid Amount', value: `₹ ${Math.min(Number(receiptAmount), netAmount).toFixed(2)}`, className: '' },
                { label: 'Refund', value: `₹ ${refund.toFixed(2)}`, className: 'text-red-500' },
                { label: 'Tender Amt', value: '', isInput: true },
                { label: 'Return Amt', value: `₹ ${refund.toFixed(2)}`, className: 'text-red-500' },
                { label: 'Overall Due', value: `₹ ${overallDue.toFixed(2)}`, className: '' },
              ].map(({ label, value, className, isInput }) => (
                <div key={label} className="flex items-center justify-between px-3 py-1">
                  <span className="text-gray-600 text-[10px] font-medium">{label}</span>
                  {isInput ? (
                    <input
                      type="number"
                      min={0}
                      defaultValue={0}
                      className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <span className={`text-[11px] font-bold ${className || 'text-gray-700'}`}>{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button className="px-5 py-1.5 border border-blue-300 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print Preview
          </button>
          <button
            onClick={saveBill}
            disabled={saving}
            className="px-7 py-1.5 bg-primary text-white rounded-lg text-xs font-black shadow-lg shadow-primary/25 hover:bg-blue-700 transition-all disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable sub-components ───────────────────────────────────

function FormRow({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 font-semibold text-[11px] w-28 shrink-0 text-right">{label}</span>
      <span className="text-gray-400 shrink-0">:</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full pl-2 pr-6 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary text-gray-700"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
    </div>
  );
}
