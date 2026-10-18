import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Lock, Mail, Users, ArrowRight, X } from 'lucide-react';
import { useAppStore } from './app_store';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { branding, setUser, setGuestSession } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Pre-seeded Admin check
    if (email.trim() === 'admin@foodie.com' && password.trim() === 'admin123') {
      setUser({ email: 'admin@foodie.com', fullName: 'Master Admin', role: 'ADMIN' });
      navigate('/admin/dashboard');
      return;
    }

    if (email.trim() && password.trim()) {
      setUser({ email, fullName: email.split('@')[0], role: 'CUSTOMER' });
      navigate('/');
      return;
    }

    setErrorMsg('Please enter valid email and password.');
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temporaryName: tempName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setGuestSession({ token: data.session_token, temporaryName: data.guest_temporary_name });
        setShowGuestModal(false);
        navigate('/');
      } else {
        setErrorMsg('Failed to create guest session');
      }
    } catch (err) {
      setErrorMsg('Network error connecting to guest auth endpoint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Utensils size={28} className="text-white" />
          </div>
        </div>
        <p className="mt-3 text-center text-xs font-bold uppercase tracking-wider text-brand-600">
          {branding.store_name}
        </p>
        <h2 className="mt-1 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1 text-center text-sm text-gray-600">
          Sign in to your account or continue as a table guest
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-100 rounded-3xl sm:px-10 border border-gray-100">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email / Phone
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@foodie.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={e => setKeepSignedIn(e.target.checked)}
                  className="rounded text-brand-500 focus:ring-brand-500"
                />
                <span>Keep me signed in</span>
              </label>
              <span className="text-brand-500 font-semibold cursor-pointer hover:underline">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 text-sm transition-all"
            >
              Log In
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-semibold">Or</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => setShowGuestModal(true)}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Users size={16} />
                <span>Continue as Guest (Instant Table Order)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Name Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowGuestModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-3">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Enter Temporary Name</h3>
            <p className="text-xs text-gray-500 mt-1">
              Add your name or table number (e.g. "Alex - Table 4") so the kitchen can identify your order.
            </p>

            <form onSubmit={handleCreateGuest} className="mt-4 space-y-4">
              <input
                type="text"
                required
                autoFocus
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                placeholder="Alex - Table 4"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <button
                type="submit"
                disabled={loading || !tempName.trim()}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-500/20"
              >
                <span>{loading ? 'Creating Session...' : 'Start Ordering'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};