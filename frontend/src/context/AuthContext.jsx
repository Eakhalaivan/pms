import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { ROLES } from '../config/roles.config';

const AuthContext = createContext();

const ROLE_PRIORITY = [
  ROLES.SYSTEM_ADMIN,
  ROLES.SUPERVISOR,
  ROLES.SENIOR_MEDICAL_STAFF,
  ROLES.MEDICAL_STAFF,
  ROLES.BILLING_STAFF,
  ROLES.PHARMACY_STAFF,
  ROLES.RECEPTIONIST,
  ROLES.AUDIT_COMPLIANCE,
  ROLES.LAB_TECHNICIAN,
  ROLES.STOREKEEPER
];

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    roles: [],
    activeRole: null,
    isAuthenticated: false,
    loading: true
  });

  const getHighestPriorityRole = useCallback((roles) => {
    if (!roles || roles.length === 0) return null;
    
    // Normalize roles
    const normalizedRoles = roles.map(r => {
      if (typeof r !== 'string') return '';
      let normalized = r.replace('ROLE_', '').replace(/ /g, '_').toUpperCase();
      if (normalized === 'ADMIN') return ROLES.SYSTEM_ADMIN;
      return normalized;
    });

    for (const role of ROLE_PRIORITY) {
      if (normalizedRoles.includes(role)) return role;
    }
    return normalizedRoles[0];
  }, []);

  // On mount, restore from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const rolesStr = localStorage.getItem('roles');
    const activeRoleStr = localStorage.getItem('activeRole');

    if (token && userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        const parsedRoles = rolesStr ? JSON.parse(rolesStr) : [];
        
        // Ensure we have at least one role
        const finalRoles = parsedRoles.length > 0 ? parsedRoles : ['SYSTEM_ADMIN'];
        const finalActiveRole = activeRoleStr || finalRoles[0] || 'SYSTEM_ADMIN';

        setAuthState({
          user: parsedUser,
          roles: finalRoles,
          activeRole: finalActiveRole,
          isAuthenticated: true,
          loading: false
        });
        return; // Skip the default setLoading(false)
      } catch (e) {
        console.error("AuthContext: Restoration failed", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('roles');
        localStorage.removeItem('activeRole');
      }
    }
    setAuthState(prev => ({ ...prev, loading: false }));
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      // If the backend wraps the response in ApiResponse, the actual payload is in response.data.data
      const data = response.data.data ? response.data.data : response.data;
      
      console.log('AuthContext: Login API Success', data);

      // Store token
      localStorage.setItem('token', data.token);
      
      // Store user object
      const userData = {
        id:       data.id       || data.userId,
        name:     data.name     || data.username,
        username: data.username,
        email:    data.email    || '',
        branch:   data.branch   || 'Main Branch',
      };
      
      localStorage.setItem('user', JSON.stringify(userData));

      // ── ROLES: handle array (new RBAC) OR single string (legacy) ──
      let rolesArray = [];

      if (Array.isArray(data.roles) && data.roles.length > 0) {
        rolesArray = data.roles;
      } else if (data.role && typeof data.role === 'string') {
        const legacyMap = {
          'ADMIN':         'SYSTEM_ADMIN',
          'MEDICINE_USER': 'PHARMACY_STAFF',
          'BILLING_USER':  'BILLING_STAFF',
          'PURCHASE_USER': 'STOREKEEPER',
          'ADMIN_USER':    'SYSTEM_ADMIN',
        };
        const mapped = legacyMap[data.role] || data.role;
        rolesArray = [mapped];
      } else {
        rolesArray = ['SYSTEM_ADMIN'];
      }

      localStorage.setItem('roles', JSON.stringify(rolesArray));

      const primary = getHighestPriorityRole(rolesArray) || rolesArray[0];
      localStorage.setItem('activeRole', primary);

      setAuthState({
        user: userData,
        roles: rolesArray,
        activeRole: primary,
        isAuthenticated: true,
        loading: false
      });

      console.log('Auth: roles set to', rolesArray, '| activeRole:', primary);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      console.error('AuthContext: Login failed', error);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    localStorage.removeItem('activeRole');
    setAuthState({
      user: null,
      roles: [],
      activeRole: null,
      isAuthenticated: false,
      loading: false
    });
  }, []);

  const switchRole = useCallback((role) => {
    setAuthState(prev => {
      if (prev.roles.includes(role)) {
        localStorage.setItem('activeRole', role);
        return { ...prev, activeRole: role };
      }
      return prev;
    });
  }, []);

  const contextValue = React.useMemo(() => ({
    ...authState,
    login,
    logout,
    switchRole
  }), [authState, login, logout, switchRole]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
