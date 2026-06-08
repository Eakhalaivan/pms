import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

const createEmptyRow = () => ({
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

const getInitialState = () => ({
  // Header State
  visitType: 'OP',
  uhidSearch: '',
  visitSearch: '',

  // Patient Info State
  patientName: 'Walk-in',
  ageSex: '',
  uhid: '',
  doctor: '',
  insurance: '',
  patientType: '',
  pharmacy: 'OP Pharmacy',
  discountType: '%',
  discountCategory: '',
  location: '',
  companyName: '',
  gstNo: '',

  // Patient Autocomplete State
  patientSearchResults: [],
  isSearchingPatient: false,

  // Item rows State
  rows: [createEmptyRow()],
  isGenericSearch: false,
  barcodeSearch: '',

  // Payment State
  paymentType: 'Cash',
  isMultiplePayment: false,
  discount: 0,
  receiptAmount: 0,
  remarks: '',
  saving: false,
});

export const usePOSStore = create((set) => ({
  ...getInitialState(),

  // Generic Field Setter
  setField: (field, value) => set({ [field]: value }),

  // Reset the entire form
  resetForm: () => set(getInitialState()),

  // Row Management
  addRow: () => set((state) => ({ rows: [...state.rows, createEmptyRow()] })),

  removeRow: (idx) => set((state) => {
    if (state.rows.length === 1) return {};
    return { rows: state.rows.filter((_, i) => i !== idx) };
  }),

  resetRow: (idx) => set((state) => {
    const next = [...state.rows];
    next[idx] = createEmptyRow();
    return { rows: next };
  }),

  // Patient Autocomplete Actions
  searchPatients: async (query) => {
    if (query.trim().length < 2) {
      set({ patientSearchResults: [] });
      return;
    }
    set({ isSearchingPatient: true });
    try {
      const res = await pharmacyService.searchPatients(query);
      const data = res?.data || res || [];
      set({ 
        patientSearchResults: Array.isArray(data) ? data : [], 
        isSearchingPatient: false 
      });
    } catch (err) {
      console.error('Error searching patients:', err);
      toast.error('Failed to search patient records');
      set({ patientSearchResults: [], isSearchingPatient: false });
    }
  },

  selectPatient: (patient) => set({
    patientName: patient.name || 'Walk-in',
    uhid: patient.uhid || '',
    uhidSearch: patient.name || '',
    patientSearchResults: []
  }),

  // Handle Typing/Autocomplete Search in Rows
  handleNameChange: async (idx, val) => {
    set((state) => {
      const next = [...state.rows];
      next[idx] = { ...next[idx], codeName: val, searchResults: [] };
      return { rows: next };
    });

    if (val.trim().length < 2) return;

    try {
      const res = await pharmacyService.searchStocks(val);
      const data = res?.data || res || [];
      set((state) => {
        const next = [...state.rows];
        if (next[idx]) {
          next[idx] = { 
            ...next[idx], 
            searchResults: Array.isArray(data) ? data : [] 
          };
        }
        return { rows: next };
      });
    } catch (err) {
      console.error('Error searching stock in store:', err);
      toast.error('Failed to search medicine inventory');
      set((state) => {
        const next = [...state.rows];
        if (next[idx]) {
          next[idx] = { ...next[idx], searchResults: [] };
        }
        return { rows: next };
      });
    }
  },

  // Select item from Autocomplete
  selectStock: (idx, stock) => set((state) => {
    const next = [...state.rows];
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
    return { rows: next };
  }),

  // Update Item Quantity
  updateQty: (idx, val) => set((state) => {
    const next = [...state.rows];
    const qty = parseInt(val) || 0;
    const row = next[idx];
    
    let targetVal = val;
    let targetQty = qty;

    if (row.stockId && qty > row.totalQty) {
      toast.error(`Only ${row.totalQty} items available in stock`);
      targetVal = String(row.totalQty);
      targetQty = row.totalQty;
    }

    next[idx] = { 
      ...next[idx], 
      qty: targetVal,
      amount: next[idx].rate * targetQty 
    };
    return { rows: next };
  }),

  // Update Row-level Discount
  updateRowDiscount: (idx, val) => set((state) => {
    const next = [...state.rows];
    const disc = parseFloat(val) || 0;
    const baseAmt = next[idx].rate * (parseInt(next[idx].qty) || 0);
    const discAmt = (baseAmt * disc) / 100;
    next[idx] = { 
      ...next[idx], 
      discount: val, 
      amount: baseAmt - discAmt 
    };
    return { rows: next };
  }),
}));
