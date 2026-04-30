import React, { useState, useEffect } from 'react';
import AppModal from './AppModal';
import { Users, Shield } from 'lucide-react';
import { MODULE_PERMISSIONS, getRoleColor } from '../../config/roles.config';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

export default function UserFormModal({ isOpen, onClose, onSave, editingUser = null }) {
  const [availableRoles, setAvailableRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    branch: 'MAIN_HOSPITAL',
    shift: 'MORNING',
    status: 'ACTIVE',
    roles: []
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        username: editingUser.username || '',
        password: '',
        phone: editingUser.phone || '',
        email: editingUser.email || '',
        branch: editingUser.branch || 'MAIN_HOSPITAL',
        shift: editingUser.shift || 'MORNING',
        status: editingUser.status || 'ACTIVE',
        roles: editingUser.roles ? editingUser.roles.map(r => r.name) : []
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        phone: '',
        email: '',
        branch: 'MAIN_HOSPITAL',
        shift: 'MORNING',
        status: 'ACTIVE',
        roles: []
      });
    }
  }, [editingUser, isOpen]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/auth/roles');
      // Response is ApiResponse<List<Role>>, so we need response.data.data
      setAvailableRoles(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.username || (!editingUser && !formData.password)) {
      toast.error('Please fill all required fields');
      return;
    }
    onSave(formData);
  };

  const handleRoleToggle = (roleName) => {
    setFormData(prev => {
      const isSelected = prev.roles.includes(roleName);
      return {
        ...prev,
        roles: isSelected ? prev.roles.filter(name => name !== roleName) : [...prev.roles, roleName]
      };
    });
  };

  // Derive active permissions from selected roles for the preview
  const activePermissions = new Set();
  formData.roles.forEach(name => {
    const role = availableRoles.find(r => r.name === name);
    if (role && role.permissionsJson) {
      try {
        const perms = JSON.parse(role.permissionsJson);
        perms.forEach(p => activePermissions.add(p));
      } catch (e) {}
    }
  });

  const hasFullAccess = activePermissions.has('ALL');

  return (
    <AppModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={editingUser ? "Edit Staff Member" : "Add New Staff Member"}
      maxWidth="max-w-4xl" // Wider modal to accommodate preview panel
      footer={
        <div className="flex w-full gap-3 justify-end">
           <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
           <button onClick={handleSubmit} className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <Users className="w-4 h-4"/> {editingUser ? "Save Changes" : "Create Account"}
           </button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-6 p-2 h-[60vh] overflow-y-auto">
        {/* Left Side: Form Fields */}
        <div className="flex-1 space-y-4 pr-2">
           <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Rahul Sharma" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
                  />
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Username *</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    disabled={!!editingUser}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold disabled:bg-slate-50 disabled:text-slate-400" 
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password {editingUser ? '(Leave empty to keep)' : '*'}</label>
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
                  />
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Employee ID</label>
                  <input 
                    type="text" 
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
                  />
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Branch</label>
                  <select 
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold"
                  >
                    <option value="MAIN_HOSPITAL">Main Hospital</option>
                    <option value="CLINIC_A">Clinic A</option>
                    <option value="CLINIC_B">Clinic B</option>
                  </select>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Shift</label>
                  <select 
                    value={formData.shift}
                    onChange={(e) => setFormData({...formData, shift: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold"
                  >
                    <option value="MORNING">Morning</option>
                    <option value="EVENING">Evening</option>
                    <option value="NIGHT">Night</option>
                    <option value="ROTATING">Rotating</option>
                  </select>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
               </div>
           </div>

            <div className="space-y-1.5 col-span-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Profile Photo URL (Optional)</label>
               <input 
                 type="text" 
                 value={formData.profilePhotoUrl || ''}
                 onChange={(e) => setFormData({...formData, profilePhotoUrl: e.target.value})}
                 placeholder="https://example.com/photo.jpg" 
                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" 
               />
            </div>

            <div className="space-y-2 col-span-2 mt-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">System Roles (Multi-Select)</label>
              <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50 min-h-[80px]">
                 {availableRoles.map(role => {
                   const isSelected = formData.roles.includes(role.name);
                   const colorClass = getRoleColor(role.name);
                   return (
                     <label 
                       key={role.id} 
                       className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                         isSelected ? colorClass + ' ring-2 ring-offset-1 ring-primary/40' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                       }`}
                     >
                       <input 
                         type="checkbox" 
                         checked={isSelected}
                         onChange={() => handleRoleToggle(role.name)}
                         className="hidden"
                       />
                       <span className="text-xs font-bold">{role.name}</span>
                     </label>
                   );
                 })}
              </div>
              {formData.roles.includes('SYSTEM_ADMIN') && formData.roles.length > 1 && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3" /> System Admin already has full access. Additional roles are redundant.
                </p>
              )}
            </div>
        </div>

        {/* Right Side: Access Preview Panel */}
        <div className="w-full md:w-72 bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <Shield className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-slate-800">Access Preview</h4>
          </div>
          
          {hasFullAccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <Shield className="w-12 h-12 text-primary mb-3 opacity-20" />
              <p className="font-bold text-slate-800">Full System Access</p>
              <p className="text-xs text-slate-500 mt-1">This user has unrestricted access to all modules and configurations.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {Object.entries(MODULE_PERMISSIONS).map(([moduleName, perms]) => {
                const activeInModule = perms.filter(p => activePermissions.has(p.id));
                if (activeInModule.length === 0 && !hasFullAccess) return null;
                
                return (
                  <div key={moduleName} className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{moduleName}</p>
                    <ul className="space-y-1">
                      {activeInModule.map(p => (
                        <li key={p.id} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0"></span>
                          {p.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {activePermissions.size === 0 && (
                <p className="text-xs text-slate-400 text-center mt-10">Select roles to see permissions preview.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
}
