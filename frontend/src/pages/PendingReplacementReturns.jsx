import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import AppModal from '../components/ui/AppModal';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';

const mockRepReturns = [
  { id: 1, retNo: 'RRET-101', reqNo: 'REQ-4395', ward: 'ICU - 1', returnedBy: 'Nurse Sarah', date: '16-Apr-2026', items: 5, status: 'Pending' },
];

export default function PendingReplacementReturns() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnToDelete, setReturnToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [returns, setReturns] = useState(mockRepReturns);

  useEffect(() => {
    // Re-fetch logic would go here if not using mocks
    console.log('Refreshing Rep Returns for route:', location.key);
  }, [location.key]);

  const filteredReturns = returns.filter(row => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      row.retNo.toLowerCase().includes(s) || 
      row.reqNo.toLowerCase().includes(s) || 
      row.ward.toLowerCase().includes(s) || 
      row.returnedBy.toLowerCase().includes(s);

    const retDate = new Date(row.date);
    const normalizedRetDate = new Date(retDate.getFullYear(), retDate.getMonth(), retDate.getDate()).getTime();
    
    const matchesFrom = !dateRange.from || normalizedRetDate >= new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
    const matchesTo = !dateRange.to || normalizedRetDate <= new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()).getTime();

    return matchesSearch && matchesFrom && matchesTo;
  });

  const confirmDelete = () => {
    setReturns(returns.filter(r => r.id !== returnToDelete));
    toast.success('Return request rejected');
    setIsDeleteModalOpen(false);
    setReturnToDelete(null);
  };

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { header: 'Return No', accessor: 'retNo' },
    { header: 'Original Request No', accessor: 'reqNo' },
    { header: 'Ward', accessor: 'ward' },
    { header: 'Returned By', accessor: 'returnedBy' },
    { header: 'Return Date', accessor: 'date' },
    { header: 'Items', accessor: 'items' },
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'Pending' ? 'warning' : 'success'}>{row.status}</Badge>
    )},
    { header: 'Action', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          title="View"
          onClick={() => { setSelectedReturn(row); setIsViewModalOpen(true); }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        {row.status === 'Pending' && (
          <>
            <button 
              title="Accept" 
              onClick={() => { setSelectedReturn(row); setIsModalOpen(true); }}
              className="p-1.5 text-success hover:bg-green-50 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button 
              title="Reject" 
              onClick={() => { setReturnToDelete(row.id); setIsDeleteModalOpen(true); }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Replacement Return List</h2>
        <p className="text-sm text-gray-500 font-medium">Verify and accept returned medicines from wards back into pharmacy stock</p>
      </div>

      <ModuleFilterBar 
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        dateRange={dateRange}
        onDateChange={(type, val) => setDateRange(prev => ({ ...prev, [type]: val }))}
        filters={[{ label: 'Ward', name: 'ward', options: [{ label: 'ICU - 1', value: 'icu1' }] }]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredReturns} hover striped />
        <Pagination totalRecords={filteredReturns.length} currentPage={1} pageSize={10} onPageChange={() => {}} onPageSizeChange={() => {}} />
      </div>

      <AppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Verify & Accept Return"
        maxWidth="sm:max-w-4xl"
        footer={
          <div className="flex w-full gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
             <button onClick={() => { 
                setReturns(returns.map(r => r.id === selectedReturn.id ? { ...r, status: 'Completed' } : r));
                toast.success('Return accepted and stock updated!'); 
                setIsModalOpen(false); 
             }} className="flex-1 px-8 py-2.5 bg-success text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4"/> Confirm Accept
             </button>
          </div>
        }
      >
        {selectedReturn && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original Request</p>
                  <p className="text-sm font-bold text-slate-800">{selectedReturn.reqNo}</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Returned By</p>
                  <p className="text-sm font-bold text-slate-800">{selectedReturn.returnedBy}</p>
               </div>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-[#1e293b] text-white text-[11px] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Medicine</th>
                    <th className="px-4 py-3 text-center">Returned Qty</th>
                    <th className="px-4 py-3 text-center w-48">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-700">Amoxicillin 500mg</td>
                    <td className="px-4 py-4 text-center font-bold">5</td>
                    <td className="px-4 py-4">
                       <select className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-success/20">
                          <option>Good Condition</option>
                          <option>Damaged</option>
                          <option>Expired / Near Expiry</option>
                       </select>
                    </td>
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
        title="Replacement Return Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium">Return No</p>
                <p className="font-bold">{selectedReturn.retNo}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Request No</p>
                <p className="font-bold">{selectedReturn.reqNo}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Ward</p>
                <p className="font-bold">{selectedReturn.ward}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Returned By</p>
                <p className="font-bold">{selectedReturn.returnedBy}</p>
              </div>
            </div>
            <div className="p-10 text-center text-slate-400 italic">
              Itemized return manifest is pending synchronization.
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Rejection"
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex gap-3 w-full">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-6 py-2 border rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-red-700">Yes, Reject</button>
          </div>
        }
      >
        <div className="p-6 text-center">
          <p className="font-bold text-gray-900 mb-2">Reject this replacement return?</p>
          <p className="text-sm text-gray-500">This action will return the request to the ward for correction.</p>
        </div>
      </AppModal>
    </div>
  );
}
