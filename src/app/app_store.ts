import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoreBranding, ModulePermission, FoodItem } from '../db/db_types.js';

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
}

interface AppState {
  licenseStatus: 'VALID' | 'EXPIRED' | 'CLOCK_TAMPERED' | 'INACTIVE' | 'LOADING';
  isLicenseUsable: boolean;
  requestCode: string;
  setLicenseState: (status: 'VALID' | 'EXPIRED' | 'CLOCK_TAMPERED' | 'INACTIVE' | 'LOADING', isUsable: boolean, reqCode?: string) => void;

  branding: StoreBranding;
  setBranding: (branding: StoreBranding) => void;

  currentUser: { email: string; fullName: string; role: 'ADMIN' | 'STAFF' | 'CUSTOMER' } | null;
  guestSession: { token: string; temporaryName: string } | null;
  setUser: (user: { email: string; fullName: string; role: 'ADMIN' | 'STAFF' | 'CUSTOMER' } | null) => void;
  setGuestSession: (session: { token: string; temporaryName: string } | null) => void;
  logout: () => void;

  cart: CartItem[];
  addToCart: (item: FoodItem) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, delta: number) => void;
  clearCart: () => void;

  savedItemIds: number[];
  toggleSavedItem: (itemId: number) => void;

  permittedModules: ModulePermission[];
  setPermittedModules: (modules: ModulePermission[]) => void;
  canViewModule: (moduleCode: string) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      licenseStatus: 'LOADING',
      isLicenseUsable: false,
      requestCode: '',
      setLicenseState: (licenseStatus, isLicenseUsable, reqCode) =>
        set(state => ({ licenseStatus, isLicenseUsable, requestCode: reqCode || state.requestCode })),

      branding: {
        store_name: 'Foodie.',
        tagline: 'Hot meals, right at your door',
        hero_image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        default_address: 'San Francisco, CA • 25-35 min delivery',
        primary_color: '#2E7D32'
      },
      setBranding: branding => set({ branding }),

      currentUser: null,
      guestSession: null,
      setUser: user => set({ currentUser: user }),
      setGuestSession: session => set({ guestSession: session }),
      logout: () => set({ currentUser: null, guestSession: null, cart: [] }),

      cart: [],
      addToCart: item =>
        set(state => {
          const existing = state.cart.find(c => c.foodItem.id === item.id);
          if (existing) {
            return {
              cart: state.cart.map(c =>
                c.foodItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
              )
            };
          }
          return { cart: [...state.cart, { foodItem: item, quantity: 1 }] };
        }),
      removeFromCart: itemId =>
        set(state => ({ cart: state.cart.filter(c => c.foodItem.id !== itemId) })),
      updateQuantity: (itemId, delta) =>
        set(state => ({
          cart: state.cart
            .map(c => {
              if (c.foodItem.id === itemId) {
                const newQty = c.quantity + delta;
                return newQty > 0 ? { ...c, quantity: newQty } : null;
              }
              return c;
            })
            .filter(Boolean) as CartItem[]
        })),
      clearCart: () => set({ cart: [] }),

      savedItemIds: [],
      toggleSavedItem: itemId =>
        set(state => ({
          savedItemIds: state.savedItemIds.includes(itemId)
            ? state.savedItemIds.filter(id => id !== itemId)
            : [...state.savedItemIds, itemId]
        })),

      permittedModules: [],
      setPermittedModules: modules => set({ permittedModules: modules }),
      canViewModule: moduleCode => {
        const { currentUser, permittedModules } = get();
        if (currentUser?.role === 'ADMIN') return true;
        const mod = permittedModules.find(m => m.module_code === moduleCode);
        return Boolean(mod?.can_view);
      }
    }),
    {
      name: 'foodie_app_storage',
      partialize: state => ({
        currentUser: state.currentUser,
        guestSession: state.guestSession,
        cart: state.cart,
        savedItemIds: state.savedItemIds
      })
    }
  )
);