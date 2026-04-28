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
  
  // Advances
  getAllAdvances: async () => {
    const response = await api.get('/pharmacy/advances');
    return response.data;
  },
  addAdvance: async (patientName, amount) => {
    const response = await api.post(`/pharmacy/advances?patientName=${patientName}&amount=${amount}`);
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

  api
};

export default pharmacyService;
