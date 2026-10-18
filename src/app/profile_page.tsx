import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Shield } from 'lucide-react';
import { useAppStore } from './app_store';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, guestSession, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 pb-24 space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
        <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto">
          <User size={36} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {currentUser?.fullName || guestSession?.temporaryName || 'Guest User'}
          </h2>
          <p className="text-xs text-gray-400">
            {currentUser ? currentUser.email : 'Temporary Guest Session'}
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full py-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <Shield size={16} /> Open Admin Control Suite
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} /> End Session & Log Out
        </button>
      </div>
    </div>
  );
};