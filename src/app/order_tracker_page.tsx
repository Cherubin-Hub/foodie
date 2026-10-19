import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, ChefHat, Bike, Check, Printer, Share2, ArrowLeft } from 'lucide-react';
import { OrderRecord } from '../db/db_types';

export const OrderTrackerPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchOrder = () => {
      fetch(`/api/orders/track/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.order) {
            setOrder(data.order);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const steps = [
    { key: 'PENDING', label: 'Order Placed', icon: Clock },
    { key: 'PREPARING', label: 'In Kitchen', icon: ChefHat },
    { key: 'READY', label: 'Ready / Delivery', icon: Bike },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 }
  ];

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = steps.findIndex(s => s.key === order.status);
    return index >= 0 ? index : 0;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Foodie Order ${token}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Order tracking link copied to clipboard!');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-500">Retrieving order details...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Not Found</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Tracking token {token} could not be resolved.</p>
        <Link to="/" className="inline-block px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold">
          Return Home
        </Link>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 text-xs font-semibold">
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Printer size={16} /> Print Receipt
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-brand-600 dark:text-brand-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>

      {/* 4-Step Live Status Stepper */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-6 transition-colors">
        <div className="text-center space-y-1">
          <span className="text-[10px] uppercase font-black tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 border border-brand-200/50 dark:border-brand-800/60 px-2.5 py-1 rounded-full">
            Live Order Tracking
          </span>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Token: {order.tracking_token}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Customer: <span className="font-bold text-gray-800 dark:text-gray-200">{order.guest_temporary_name || 'Customer'}</span> • {order.order_type}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-4 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative z-10">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 ring-4 ring-brand-100 dark:ring-brand-900/60'
                      : isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {isCompleted && !isCurrent ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <span className={`text-[11px] font-bold ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Itemized Digital Receipt Card */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-4 print:border-none print:shadow-none transition-colors">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
          <h3 className="font-black text-base text-gray-900 dark:text-white">Itemized Receipt</h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-gray-800 space-y-2">
          {order.items?.map(item => (
            <div key={item.id} className="pt-2 flex justify-between text-xs">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">{item.item_name}</span>
                <span className="text-gray-400 dark:text-gray-500 ml-2">x{item.quantity}</span>
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">${Number(item.total_price).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Discount</span>
              <span>-${Number(order.discount_amount).toFixed(2)}</span>
            </div>
          )}
          {Number(order.delivery_fee) > 0 && (
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>${Number(order.delivery_fee).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
            <span>Total Paid</span>
            <span className="text-brand-600 dark:text-brand-400">${Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};