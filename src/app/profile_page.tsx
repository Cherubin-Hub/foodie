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
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm text-center space-y-4 transition-colors">
        <div className="w-20 h-20 bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto border border-brand-200/50 dark:border-brand-800/60">
          <User size={36} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {currentUser?.fullName || guestSession?.temporaryName || 'Guest User'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {currentUser ? currentUser.email : 'Temporary Guest Session'}
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full py-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
          >
            <Shield size={16} /> Open Admin Control Suite
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/60 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
        >
          <LogOut size={16} /> End Session & Log Out
        </button>
      </div>
    </div>
  );
};