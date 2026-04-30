import api from './api';

const pharmacyService = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/pharmacy/dashboard');
    return response.data;
  },
  getRecentActivities: async () => {
    const response = await api.get('/pharmacy/dashboard/recent-activities');
    return response.data;
  },
  getChartData: async () => {
    const response = await api.get('/pharmacy/dashboard/chart-data');
    return response.data;
  },

  // Sales
  getSales: async () => {
    const response = await api.get('/pharmacy/sales');
    return response.data;
  },
  getSaleByNumber: async (billNumber) => {
    const response = await api.get(`/pharmacy/sales/number/${billNumber}`);
    return response.data;
  },
  createSale: async (saleData) => {
    const response = await api.post('/pharmacy/sales', saleData);
    return response.data;
  },
  deleteSale: async (id) => {
    const response = await api.delete(`/pharmacy/sales/${id}`);
    return response.data;
  },

  // Returns
  getPendingReturns: async () => {
    const response = await api.get('/pharmacy/returns/pending');
    return response.data;
  },
  getAllReturns: async () => {
    const response = await api.get('/pharmacy/returns');
    return response.data;
  },
  initiateReturn: async (billId, items, reason) => {
    const response = await api.post(`/pharmacy/returns/initiate/${billId}?reason=${reason}`, items);
    return response.data;
  },
  approveReturn: async (id) => {
    const response = await api.post(`/pharmacy/returns/${id}/approve`);
    return response.data;
  },
  rejectReturn: async (id) => {
    const response = await api.post(`/pharmacy/returns/${id}/reject`);
    return response.data;
  },

  // Credit Bills
  getCreditBills: async () => {
    const response = await api.get('/pharmacy/credit-bills');
    return response.data;
  },
  addCreditPayment: async (id, amount, mode, reference) => {
    const response = await api.post(`/pharmacy/credit-bills/${id}/payment?amount=${amount}&mode=${mode}&reference=${reference || ''}`);
    return response.data;
  },

  // Search
  searchStocks: async (name) => {
    const response = await api.get(`/pharmacy/stocks/search?name=${name}`);
    return response.data;
  },
  getAllStocks: async () => {
    const response = await api.get('/pharmacy/stocks');
    return response.data;
  },
  addStock: async (stockData) => {
    const response = await api.post('/pharmacy/stocks', stockData);
    return response.data;
  },
  getStockByBarcode: async (barcode) => {
    const response = await api.get(`/pharmacy/stocks/barcode/${barcode}`);
    return response.data;
  },
  searchPatients: async (query) => {
    const response = await api.get(`/pharmacy/patients/search?query=${query}`);
    return response.data;
  },
  
  // Advances
  getAllAdvances: async () => {
    const response = await api.get('/pharmacy/advances');
    return response.data;
  },
  addAdvance: async (patientName, amount, patientId) => {
    const response = await api.post(`/pharmacy/advances?patientName=${patientName}&amount=${amount}${patientId ? `&patientId=${patientId}` : ''}`);
    return response.data;
  },

  // Prescriptions
  getPendingPrescriptions: async () => {
    const response = await api.get('/pharmacy/prescriptions/pending');
    return response.data;
  },
  // Medicine Master
  getMedicines: async () => {
    const response = await api.get('/pharmacy/medicines');
    return response.data;
  },
  createMedicine: async (medicineData) => {
    const response = await api.post('/pharmacy/medicines', medicineData);
    return response.data;
  },
  updateMedicine: async (id, medicineData) => {
    const response = await api.put(`/pharmacy/medicines/${id}`, medicineData);
    return response.data;
  },

  // Users
  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  // Suppliers
  getSuppliers: async () => {
    const response = await api.get('/pharmacy/suppliers');
    return response.data;
  },
  createSupplier: async (data) => {
    const response = await api.post('/pharmacy/suppliers', data);
    return response.data;
  },
  updateSupplier: async (id, data) => {
    const response = await api.put(`/pharmacy/suppliers/${id}`, data);
    return response.data;
  },
  deleteSupplier: async (id) => {
    const response = await api.delete(`/pharmacy/suppliers/${id}`);
    return response.data;
  },

  // Patients
  getPatients: async () => {
    const response = await api.get('/pharmacy/patients');
    return response.data;
  },
  createPatient: async (data) => {
    const response = await api.post('/pharmacy/patients', data);
    return response.data;
  },
  updatePatient: async (id, data) => {
    const response = await api.put(`/pharmacy/patients/${id}`, data);
    return response.data;
  },
  deletePatient: async (id) => {
    const response = await api.delete(`/pharmacy/patients/${id}`);
    return response.data;
  },

  // Reports
  getSalesReport: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/sales?from=${from}&to=${to}`);
    return response.data;
  },
  getTaxReport: async (from, to) => {
    const response = await api.get(`/pharmacy/reports/tax?from=${from}&to=${to}`);
    return response.data;
  },
  getStockReport: async () => {
    const response = await api.get('/pharmacy/reports/stock');
    return response.data;
  },
  getExpiryReport: async (days) => {
    const response = await api.get(`/pharmacy/reports/expiry?days=${days}`);
    return response.data;
  },

  api
};

export default pharmacyService;
