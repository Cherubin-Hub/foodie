import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Tag, Heart, ShoppingBag, User } from 'lucide-react';
import { useAppStore } from './app_store';

export const BottomNavPage: React.FC = () => {
  const { cart, canViewModule, currentUser, guestSession } = useAppStore();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { label: 'Menu', to: '/', icon: Home, module: 'HOME_MENU' },
    { label: 'Offers', to: '/offers', icon: Tag, module: 'DEALS_OFFERS' },
    { label: 'Saved', to: '/saved', icon: Heart, module: 'SAVED_FAVORITES' },
    { label: 'Cart', to: '/cart', icon: ShoppingBag, module: 'CART_CHECKOUT', count: totalItems },
    { label: 'Profile', to: currentUser || guestSession ? '/profile' : '/login', icon: User, module: 'PROFILE_SETTINGS' }
  ];

  const visibleItems = navItems.filter(item => canViewModule(item.module));

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-800 px-2 py-1 shadow-lg transition-colors">
      <div className="flex items-center justify-around h-14">
        {visibleItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center relative py-1 px-3 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-brand-500 dark:text-brand-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} />
                {Boolean(item.count && item.count > 0) && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};