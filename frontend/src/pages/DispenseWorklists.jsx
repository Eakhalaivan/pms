import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, Pill, Search } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

export default function DispenseWorklists() {
  const location = useLocation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  useEffect(() => {
    fetchPrescriptions();
  }, [location.key]);

  const fetchPrescriptions = async () => {
    try {
      const response = await pharmacyService.getPendingPrescriptions();
      if (response.success) {
        setPrescriptions(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch pending prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'ID', accessor: 'id' },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'Doctor', accessor: 'doctorName' },
    { header: 'Prescription Date', render: (row) => new Date(row.prescriptionDate).toLocaleDateString('en-IN') },
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'PENDING' ? 'danger' : 'warning'}>{row.status}</Badge>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedPrescription(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          title="Dispense" 
          onClick={() => { setSelectedPrescription(row); setIsModalOpen(true); }}
          className="p-1.5 text-success hover:bg-green-50 rounded-lg transition-colors"
        >
          <Pill className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  const filteredPrescriptions = prescriptions.filter(row => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      row.id?.toString().includes(searchLower) ||
      row.patientName?.toLowerCase().includes(searchLower) ||
      row.doctorName?.toLowerCase().includes(searchLower);
    
    const prDate = new Date(row.prescriptionDate);
    const normalizedPrDate = new Date(prDate.getFullYear(), prDate.getMonth(), prDate.getDate()).getTime();
    
    const matchesFrom = !dateRange.from || normalizedPrDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
    const matchesTo = !dateRange.to || normalizedPrDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();
    
    return matchesSearch && matchesFrom && matchesTo;
  });

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold italic">Initialising Dispense Worklist...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pending Dispense List</h2>
        <p className="text-sm text-gray-500 font-medium">Verify and dispense prescribed medicines to wards</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredPrescriptions} hover striped />
        <Pagination totalRecords={filteredPrescriptions.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Medicine Dispensing"
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all font-display">Cancel</button>
             <button onClick={() => { 
                toast.success('Medicines dispensed successfully!'); 
                setIsModalOpen(false); 
                fetchPrescriptions(); 
             }} className="flex-1 px-6 py-2.5 bg-success text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all font-display">Confirm Dispense</button>
          </div>
        }
      >
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Details</p>
                  <p className="text-sm font-bold text-slate-800">{selectedPrescription.patientName}</p>
                  <p className="text-xs text-slate-500">{selectedPrescription.doctorName}</p>
               </div>
               <div className="text-right">
                  <Badge variant="danger">{selectedPrescription.status}</Badge>
                  <p className="text-xs font-bold text-slate-400 mt-2">Pr-ID: {selectedPrescription.id}</p>
               </div>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-[#1e293b] text-white text-[11px] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Medicine</th>
                    <th className="px-4 py-3 text-center w-32">Dispense Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                   <tr className="hover:bg-slate-50 transition-colors">
                     <td className="px-4 py-4 font-bold text-slate-700">Prescribed Medicines (Items List)</td>
                     <td className="px-4 py-4"><input type="number" defaultValue="1" className="w-full text-center border border-slate-200 rounded-lg py-1.5 outline-none focus:border-success font-bold text-success" /></td>
                   </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Prescription Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedPrescription && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Patient</p>
                <p className="font-bold">{selectedPrescription.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Doctor</p>
                <p className="font-bold">{selectedPrescription.doctorName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Date</p>
                <p className="font-bold">{new Date(selectedPrescription.prescriptionDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Status</p>
                <Badge variant={selectedPrescription.status === 'PENDING' ? 'danger' : 'success'}>{selectedPrescription.status}</Badge>
              </div>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
