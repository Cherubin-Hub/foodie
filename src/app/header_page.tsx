import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Shield, Menu, Sun, Moon } from 'lucide-react';
import { useAppStore } from './app_store';

export const HeaderPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    currentUser,
    guestSession,
    logout,
    theme,
    setTheme,
    toggleSidebar
  } = useAppStore();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Sidebar Drawer Toggle (Hidden on Desktop where Sidebar is present) */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            title="Toggle Navigation Sidebar"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Desktop Spacer to keep right controls aligned to right */}
        <div className="hidden lg:block flex-1" />

        {/* Right: Theme Switcher, User & Cart Controls */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Explicit Light / Dark Segmented Theme Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              title="Switch to Light Mode"
              aria-label="Switch to Light Mode"
            >
              <Sun size={14} className={theme === 'light' ? 'text-amber-500' : ''} />
              <span className="hidden sm:inline">Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-900 text-indigo-300 shadow-sm border border-gray-700'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              title="Switch to Dark Mode"
              aria-label="Switch to Dark Mode"
            >
              <Moon size={14} className={theme === 'dark' ? 'text-indigo-400' : ''} />
              <span className="hidden sm:inline">Dark</span>
            </button>
          </div>

          {currentUser?.role === 'ADMIN' && (
            <Link
              to="/admin/dashboard"
              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
            >
              <Shield size={14} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-xs font-medium transition-colors"
              >
                <User size={14} />
                <span className="hidden sm:inline">{currentUser.fullName}</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : guestSession ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-semibold">
                {guestSession.temporaryName}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1 text-gray-400 hover:text-red-500 text-xs"
                title="Switch Guest Session"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-full text-xs font-semibold shadow-sm transition-all"
            >
              Log In
            </Link>
          )}

          <Link
            to="/cart"
            className="relative p-2 text-gray-700 dark:text-gray-200 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
            aria-label="View Shopping Cart"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};