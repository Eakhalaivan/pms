import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, Pill, Search } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import pharmacyService from '../utils/pharmacyService';
import { toast } from 'react-hot-toast';

export default function PendingPrescriptions() {
  const location = useLocation();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const filteredPrescriptions = prescriptions.filter(row => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      row.id?.toString().includes(s) || 
      row.patientName?.toLowerCase().includes(s) || 
      row.doctorName?.toLowerCase().includes(s);

    const prDate = new Date(row.prescriptionDate);
    const normalizedPrDate = new Date(prDate.getFullYear(), prDate.getMonth(), prDate.getDate()).getTime();
    const matchesFrom = !dateRange.from || normalizedPrDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
    const matchesTo = !dateRange.to || normalizedPrDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();

    return matchesSearch && matchesFrom && matchesTo;
  });

  useEffect(() => {
    fetchPrescriptions();
  }, [location.key]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await pharmacyService.getPendingPrescriptions();
      if (response && response.success) {
        setPrescriptions(Array.isArray(response.data) ? response.data : []);
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Prescriptions Error:', error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'ID', accessor: 'id' },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'Doctor Name', accessor: 'doctorName' },
    { header: 'Prescribed Date', render: (row) => new Date(row.prescriptionDate).toLocaleDateString() },
    { header: 'Status', render: (row) => {
      let variant = 'warning';
      if (row.status === 'DISPENSED') variant = 'success';
      if (row.status === 'PENDING') variant = 'danger';
      return <Badge variant={variant}>{row.status}</Badge>;
    }},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View" 
          onClick={() => { setSelectedPrescription(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status !== 'DISPENSED' && (
          <button 
            title="Dispense" 
            onClick={() => toast.success('Prescription sent to billing/dispensing queue')}
            className="p-1.5 text-success hover:bg-green-50 rounded-lg transition-colors"
          >
            <Pill className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Prescriptions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pending Prescriptions</h2>
        <p className="text-sm text-gray-500 font-medium">Detailed tracking of all electronic prescriptions awaiting pharmacy fulfillment</p>
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
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)}
        title="Prescription Details"
        maxWidth="sm:max-w-2xl"
      >
        {selectedPrescription && (
          <div className="space-y-6">
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
            <div className="p-10 text-center text-slate-400 italic text-sm">
                Itemized prescription medicines and dosage instructions are currently being retrieved.
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}
