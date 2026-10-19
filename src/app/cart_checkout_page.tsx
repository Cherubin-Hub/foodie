import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, Tag, MapPin, Users, ShoppingBag } from 'lucide-react';
import { useAppStore } from './app_store';

export const CartCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, currentUser, guestSession, branding } = useAppStore();

  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEOUT' | 'DELIVERY'>('DINE_IN');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number; freeShip: boolean } | null>(null);
  const [address, setAddress] = useState(branding.default_address);
  const [loading, setLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + Number(item.foodItem.price) * item.quantity, 0);
  const discount = appliedPromo ? Number((subtotal * (appliedPromo.percent / 100)).toFixed(2)) : 0;
  const deliveryFee = orderType === 'DELIVERY' && !(appliedPromo?.freeShip) ? 3.50 : 0.00;
  const total = (subtotal - discount) + deliveryFee;

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'FOODIE30') {
      setAppliedPromo({ code: 'FOODIE30', percent: 30, freeShip: false });
    } else if (code === 'FREESHIP') {
      setAppliedPromo({ code: 'FREESHIP', percent: 0, freeShip: true });
    } else {
      setPromoError('Invalid promo code');
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const payload = {
        userId: currentUser ? 1 : null,
        guestSessionToken: guestSession?.token || null,
        guestTemporaryName: guestSession?.temporaryName || 'Anonymous Guest',
        orderType,
        promoCode: appliedPromo?.code || null,
        deliveryAddress: orderType === 'DELIVERY' ? address : null,
        items: cart.map(c => ({
          food_item_id: c.foodItem.id,
          item_name: c.foodItem.name,
          quantity: c.quantity,
          unit_price: Number(c.foodItem.price)
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.tracking_token) {
        clearCart();
        navigate(`/order/track/${data.tracking_token}`);
      } else {
        alert(data.message || 'Failed to place order');
      }
    } catch (err) {
      alert('Network error placing order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-3xl flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4 border border-gray-200/50 dark:border-gray-800">
          <ShoppingBag size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
          Explore delicious meals from our catalog and add your favorites to checkout.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold rounded-2xl text-xs shadow-md shadow-brand-500/20 transition-all"
        >
          Explore Home Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28 sm:pb-12 space-y-8">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Review & Checkout</h1>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{cart.length} unique items</span>
      </div>

      {/* Guest Identification Pill */}
      {guestSession && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center gap-3">
          <Users size={20} className="text-brand-500 dark:text-brand-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-emerald-900 dark:text-emerald-200">Ordering as Guest: </span>
            <span className="font-black text-brand-600 dark:text-brand-400">{guestSession.temporaryName}</span>
          </div>
        </div>
      )}

      {/* Order Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Dining Preference
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['DINE_IN', 'TAKEOUT', 'DELIVERY'] as const).map(type => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                orderType === type
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80'
              }`}
            >
              {type === 'DINE_IN' ? 'Dine In' : type === 'TAKEOUT' ? 'Takeout' : 'Delivery'}
            </button>
          ))}
        </div>
      </div>

      {/* Address if Delivery */}
      {orderType === 'DELIVERY' && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Delivery Destination
          </label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Cart Items List */}
      <div className="space-y-3">
        {cart.map(item => (
          <div
            key={item.foodItem.id}
            className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  item.foodItem.image_url?.includes('1573140247632')
                    ? 'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&q=80'
                    : item.foodItem.image_url
                }
                alt={item.foodItem.name}
                className="w-14 h-14 object-cover rounded-xl"
              />
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.foodItem.name}</h4>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-bold">
                  ${Number(item.foodItem.price).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-xl">
                <button
                  onClick={() => updateQuantity(item.foodItem.id, -1)}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-red-500"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xs font-bold px-1 text-gray-900 dark:text-white">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.foodItem.id, 1)}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-brand-500"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.foodItem.id)}
                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Promotional Discount
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              placeholder="e.g. FOODIE30 or FREESHIP"
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            />
          </div>
          <button
            onClick={handleApplyPromo}
            className="px-5 py-3 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white font-bold rounded-xl text-xs border border-transparent dark:border-gray-700 transition-colors"
          >
            Apply
          </button>
        </div>
        {appliedPromo && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            ✓ Promo '{appliedPromo.code}' successfully applied!
          </p>
        )}
        {promoError && <p className="text-xs text-red-500 font-medium">{promoError}</p>}
      </div>

      {/* Financial Summary Calculation Card */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-3 text-sm transition-colors">
        <div className="flex justify-between text-gray-500 dark:text-gray-400">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Discount ({appliedPromo?.percent}%)</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        {orderType === 'DELIVERY' && (
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
          </div>
        )}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between text-base font-black text-gray-900 dark:text-white">
          <span>Total Bill</span>
          <span className="text-brand-600 dark:text-brand-400 text-xl">${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 text-base transition-all active:scale-[0.99]"
      >
        <span>{loading ? 'Submitting Order...' : 'Confirm & Place Order'}</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};