import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, User, LogOut, Shield } from 'lucide-react';
import { useAppStore } from './app_store';

export const HeaderPage: React.FC = () => {
  const navigate = useNavigate();
  const { branding, cart, currentUser, guestSession, logout } = useAppStore();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black text-brand-500 tracking-tight transition-transform group-hover:scale-105">
            {branding.store_name}
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full">
          <MapPin size={14} className="text-brand-500 flex-shrink-0" />
          <span className="truncate max-w-[240px] font-medium">{branding.default_address}</span>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'ADMIN' && (
            <Link
              to="/admin/dashboard"
              className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-amber-100 transition-colors"
            >
              <Shield size={14} />
              <span>Admin</span>
            </Link>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium transition-colors"
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
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
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
            className="relative p-2 text-gray-700 hover:text-brand-500 hover:bg-gray-100 rounded-full transition-all"
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