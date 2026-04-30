import React, { useState, useEffect } from 'react';
import { Plus, Shield, Check, Edit2, Users } from 'lucide-react';
import api from '../utils/api';
import { ROLES, ROLE_COLORS, MODULE_PERMISSIONS, getRoleColor } from '../config/roles.config';
import { toast } from 'react-hot-toast';

export default function RoleManagementPanel() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/roles');
      setRoles(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">System Roles & Permissions</h3>
        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => {
          const colorClass = getRoleColor(role.name);
          const permissions = role.permissionsJson ? JSON.parse(role.permissionsJson) : [];
          
          return (
            <div key={role.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.split(' ')[0]} bg-opacity-20`}>
                    <Shield className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{role.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">Users Assigned</span>
                    </div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-primary transition-colors p-1" title="Edit Role Permissions">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 mt-4 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Active Permissions ({permissions.length})</p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {permissions.includes('ALL') ? (
                    <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <span className="font-bold text-sm text-blue-900">Full System Access</span>
                      <div className="w-8 h-4 bg-primary rounded-full relative cursor-not-allowed">
                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  ) : (
                    permissions.map(p => (
                      <div key={p} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                        <span className="text-xs text-slate-700 font-semibold">{p.replace(/_/g, ' ')}</span>
                        <div className="w-7 h-4 bg-primary rounded-full relative cursor-not-allowed opacity-80">
                          <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
