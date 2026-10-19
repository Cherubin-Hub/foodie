import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Utensils,
  ShoppingBag,
  Heart,
  Tag,
  Compass,
  User,
  LayoutDashboard,
  UtensilsCrossed,
  Palette,
  ShieldCheck,
  KeyRound,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
  Store,
  LucideIcon
} from 'lucide-react';
import { useAppStore } from './app_store';

interface NavItem {
  id: string;
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
  adminOnly?: boolean;
}

export const SidebarPage: React.FC = () => {
  const location = useLocation();
  const {
    branding,
    cart,
    savedItemIds,
    currentUser,
    guestSession,
    licenseStatus,
    theme,
    setTheme,
    isSidebarOpen,
    setSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed
  } = useAppStore();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const clientModules: NavItem[] = [
    { id: 'MENU', name: 'Home Menu', path: '/', icon: Utensils },
    { id: 'CART', name: 'Cart & Checkout', path: '/cart', icon: ShoppingBag, badge: totalCartCount > 0 ? totalCartCount : undefined },
    { id: 'SAVED', name: 'Saved Favorites', path: '/saved', icon: Heart, badge: savedItemIds.length > 0 ? savedItemIds.length : undefined },
    { id: 'OFFERS', name: 'Special Offers', path: '/offers', icon: Tag },
    { id: 'TRACKER', name: 'Live Order Tracker', path: '/order/track/TRK-SAMPLE', icon: Compass },
    { id: 'PROFILE', name: 'My Profile', path: '/profile', icon: User }
  ];

  const adminModules: NavItem[] = [
    { id: 'ADMIN_DASHBOARD', name: 'Kitchen Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, adminOnly: true },
    { id: 'ADMIN_CATALOG', name: 'Catalog Builder', path: '/admin/catalog', icon: UtensilsCrossed, adminOnly: true },
    { id: 'ADMIN_BRANDING', name: 'Store Branding', path: '/admin/branding', icon: Palette, adminOnly: true },
    { id: 'ADMIN_RBAC', name: 'Role Access Matrix', path: '/admin/rbac', icon: ShieldCheck, adminOnly: true },
    {
      id: 'ADMIN_LICENSE',
      name: 'Offline License',
      path: '/admin/license',
      icon: KeyRound,
      badge: licenseStatus === 'VALID' ? 'Active' : 'Locked',
      adminOnly: true
    }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300">
      {/* Top Branding Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
          <NavLink
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20">
              <Store size={20} />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                  {branding.store_name}
                </span>
                <span className="block text-[10px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  Food Platform
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {/* Store Modules */}
          <div>
            {!isSidebarCollapsed && (
              <div className="px-3 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Store Modules
              </div>
            )}
            <nav className="space-y-1">
              {clientModules.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    title={isSidebarCollapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                    {!isSidebarCollapsed && (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}
                    {!isSidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Management / Admin Modules */}
          <div>
            {!isSidebarCollapsed && (
              <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                <span>Management Suite</span>
                {currentUser?.role === 'ADMIN' && (
                  <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                    Admin
                  </span>
                )}
              </div>
            )}
            <nav className="space-y-1">
              {adminModules.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    title={isSidebarCollapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                    {!isSidebarCollapsed && (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}
                    {!isSidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.badge === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Light / Dark Mode Switcher & User Profile */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
        {/* Light / Dark Mode Selection Control */}
        <div className="bg-gray-100 dark:bg-gray-800/70 p-1 rounded-2xl flex items-center gap-1">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            title="Light Theme"
          >
            <Sun size={15} className={theme === 'light' ? 'text-amber-500' : ''} />
            {!isSidebarCollapsed && <span>Light</span>}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            title="Dark Theme"
          >
            <Moon size={15} className={theme === 'dark' ? 'text-indigo-400' : ''} />
            {!isSidebarCollapsed && <span>Dark</span>}
          </button>
        </div>

        {/* User Identity Preview */}
        {!isSidebarCollapsed && (
          <div className="px-2 py-1 flex items-center justify-between text-xs">
            <div className="truncate">
              <span className="block font-bold text-gray-800 dark:text-gray-200 truncate">
                {currentUser?.fullName || guestSession?.temporaryName || 'Guest Diner'}
              </span>
              <span className="block text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {currentUser?.role || 'Guest Mode'}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent / Collapsible Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-30 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-Over with Backdrop) */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
