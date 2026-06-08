import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePOSStore } from '../../store/usePOSStore';
import pharmacyService from '../../utils/pharmacyService';
import { toast } from 'react-hot-toast';

vi.mock('../../utils/pharmacyService', () => ({
  default: {
    searchPatients: vi.fn(),
    searchStocks: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('usePOSStore', () => {
  beforeEach(() => {
    // Reset state before each test
    usePOSStore.getState().resetForm();
    vi.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const state = usePOSStore.getState();
    expect(state.patientName).toBe('Walk-in');
    expect(state.rows.length).toBe(1);
    expect(state.paymentType).toBe('Cash');
    expect(state.discount).toBe(0);
    expect(state.saving).toBe(false);
  });

  it('should add a row', () => {
    usePOSStore.getState().addRow();
    const state = usePOSStore.getState();
    expect(state.rows.length).toBe(2);
  });

  it('should remove a row if more than 1 row exists', () => {
    usePOSStore.getState().addRow();
    expect(usePOSStore.getState().rows.length).toBe(2);

    usePOSStore.getState().removeRow(0);
    expect(usePOSStore.getState().rows.length).toBe(1);
  });

  it('should not remove a row if only 1 row exists', () => {
    usePOSStore.getState().removeRow(0);
    expect(usePOSStore.getState().rows.length).toBe(1);
  });

  it('should cap the quantity to stock available and alert user', () => {
    const mockStock = {
      id: 123,
      quantityAvailable: 5,
      sellingRate: 10,
      batchNumber: 'B1',
      expiryDate: '2026-12-31',
      medicine: {
        name: 'Paracetamol',
        unit: 'Tab',
        taxPercentage: 12,
      },
    };

    // First select stock
    usePOSStore.getState().selectStock(0, mockStock);
    let state = usePOSStore.getState();
    expect(state.rows[0].stockId).toBe(123);
    expect(state.rows[0].totalQty).toBe(5);

    // Try to set quantity to 10
    usePOSStore.getState().updateQty(0, '10');
    state = usePOSStore.getState();
    
    // Quantity should be capped to 5
    expect(state.rows[0].qty).toBe('5');
    expect(state.rows[0].amount).toBe(50); // rate 10 * qty 5
    expect(toast.error).toHaveBeenCalledWith('Only 5 items available in stock');
  });

  it('should successfully search and select a patient', async () => {
    const mockPatients = [
      { id: 1, name: 'John Doe', uhid: 'UHID001', phone: '1234567890' }
    ];
    pharmacyService.searchPatients.mockResolvedValue({ data: mockPatients });

    await usePOSStore.getState().searchPatients('John');
    
    let state = usePOSStore.getState();
    expect(state.patientSearchResults).toEqual(mockPatients);

    // Select patient
    usePOSStore.getState().selectPatient(mockPatients[0]);
    state = usePOSStore.getState();

    expect(state.patientName).toBe('John Doe');
    expect(state.uhid).toBe('UHID001');
    expect(state.uhidSearch).toBe('John Doe');
    expect(state.patientSearchResults.length).toBe(0);
  });
});
