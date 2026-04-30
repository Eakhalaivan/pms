import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Shield, User, Phone, CheckCircle2, XCircle, Clock, Edit2, Mail, Building2, Calendar, Power, KeyRound, ScrollText } from 'lucide-react';
import ModuleFilterBar from '../components/ui/ModuleFilterBar';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import UserFormModal from '../components/ui/UserFormModal';
import RoleManagementPanel from './RoleManagementPanel';
import { getRoleColor, ROLE_LABELS } from '../config/roles.config';
import AppModal from '../components/ui/AppModal';
import { formatDistanceToNow } from 'date-fns';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeTab, setActiveTab] = useState('users');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null); // For sliding drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('profile');
  const [createdUser, setCreatedUser] = useState(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      // Handle ApiResponse structure
      setUsers(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      let response;
      if (editingUser) {
        response = await api.put(`/auth/users/${editingUser.id}`, formData);
        toast.success('User updated successfully!');
      } else {
        response = await api.post('/auth/users', formData);
        const newUser = response.data.data || response.data;
        setCreatedUser({...newUser, password: formData.password}); // Keep raw password for display
        setIsCredentialModalOpen(true);
        toast.success('User created successfully!');
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user, e) => {
    e.stopPropagation();
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const openDrawer = (user) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return !searchTerm || 
      u.name?.toLowerCase().includes(term) || 
      u.name?.toLowerCase().includes(term) || 
      u.username?.toLowerCase().includes(term);
  });

  const columns = [
    { header: 'S.No', render: (_, i) => i + 1 },
    { 
        header: 'User Details', 
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                  {row.profilePhotoUrl ? (
                    <img src={row.profilePhotoUrl} alt={row.name} className="w-full h-full object-cover" />
                  ) : (
                    row.name?.substring(0, 2).toUpperCase() || 'U'
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-800 truncate">{row.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest truncate">{row.username}</span>
                </div>
            </div>
        )
    },
    { 
        header: 'Roles', 
        render: (row) => (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
                {row.roles?.map(role => {
                  const colorClass = getRoleColor(role.name);
                  return (
                    <span key={role.id} className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${colorClass}`}>
                      {ROLE_LABELS[role.name] || role.name}
                      <button 
                        onClick={(e) => { e.stopPropagation(); /* TODO: handle inline removal */ }}
                        className="hover:text-black/50 p-0.5"
                      >
                        <XCircle className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })}
            </div>
        )
    },
    { header: 'Shift', render: (row) => <span className="text-xs font-medium text-slate-700 capitalize">{row.shift?.toLowerCase() || 'Morning'}</span> },
    { header: 'Branch', render: (row) => <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{row.branch?.replace('_', ' ') || 'Main Hospital'}</span> },
    { 
        header: 'Contact', 
        render: (row) => (
            <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-700">{row.phone || 'N/A'}</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{row.email || 'N/A'}</span>
            </div>
        )
    },
    { 
        header: 'Last Login', 
        render: (row) => (
            <span className="text-xs text-slate-500 font-medium">
              {row.lastLogin ? formatDistanceToNow(new Date(row.lastLogin), { addSuffix: true }) : 'Never'}
            </span>
        )
    },
    { 
        header: 'Status', 
        render: (row) => {
            const status = row.status || 'ACTIVE';
            return (
              <div className={`flex items-center gap-1 ${status === 'ACTIVE' ? 'text-green-600' : status === 'SUSPENDED' ? 'text-red-600' : 'text-slate-400'}`}>
                  {status === 'ACTIVE' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span className="text-xs font-bold capitalize">{status.toLowerCase()}</span>
              </div>
            );
        }
    },
    {
        header: 'Actions',
        render: (row) => (
            <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => openEditModal(row, e)}
                  className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Edit User"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); /* TODO: handle toggle */ }}
                  className="p-1.5 text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  title={row.status === 'ACTIVE' ? "Deactivate" : "Activate"}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); /* TODO: handle reset */ }}
                  className="p-1.5 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  title="Reset Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); /* TODO: View logs */ }}
                  className="p-1.5 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  title="View Audit Log"
                >
                  <ScrollText className="w-4 h-4" />
                </button>
            </div>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          User Management
        </h2>
        <p className="text-sm text-gray-500 font-medium">Manage staff accounts, credentials, and access roles</p>
      </div>

      <div className="flex border-b border-gray-200 gap-6">
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Staff Directory
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'roles' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Manage Roles
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          <ModuleFilterBar 
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            actions={[
              { label: 'Add New User', icon: Plus, variant: 'primary', onClick: openAddModal }
            ]}
          />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <DataTable columns={columns} data={filteredUsers} onRowClick={openDrawer} hover striped />
          </div>
        </>
      ) : (
        <RoleManagementPanel />
      )}

      <UserFormModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editingUser={editingUser}
      />

      {/* Sliding Drawer for User Profile */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedUser && (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary font-bold text-2xl">
                  {selectedUser.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{selectedUser.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">@{selectedUser.username}</p>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex border-b border-gray-200 shrink-0">
              <button 
                onClick={() => setDrawerTab('profile')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${drawerTab === 'profile' ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50'}`}
              >
                User Profile
              </button>
              <button 
                onClick={() => setDrawerTab('activity')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${drawerTab === 'activity' ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50'}`}
              >
                Activity Log
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              {drawerTab === 'profile' ? (
                <>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Assigned Roles</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.roles?.map(role => {
                        const colorClass = getRoleColor(role.name);
                        return (
                          <span key={role.id} className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${colorClass}`}>
                            {ROLE_LABELS[role.name] || role.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Details</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" /> {selectedUser.phone || 'N/A'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Mail className="w-4 h-4 text-slate-400" /> {selectedUser.email || 'N/A'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Building2 className="w-4 h-4 text-slate-400" /> {selectedUser.branch?.replace('_', ' ') || 'Main Hospital'}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">System Info</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Clock className="w-4 h-4 text-slate-400" /> Shift: <span className="capitalize">{selectedUser.shift?.toLowerCase() || 'Morning'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" /> Last Login: {selectedUser.lastLogin ? formatDistanceToNow(new Date(selectedUser.lastLogin), { addSuffix: true }) : 'Never'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <ScrollText className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Activity Log</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Recent actions performed by this user will appear here.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={(e) => {
                  setIsDrawerOpen(false);
                  openEditModal(selectedUser, e);
                }}
                className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      {/* Credential Card Modal */}
      <AppModal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        title="Staff Credentials Created"
        maxWidth="sm:max-w-md"
      >
        <div className="p-4 space-y-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-20 h-20" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</p>
                  <h3 className="text-xl font-black tracking-tighter text-blue-400">{createdUser?.employeeId}</h3>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                   <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div className="h-px bg-white/10"></div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</p>
                    <p className="font-bold text-sm">{createdUser?.username}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initial Password</p>
                    <p className="font-bold text-sm text-amber-400">{createdUser?.password}</p>
                 </div>
              </div>

              <div className="pt-2">
                 <p className="text-[9px] text-slate-500 italic">Please share these credentials with the employee. They should change their password upon first login.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCredentialModalOpen(false)}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all"
          >
            Done, I've Noted it
          </button>
        </div>
      </AppModal>
    </div>
  );
}
