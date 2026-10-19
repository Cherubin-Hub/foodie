import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, RefreshCw, KeyRound, Palette, Shield, SlidersHorizontal } from 'lucide-react';
import { OrderRecord } from '../db/db_types';

export const AdminDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchOrders();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 space-y-6">
      {/* Top Admin Sub-nav Links */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
        <Link to="/admin/dashboard" className="px-4 py-2 bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm">
          <ChefHat size={16} /> Kitchen Orders
        </Link>
        <Link to="/admin/catalog" className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors">
          <SlidersHorizontal size={16} /> Catalog Builder
        </Link>
        <Link to="/admin/branding" className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors">
          <Palette size={16} /> Branding Settings
        </Link>
        <Link to="/admin/rbac" className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors">
          <Shield size={16} /> Access Matrix (RBAC)
        </Link>
        <Link to="/admin/license" className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors">
          <KeyRound size={16} /> License Lock
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Live Kitchen Orders</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Real-time status updater for incoming table and delivery tickets</p>
        </div>
        <button onClick={fetchOrders} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-700 rounded-xl text-xs flex items-center gap-1 font-bold transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-12">Loading incoming kitchen tickets...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          No live tickets found. Orders placed by customers or table guests will appear here automatically.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-3 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 dark:border-gray-800 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 mr-2">{order.tracking_token}</span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{order.guest_temporary_name || 'Customer'}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">({order.order_type})</span>
                </div>
                <span className="text-sm font-black text-gray-900 dark:text-white">${Number(order.total_amount).toFixed(2)}</span>
              </div>

              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {order.items?.map(i => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.item_name} x{i.quantity}</span>
                    <span>${Number(i.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-2">Status:</span>
                {(['PENDING', 'PREPARING', 'READY', 'COMPLETED'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(order.id, st)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      order.status === st
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};