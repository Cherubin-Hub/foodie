import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './app_store';
import { HeaderPage } from './header_page';
import { BottomNavPage } from './bottom_nav_page';
import { SplashPage } from './splash_page';
import { LoginPage } from './login_page';
import { HomeMenuPage } from './home_menu_page';
import { CartCheckoutPage } from './cart_checkout_page';
import { OrderTrackerPage } from './order_tracker_page';
import { SavedItemsPage } from './saved_items_page';
import { OffersPage } from './offers_page';
import { ProfilePage } from './profile_page';
import { AdminLicensePage } from './admin_license_page';
import { AdminDashboardPage } from './admin_dashboard_page';
import { AdminCatalogPage } from './admin_catalog_page';
import { AdminBrandingPage } from './admin_branding_page';
import { AdminRbacPage } from './admin_rbac_page';

export const AppRouter: React.FC = () => {
  const location = useLocation();
  const { licenseStatus, isLicenseUsable, setLicenseState } = useAppStore();

  useEffect(() => {
    fetch('/api/license/status')
      .then(res => res.json())
      .then(data => {
        setLicenseState(data.status || 'INACTIVE', Boolean(data.is_usable), data.installation_request_code);
      })
      .catch(() => {
        setLicenseState('INACTIVE', false);
      });
  }, []);

  const isSplash = location.pathname === '/splash';
  const isAdminRoute = location.pathname.startsWith('/admin');

  // License Guard
  if (!isLicenseUsable && licenseStatus !== 'LOADING') {
    if (isAdminRoute) {
      if (location.pathname !== '/admin/license') {
        return <Navigate to="/admin/license" replace />;
      }
    } else {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center">
            🔒
          </div>
          <h2 className="text-2xl font-black text-gray-900">Store Offline / Maintenance</h2>
          <p className="text-xs text-gray-500 max-w-sm">
            This food ordering terminal requires cryptographic license activation ({licenseStatus}). Please contact the store administrator.
          </p>
          <a
            href="/admin/license"
            className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20"
          >
            Activate Store License (Admin)
          </a>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!isSplash && <HeaderPage />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeMenuPage />} />
          <Route path="/splash" element={<SplashPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cart" element={<CartCheckoutPage />} />
          <Route path="/order/track/:token" element={<OrderTrackerPage />} />
          <Route path="/saved" element={<SavedItemsPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin Routes */}
          <Route path="/admin/license" element={<AdminLicensePage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/catalog" element={<AdminCatalogPage />} />
          <Route path="/admin/branding" element={<AdminBrandingPage />} />
          <Route path="/admin/rbac" element={<AdminRbacPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isSplash && <BottomNavPage />}
    </div>
  );
};