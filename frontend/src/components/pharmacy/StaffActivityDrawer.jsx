import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, User, Layout, ExternalLink, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function StaffActivityDrawer({ isOpen, onClose, staff }) {
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([
    { time: '11:02 AM', type: 'blue', action: 'Dispensed Rx #RX-8821', detail: 'Paracetamol 500mg' },
    { time: '10:30 AM', type: 'amber', action: 'Processed return #RET-441', detail: '₹480 credit' },
    { time: '09:15 AM', type: 'blue', action: 'Dispensed Rx #RX-8801', detail: 'Amoxicillin 250mg' },
    { time: '09:02 AM', type: 'green', action: 'Logged in', detail: 'IP 192.168.1.10' },
  ]);

  useEffect(() => {
    if (isOpen && staff) {
      setLoading(true);
      // In a real app: fetch from /api/activity-log?userId={staff.id}
      setTimeout(() => setLoading(false), 500);
    }
  }, [isOpen, staff]);

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/30 backdrop-blur-sm z-[999] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={cn(
          "fixed right-0 top-0 h-screen w-[420px] bg-white shadow-2xl z-[1000] transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg relative"
                style={{ backgroundColor: staff?.color }}
              >
                {staff?.id}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1E2A5E]">{staff?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded uppercase tracking-wider">
                    {staff?.role}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="flex gap-1 p-1 bg-gray-200/50 rounded-xl">
            {['today', 'weekly', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                  activeTab === tab 
                    ? "bg-white text-[#1E2A5E] shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab === 'today' ? "Today's Activity" : tab === 'weekly' ? "Weekly History" : "Staff Profile"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'today' && (
            <div className="space-y-6 relative">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100"></div>
              {activities.map((activity, idx) => (
                <div key={idx} className="flex gap-4 relative z-10">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-4 border-white shadow-sm flex-shrink-0 mt-1",
                    activity.type === 'blue' ? "bg-blue-500" :
                    activity.type === 'amber' ? "bg-amber-500" :
                    "bg-green-500"
                  )}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{activity.time}</span>
                    </div>
                    <p className="text-sm font-bold text-[#1E2A5E]">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
              <Calendar size={48} strokeWidth={1} />
              <p className="text-sm font-medium">History for last 7 days will appear here</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Employee ID', value: `EMP-${staff?.id}-2026`, icon: Layout },
                  { label: 'Email', value: `${staff?.name.toLowerCase().replace(' ', '.')}@pharmadesk.com`, icon: User },
                  { label: 'Department', value: 'Pharmacy Operations', icon: Activity },
                  { label: 'Shift', value: staff?.since.includes('9:00') ? 'Morning (08:00 - 16:00)' : 'Day (10:00 - 18:00)', icon: Clock },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <item.icon size={16} className="text-[#534AB7]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm font-bold text-[#1E2A5E]">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button className="w-full py-3 bg-[#1E2A5E] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#1E2A5E]/90 transition-all shadow-lg shadow-navy-100">
            View Full Audit Log
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
