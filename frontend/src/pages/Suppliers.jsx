import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Trash2, Edit3, Save, XCircle, Phone, MapPin, CreditCard, User } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    gstin: '',
    address: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await pharmacyService.getSuppliers();
      if (response.success) {
        setSuppliers(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error('Supplier name is required');
      return;
    }
    try {
      const response = await pharmacyService.createSupplier(formData);
      if (response.success) {
        toast.success('Supplier added successfully!');
        closeModal();
        fetchSuppliers();
      }
    } catch (error) {
      toast.error('Failed to add supplier');
    }
  };

  const handleUpdate = async () => {
    if (!formData.name) {
      toast.error('Supplier name is required');
      return;
    }
    try {
      const response = await pharmacyService.updateSupplier(selectedSupplier.id, formData);
      if (response.success) {
        toast.success('Supplier updated successfully!');
        closeModal();
        fetchSuppliers();
      }
    } catch (error) {
      toast.error('Failed to update supplier');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const response = await pharmacyService.deleteSupplier(id);
      if (response.success) {
        toast.success('Supplier deleted successfully');
        fetchSuppliers();
      }
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedSupplier(null);
    setFormData({
      name: '',
      contact: '',
      gstin: '',
      address: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setIsEditMode(true);
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact: supplier.contact || '',
      gstin: supplier.gstin || '',
      address: supplier.address || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const q = searchTerm.toLowerCase();
    return !searchTerm || 
      s.name.toLowerCase().includes(q) || 
      s.contact?.toLowerCase().includes(q) ||
      s.gstin?.toLowerCase().includes(q);
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { 
      header: 'Supplier Name', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
            <Truck className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-700">{row.name}</span>
        </div>
      )
    },
    { 
      header: 'Phone / Contact', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3 text-slate-400" />
          <span className="text-sm font-bold text-slate-600">{row.contact || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'GSTIN', 
      render: (row) => (
        <Badge variant="info" className="font-mono">{row.gstin || 'N/A'}</Badge>
      )
    },
    { 
      header: 'Address', 
      render: (row) => (
        <span className="text-xs font-medium text-slate-500 truncate max-w-[200px] block" title={row.address}>
          {row.address || 'N/A'}
        </span>
      )
    },
    { 
      header: 'Status', 
      render: () => <Badge variant="success">Active</Badge>
    },
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="Edit" 
          onClick={() => openEditModal(row)}
          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button 
          title="Delete" 
          onClick={() => handleDelete(row.id)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  if (loading && suppliers.length === 0) return (
    <div className="p-8 flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-slate-500 font-bold italic text-lg">Loading Suppliers...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-display">Suppliers & Manufacturers</h2>
        <p className="text-sm text-gray-500 font-medium">Manage medicine suppliers, contact details, and procurement sources</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        actions={[
          { label: 'Add New Supplier', icon: Plus, variant: 'primary', onClick: openAddModal }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredSuppliers} hover striped />
        <Pagination totalRecords={filteredSuppliers.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>

      {/* Add/Edit Modal */}
      <AppModal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={isEditMode ? "Edit Supplier Details" : "Register New Supplier"}
        maxWidth="sm:max-w-2xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={closeModal} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all font-display">Cancel</button>
             <button onClick={isEditMode ? handleUpdate : handleCreate} className="flex-1 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-display">
                <Save className="w-4 h-4"/> {isEditMode ? 'Update Supplier' : 'Save Supplier'}
             </button>
          </div>
        }
      >
        <div className="space-y-6 p-2">
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <User className="w-3 h-3"/> Supplier / Company Name *
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Acme Pharmaceuticals" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3"/> Contact Phone / Mobile
                </label>
                <input 
                  type="text" 
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  placeholder="e.g. +91 9876543210" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3"/> GSTIN
                </label>
                <input 
                  type="text" 
                  value={formData.gstin}
                  onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                  placeholder="22AAAAA0000A1Z5" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-mono" 
                />
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <MapPin className="w-3 h-3"/> Office Address
              </label>
              <textarea 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Full office/warehouse address" 
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white" 
              />
           </div>
        </div>
      </AppModal>
    </div>
  );
}
