import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, KeyRound, User as UserIcon, Lock, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { DASHBOARD_ROUTES } from '../config/roles.config';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // inline error — always visible regardless of toast

  const { login, isAuthenticated, activeRole } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users.
  // Guard with `loading` so a successful auth state update during a login
  // attempt doesn't fire this redirect before the catch block can show the error.
  React.useEffect(() => {
    if (loading) return;
    if (isAuthenticated && activeRole) {
      const target = DASHBOARD_ROUTES[activeRole] || '/dashboard/pharmacy';
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, activeRole, navigate, loading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Successfully logged in');
      const storedRole = localStorage.getItem('activeRole');
      const target = (storedRole && DASHBOARD_ROUTES[storedRole]) || '/dashboard/pharmacy';
      navigate(target, { replace: true });
    } catch (err) {
      // Try to pull the most informative message from the backend response
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Invalid username or password. Please try again.';
      setError(msg);        // always shown inline
      toast.error(msg);     // also shown as toast if available
      setPassword('');      // clear password field on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-gray-200 shadow-2xl">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 border border-primary/20">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
            PharmaDesk
          </h2>
          <p className="mt-2 text-sm text-gray-500 uppercase tracking-widest font-bold">
            DRHMS Integrated Platform
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleLogin}>

          {/* Username */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
              placeholder="Username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={`block w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>

          {/* Inline error — always visible, no dependency on toast */}
          {error && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-blue-600 hover:shadow-xl hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Signing in...</>
              ) : (
                <><KeyRound className="h-5 w-5" /> Sign in to Workspace</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
