import React from 'react';
import DynamicListLayout from '../components/ui/DynamicListLayout';

export default function GenericModulePage({ title }) {
  const columns = [
    { header: '#', render: (_, __, i) => i + 1 },
    { header: 'Reference ID', accessor: 'refId' },
    { header: 'Date', accessor: 'date' },
    { header: 'Entity / Type', accessor: 'type' },
    { header: 'Amount', render: (row) => `₹${row.amount.toFixed(2)}` },
    { header: 'Status', render: (row) => (
      <span className="px-2 py-1 rounded inline-flex text-xs leading-5 font-semibold bg-green-100 text-green-800">
        {row.status}
      </span>
    )}
  ];
  
  const fetchMockData = () => [
    { id: 1, refId: `${title.substring(0,3).toUpperCase()}-001`, date: '2026-08-12', type: 'General', amount: 1200.00, status: 'Completed' },
    { id: 2, refId: `${title.substring(0,3).toUpperCase()}-002`, date: '2026-08-13', type: 'Insurance', amount: 350.50, status: 'Active' },
  ];

  return <DynamicListLayout title={title} columns={columns} fetchData={fetchMockData} />;
}
