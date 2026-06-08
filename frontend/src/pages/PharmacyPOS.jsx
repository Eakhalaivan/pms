import React, { useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Printer, RotateCcw, Trash2, RefreshCw, Info,
  ChevronDown, AlertCircle, CreditCard, ShoppingCart, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';
import { usePOSStore } from '../store/usePOSStore';

const DOCTORS = ['Dr. Arun Kumar', 'Dr. Priya Sharma', 'Dr. Ramesh Gupta', 'Dr. Meena Iyer'];
const PHARMACIES = ['OP Pharmacy', 'IP Pharmacy', 'Emergency Pharmacy'];
const PATIENT_TYPES = ['General', 'Insurance', 'Corporate', 'Government'];
const DISCOUNT_TYPES = ['%', 'Amount'];
const PAYMENT_TYPES = ['Cash', 'Card', 'UPI', 'Insurance', 'Advance'];

export default function PharmacyPOS() {
  const resetForm = usePOSStore(state => state.resetForm);

  // Reset form when entering the page to avoid stale draft
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-xs">
      <POSHeader />
      <POSPatientDemographics />
      <POSClinicalAlert />
      <POSItemTable />
      <POSFooterPayment />
    </div>
  );
}

// ── 1. Header Component ──────────────────────────────
function POSHeader() {
  const navigate = useNavigate();
  const visitType = usePOSStore(state => state.visitType);
  const uhidSearch = usePOSStore(state => state.uhidSearch);
  const visitSearch = usePOSStore(state => state.visitSearch);
  const patientSearchResults = usePOSStore(state => state.patientSearchResults);
  const searchPatients = usePOSStore(state => state.searchPatients);
  const selectPatient = usePOSStore(state => state.selectPatient);
  const setField = usePOSStore(state => state.setField);

  return (
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
            onChange={e => setField('visitType', e.target.value)}
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
          onChange={e => {
            setField('uhidSearch', e.target.value);
            searchPatients(e.target.value);
          }}
          className="w-full pl-7 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white font-bold"
        />
        {patientSearchResults && patientSearchResults.length > 0 && (
          <div className="absolute z-50 left-0 top-full mt-1 w-full bg-white shadow-2xl border border-gray-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
            {patientSearchResults.map(p => (
              <div
                key={p.id}
                onClick={() => selectPatient(p)}
                className="px-3 py-2 hover:bg-primary hover:text-white cursor-pointer border-b last:border-0 transition-colors text-xs"
              >
                <div className="font-bold">{p.name}</div>
                <div className="text-[10px] opacity-70">
                  UHID: {p.uhid} &nbsp;|&nbsp; Phone: {p.phone}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visit Identifier Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
        <input
          type="text"
          placeholder="Search Your VisitIdentifier..."
          value={visitSearch}
          onChange={e => setField('visitSearch', e.target.value)}
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
  );
}

// ── 2. Patient Demographics Component ────────────────
function POSPatientDemographics() {
  const patientName = usePOSStore(state => state.patientName);
  const doctor = usePOSStore(state => state.doctor);
  const pharmacy = usePOSStore(state => state.pharmacy);
  const location = usePOSStore(state => state.location);
  const insurance = usePOSStore(state => state.insurance);
  const discountType = usePOSStore(state => state.discountType);
  const companyName = usePOSStore(state => state.companyName);
  const patientType = usePOSStore(state => state.patientType);
  const discountCategory = usePOSStore(state => state.discountCategory);
  const gstNo = usePOSStore(state => state.gstNo);
  const setField = usePOSStore(state => state.setField);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="grid grid-cols-3 gap-x-6 gap-y-2">
        {/* Col 1 */}
        <div className="space-y-2">
          <FormRow label="Patient Name">
            <span className="pl-2 py-1 text-gray-700 font-medium">{patientName || ':'}</span>
          </FormRow>
          <FormRow label="Doctor">
            <SelectField value={doctor} onChange={val => setField('doctor', val)} options={DOCTORS} placeholder="Select Doctor" />
          </FormRow>
          <FormRow label="Pharmacy">
            <SelectField value={pharmacy} onChange={val => setField('pharmacy', val)} options={PHARMACIES} placeholder="Select Pharmacy" />
          </FormRow>
          <FormRow label="Location">
            <SelectField value={location} onChange={val => setField('location', val)} options={['Ward A', 'Ward B', 'OPD']} placeholder="Select" />
          </FormRow>
        </div>

        {/* Col 2 */}
        <div className="space-y-2">
          <FormRow label="Age / Sex">
            <span className="pl-2 py-1 text-gray-700">: /</span>
          </FormRow>
          <FormRow label="Insurance*">
            <SelectField value={insurance} onChange={val => setField('insurance', val)} options={['None', 'Star Health', 'HDFC Ergo', 'LIC HFL']} placeholder="" />
          </FormRow>
          <FormRow label="Discount Type">
            <SelectField value={discountType} onChange={val => setField('discountType', val)} options={DISCOUNT_TYPES} placeholder="" />
          </FormRow>
          <FormRow label="Company Name">
            <input
              type="text"
              value={companyName}
              onChange={e => setField('companyName', e.target.value)}
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
            <SelectField value={patientType} onChange={val => setField('patientType', val)} options={PATIENT_TYPES} placeholder="Please Select" />
          </FormRow>
          <FormRow label="Discount Category*">
            <SelectField value={discountCategory} onChange={val => setField('discountCategory', val)} options={['None', 'Staff', 'Senior Citizen']} placeholder="" />
          </FormRow>
          <FormRow label="GST No">
            <input
              type="text"
              value={gstNo}
              onChange={e => setField('gstNo', e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </FormRow>
        </div>
      </div>
    </div>
  );
}

// ── 3. Clinical Alert & Barcode Component ────────────
function POSClinicalAlert() {
  const isGenericSearch = usePOSStore(state => state.isGenericSearch);
  const barcodeSearch = usePOSStore(state => state.barcodeSearch);
  const setField = usePOSStore(state => state.setField);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
      <span className="text-red-600 font-bold text-xs flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" /> Clinical Alert Type :
      </span>
      <label className="flex items-center gap-1.5 text-gray-600 font-semibold cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isGenericSearch}
          onChange={e => setField('isGenericSearch', e.target.checked)}
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
          onChange={e => setField('barcodeSearch', e.target.value)}
          className="w-full pl-7 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
        />
      </div>
    </div>
  );
}

// ── 4. Item Table Component ──────────────────────────
function POSItemTable() {
  // We serialize row IDs to prevent re-renders when data inside rows changes
  const rowIdsStr = usePOSStore(state => state.rows.map(r => r.id).join(','));
  const addRow = usePOSStore(state => state.addRow);

  const rowIds = rowIdsStr ? rowIdsStr.split(',') : [];

  return (
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
          {rowIds.map((id, idx) => (
            <POSItemRow key={id} idx={idx} />
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
  );
}

// ── 5. Memoized Row Component (Crucial for performance) ──
const POSItemRow = memo(function POSItemRow({ idx }) {
  const row = usePOSStore(state => state.rows[idx]);
  const handleNameChange = usePOSStore(state => state.handleNameChange);
  const selectStock = usePOSStore(state => state.selectStock);
  const updateQty = usePOSStore(state => state.updateQty);
  const updateRowDiscount = usePOSStore(state => state.updateRowDiscount);
  const resetRow = usePOSStore(state => state.resetRow);
  const removeRow = usePOSStore(state => state.removeRow);

  if (!row) return null;

  return (
    <tr className="border-b border-gray-100 hover:bg-blue-50/30">
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
        {row.searchResults && row.searchResults.length > 0 && (
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
          onChange={e => updateRowDiscount(idx, e.target.value)}
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
  );
});

// ── 6. Footer Payment & Calculations Component ───────
function POSFooterPayment() {
  const navigate = useNavigate();
  const discountType = usePOSStore(state => state.discountType);
  const isMultiplePayment = usePOSStore(state => state.isMultiplePayment);
  const paymentType = usePOSStore(state => state.paymentType);
  const discount = usePOSStore(state => state.discount);
  const receiptAmount = usePOSStore(state => state.receiptAmount);
  const remarks = usePOSStore(state => state.remarks);
  const saving = usePOSStore(state => state.saving);
  
  const patientName = usePOSStore(state => state.patientName);
  const doctor = usePOSStore(state => state.doctor);
  const rows = usePOSStore(state => state.rows);
  const setField = usePOSStore(state => state.setField);
  const resetForm = usePOSStore(state => state.resetForm);

  // ── Derived Calculations ──────────────────────────────
  const grossAmount = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const discountAmt = discountType === '%'
    ? (grossAmount * Number(discount)) / 100
    : Number(discount);
  const netAmount = Math.max(0, grossAmount - discountAmt);
  const refund = Math.max(0, Number(receiptAmount) - netAmount);
  const overallDue = Math.max(0, netAmount - Number(receiptAmount));

  // ── Save Action ───────────────────────────────────────────────
  const saveBill = async () => {
    if (!patientName.trim()) { toast.error('Patient name is required'); return; }
    const validItems = rows.filter(r => r.stockId && r.qty > 0);
    if (validItems.length === 0) { toast.error('Add at least one medicine'); return; }

    setField('saving', true);
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
        resetForm();
        navigate('/sales');
      } else {
        toast.error(res?.message || 'Failed to save bill');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save bill');
    } finally {
      setField('saving', false);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex gap-6 flex-wrap">

        {/* Left: Links + Payment Config */}
        <div className="flex-1 min-w-[320px] space-y-3">
          <div className="flex items-center gap-4">
            <button className="text-blue-600 font-bold hover:underline text-xs">Pending Prescriptions()</button>
            <button className="text-blue-600 font-bold hover:underline text-xs">PendingBills()</button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 items-end">
            {/* Discount Type */}
            <div className="space-y-0.5">
              <label className="text-gray-500 font-semibold text-[10px] uppercase">Discount Type</label>
              <SelectField value={discountType} onChange={val => setField('discountType', val)} options={DISCOUNT_TYPES} placeholder="" />
            </div>

            {/* Multiple Payment */}
            <label className="flex items-center gap-1.5 text-gray-600 font-semibold cursor-pointer text-[11px] pb-1">
              <input
                type="checkbox"
                checked={isMultiplePayment}
                onChange={e => setField('isMultiplePayment', e.target.checked)}
                className="w-3 h-3 accent-primary"
              />
              Is Multiple Payment
            </label>

            {/* Payment Type */}
            <div className="space-y-0.5">
              <label className="text-gray-500 font-semibold text-[10px] uppercase">Payment Type <span className="text-red-500">*</span></label>
              <SelectField value={paymentType} onChange={val => setField('paymentType', val)} options={PAYMENT_TYPES} placeholder="" />
            </div>
          </div>

          <div className="flex gap-6 items-end flex-wrap">
            <div className="space-y-0.5">
              <label className="text-gray-500 font-semibold text-[10px] uppercase">Discount</label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={e => setField('discount', e.target.value)}
                className="w-24 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-gray-500 font-semibold text-[10px] uppercase">Receipt Amount</label>
              <input
                type="number"
                min={0}
                value={receiptAmount}
                onChange={e => setField('receiptAmount', e.target.value)}
                className="w-32 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-gray-500 font-semibold text-[10px] uppercase">Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setField('remarks', e.target.value)}
              placeholder="Remarks..."
              className="w-full max-w-sm border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Right: Summary Panel */}
        <div className="w-56 flex-shrink-0">
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
