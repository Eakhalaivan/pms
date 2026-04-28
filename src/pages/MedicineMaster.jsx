import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Pill, Trash2, Edit3, Save, XCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

export default function MedicineMaster() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    category: 'Tablet',
    unit: 'Strip',
    hsnCode: '',
    taxPercentage: 12.0,
    gstPercent: 12.0,
    reorderLevel: 10,
    count: 0
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await pharmacyService.getMedicines();
      if (response.success) {
        setMedicines(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error('Medicine name is required');
      return;
    }
    try {
      const response = await pharmacyService.createMedicine(formData);
      if (response.success) {
        toast.success('Medicine added successfully!');
        closeModal();
        fetchMedicines();
      }
    } catch (error) {
      toast.error('Failed to add medicine');
    }
  };

  const handleUpdate = async () => {
    if (!formData.name) {
      toast.error('Medicine name is required');
      return;
    }
    try {
      const response = await pharmacyService.updateMedicine(selectedMedicine.id, formData);
      if (response.success) {
        toast.success('Medicine updated successfully!');
        closeModal();
        fetchMedicines();
      }
    } catch (error) {
      toast.error('Failed to update medicine');
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedMedicine(null);
    setFormData({
      name: '',
      genericName: '',
      manufacturer: '',
      category: 'Tablet',
      unit: 'Strip',
      hsnCode: '',
      taxPercentage: 12.0,
      gstPercent: 12.0,
      reorderLevel: 10,
      count: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (medicine) => {
    setIsEditMode(true);
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name || '',
      genericName: medicine.genericName || '',
      manufacturer: medicine.manufacturer || '',
      category: medicine.category || 'Tablet',
      unit: medicine.unit || 'Strip',
      hsnCode: medicine.hsnCode || '',
      taxPercentage: medicine.taxPercentage || 12.0,
      gstPercent: medicine.gstPercent || 12.0,
      reorderLevel: medicine.reorderLevel || 10,
      count: medicine.count || 0
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedMedicine(null);
  };

  const filteredMedicines = medicines.filter(m => {
    const s = searchTerm.toLowerCase();
    return !searchTerm || 
      m.name.toLowerCase().includes(s) || 
      m.genericName?.toLowerCase().includes(s) ||
      m.manufacturer?.toLowerCase().includes(s);
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Medicine Name', accessor: 'name' },
    { header: 'Generic Name', accessor: 'genericName' },
    { header: 'Category', accessor: 'category' },
    { header: 'Manufacturer', accessor: 'manufacturer' },
    { header: 'Unit', accessor: 'unit' },
    { 
      header: 'Stock Count', 
      render: (row) => (
        <Badge variant={(row.count ?? 0) <= (row.reorderLevel ?? 0) ? "danger" : "success"}>
          {row.count ?? 0} {row.unit}
        </Badge>
      )
    },
    { header: 'GST %', render: (row) => `${row.gstPercent || row.taxPercentage}%` },
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedMedicine(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          title="Edit" 
          onClick={() => openEditModal(row)}
          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  if (loading && medicines.length === 0) return <div className="p-8 text-center text-slate-500 font-bold italic">Loading Medicine Master...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Medicine Master</h2>
        <p className="text-sm text-gray-500 font-medium">Manage your pharmacy products, generic names, and tax configurations</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        actions={[
          { label: 'Add New Medicine', icon: Plus, variant: 'primary', onClick: openAddModal }
        ]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredMedicines} hover striped />
        <Pagination totalRecords={filteredMedicines.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>

      {/* Add New Medicine Modal */}
      <AppModal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={isEditMode ? "Edit Medicine Database" : "Add New Medicine to Master"}
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={closeModal} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all font-display">Cancel</button>
             <button onClick={isEditMode ? handleUpdate : handleCreate} className="flex-1 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-display">
                <Save className="w-4 h-4"/> {isEditMode ? 'Update Medicine' : 'Save Medicine'}
             </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Medicine Name *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Amoxicillin 500mg" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Generic Name</label>
              <input 
                type="text" 
                value={formData.genericName}
                onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                placeholder="e.g. Amoxicillin" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white" 
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Manufacturer</label>
              <input 
                type="text" 
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                placeholder="e.g. Sun Pharma" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white" 
              />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                >
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup</option>
                  <option>Injection</option>
                  <option>Ointment</option>
                  <option>Drops</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Unit</label>
                <select 
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                >
                  <option>Strip</option>
                  <option>Bottle</option>
                  <option>Vial</option>
                  <option>Ampoule</option>
                  <option>Tube</option>
                  <option>Packet</option>
                </select>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">HSN Code</label>
                <input 
                  type="text" 
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({...formData, hsnCode: e.target.value})}
                  placeholder="8-digit code" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">GST %</label>
                <input 
                  type="number" 
                  value={formData.gstPercent}
                  onChange={(e) => setFormData({...formData, gstPercent: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
                />
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Reorder Level</label>
                <input 
                  type="number" 
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({...formData, reorderLevel: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Current Stock Count</label>
                <input 
                  type="number" 
                  value={formData.count}
                  onChange={(e) => setFormData({...formData, count: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold text-primary" 
                />
              </div>
           </div>
        </div>
      </AppModal>

      {/* View Details Modal */}
      <AppModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Medicine Database Record"
        maxWidth="sm:max-w-2xl"
      >
        {selectedMedicine && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-6">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
                  <Pill className="w-8 h-8 text-primary" />
               </div>
               <div>
                  <h4 className="text-xl font-black text-slate-800 tracking-tight">{selectedMedicine.name}</h4>
                  <p className="text-sm font-bold text-primary tracking-wide uppercase">{selectedMedicine.genericName || 'Generic Not Linked'}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 px-1">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manufacturer</p>
                  <p className="text font-bold text-slate-700">{selectedMedicine.manufacturer || 'N/A'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category & Unit</p>
                  <p className="text font-bold text-slate-700">{selectedMedicine.category} / {selectedMedicine.unit}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">HSN & Tax</p>
                  <p className="text font-bold text-slate-700">{selectedMedicine.hsnCode || 'N/A'} (GST {selectedMedicine.gstPercent || selectedMedicine.taxPercentage}%)</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock Availability</p>
                  <div className="flex items-center gap-2">
                     <p className="text-xl font-black text-slate-800">{selectedMedicine.count ?? 0}</p>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedMedicine.unit}</p>
                     <Badge variant={(selectedMedicine.count ?? 0) <= (selectedMedicine.reorderLevel ?? 0) ? "danger" : "success"} className="ml-2">
                        {(selectedMedicine.count ?? 0) <= (selectedMedicine.reorderLevel ?? 0) ? 'Low Stock' : 'In Stock'}
                     </Badge>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reorder Threshold</p>
                  <Badge variant="warning">{selectedMedicine.reorderLevel} Units</Badge>
               </div>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
