import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Pill, Trash2, Edit3, Save, XCircle, Calendar, Barcode } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import pharmacyService from '../utils/pharmacyService';

export default function MedicineStock() {
  const location = useLocation();
  const [stocks, setStocks] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    medicine: { id: null },
    batchNumber: '',
    expiryDate: '',
    quantityAvailable: 0,
    purchaseRate: 0,
    sellingRate: 0
  });

  useEffect(() => {
    fetchStocks();
    fetchMedicines();
    
    // Handle pre-fill from dashboard
    if (location.state?.prefill) {
      setIsEditMode(false);
      setFormData(prev => ({
        ...prev,
        medicine: { id: location.state.medicineId },
        quantityAvailable: location.state.requiredQty || 100,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        batchNumber: `AUTO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      }));
      setIsModalOpen(true);
    }
  }, [location]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const response = await pharmacyService.getAllStocks();
      if (response.success) {
        setStocks(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch stock entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await pharmacyService.getMedicines();
      if (response.success) {
        setMedicines(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch medicines');
    }
  };

  const handleSave = async () => {
    if (!formData.medicine.id || !formData.batchNumber || formData.quantityAvailable <= 0) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const response = await pharmacyService.addStock(formData);
      if (response.success) {
        toast.success(isEditMode ? 'Stock updated successfully!' : 'Stock added successfully!');
        closeModal();
        fetchStocks();
      }
    } catch (error) {
      toast.error('Failed to save stock');
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      medicine: { id: medicines[0]?.id || null },
      batchNumber: '',
      expiryDate: new Date().toISOString().split('T')[0],
      quantityAvailable: 100,
      purchaseRate: 0,
      sellingRate: 0
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const filteredStocks = stocks.filter(s => {
    const term = searchTerm.toLowerCase();
    return !searchTerm || 
      s.medicine?.name?.toLowerCase().includes(term) || 
      s.batchNumber?.toLowerCase().includes(term);
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { 
        header: 'Medicine Name', 
        render: (row) => (
            <div className="flex flex-col">
                <span className="font-bold text-slate-800">{row.medicine?.name}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">{row.medicine?.category}</span>
            </div>
        )
    },
    { header: 'Batch Number', accessor: 'batchNumber', className: 'font-mono font-bold text-blue-600' },
    { 
        header: 'Expiry Date', 
        render: (row) => {
            const isExpired = new Date(row.expiryDate) < new Date();
            return (
                <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className={isExpired ? "text-red-500 font-bold" : "text-slate-600"}>{row.expiryDate}</span>
                </div>
            )
        }
    },
    { 
      header: 'Available Qty', 
      render: (row) => (
        <Badge variant={row.quantityAvailable <= (row.medicine?.reorderLevel || 10) ? "danger" : "success"}>
          {row.quantityAvailable} {row.medicine?.unit || 'Units'}
        </Badge>
      )
    },
    { header: 'Purchase Rate', render: (row) => `₹${row.purchaseRate}` },
    { header: 'Selling Rate', render: (row) => <span className="font-bold text-slate-900">₹{row.sellingRate}</span> },
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="Edit" 
          onClick={() => {
            setIsEditMode(true);
            setFormData({
                id: row.id,
                medicine: { id: row.medicine?.id },
                batchNumber: row.batchNumber,
                expiryDate: row.expiryDate,
                quantityAvailable: row.quantityAvailable,
                purchaseRate: row.purchaseRate,
                sellingRate: row.sellingRate
            });
            setIsModalOpen(true);
          }}
          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Stock Management</h2>
        <p className="text-sm text-gray-500 font-medium">Update medicine counts, manage batches and expiry dates</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        actions={[
          { label: 'Add Stock Entry', icon: Plus, variant: 'primary', onClick: openAddModal }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredStocks} hover striped />
        <Pagination totalRecords={filteredStocks.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={isEditMode ? "Update Stock Batch" : "Add New Stock Entry"}
        maxWidth="sm:max-w-2xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={closeModal} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={handleSave} className="flex-1 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Save className="w-4 h-4"/> {isEditMode ? 'Update Batch' : 'Save Stock'}
             </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
           <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Select Medicine *</label>
              <select 
                value={formData.medicine.id || ''}
                onChange={(e) => setFormData({...formData, medicine: { id: parseInt(e.target.value) }})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold"
              >
                <option value="" disabled>Choose a medicine...</option>
                {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.genericName})</option>
                ))}
              </select>
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Batch Number *</label>
              <input 
                type="text" 
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                placeholder="e.g. BTCH123" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-mono font-bold" 
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Expiry Date *</label>
              <input 
                type="date" 
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quantity Available *</label>
              <input 
                type="number" 
                value={formData.quantityAvailable}
                onChange={(e) => setFormData({...formData, quantityAvailable: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold text-primary" 
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Purchase Rate (Unit)</label>
              <input 
                type="number" 
                value={formData.purchaseRate}
                onChange={(e) => setFormData({...formData, purchaseRate: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Selling Rate (Unit)</label>
              <input 
                type="number" 
                value={formData.sellingRate}
                onChange={(e) => setFormData({...formData, sellingRate: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold text-green-600" 
              />
           </div>
        </div>
      </AppModal>
    </div>
  );
}
