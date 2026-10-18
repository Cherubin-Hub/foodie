import React, { useEffect, useState } from 'react';
import { Clock, Flame, Plus, Check, Search, Tag, Sparkles } from 'lucide-react';
import { useAppStore } from './app_store';
import { Category, FoodItem, Deal } from '../db/db_types';

export const HomeMenuPage: React.FC = () => {
  const { currentUser, guestSession, cart, addToCart, savedItemIds, toggleSavedItem, setPermittedModules } = useAppStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = currentUser?.role || 'GUEST';
    const guestToken = guestSession?.token;

    fetch(`/api/home?role=${role}${guestToken ? `&guestToken=${guestToken}` : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.categories || []);
          setDeals(data.deals || []);
          setFoodItems(data.food_items || []);
          if (data.permitted_modules) {
            setPermittedModules(data.permitted_modules);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser, guestSession]);

  const filteredItems = foodItems.filter(item => {
    const matchesCat = selectedCatId === 0 || item.category_id === selectedCatId;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-12 space-y-8">
      {/* Search Input Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search burgers, pizzas, ramen..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Hero Deals Banner */}
      {deals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map(deal => (
            <div
              key={deal.id}
              className="bg-gradient-to-r from-emerald-800 to-brand-500 text-white rounded-3xl p-5 shadow-lg shadow-emerald-900/10 flex items-center justify-between relative overflow-hidden"
            >
              <div className="space-y-1 relative z-10">
                <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-full">
                  <Sparkles size={12} /> Special Promo
                </span>
                <h3 className="text-lg font-black">{deal.title}</h3>
                <p className="text-xs text-white/80 max-w-[220px]">{deal.description}</p>
                <div className="pt-2">
                  <span className="px-2.5 py-1 bg-white text-emerald-900 text-xs font-black rounded-lg">
                    {deal.promo_code}
                  </span>
                </div>
              </div>
              <Tag size={64} className="text-white/15 absolute -right-2 -bottom-2 transform rotate-12" />
            </div>
          ))}
        </div>
      )}

      {/* Category Horizontal Filter Pills */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-gray-900">Categories</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedCatId(0)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedCatId === 0
                ? 'bg-brand-500 text-white shadow-brand-500/30'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all shadow-sm ${
                selectedCatId === cat.id
                  ? 'bg-brand-500 text-white shadow-brand-500/30'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <img src={cat.image_url} alt={cat.name} className="w-5 h-5 rounded-full object-cover" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Food Items Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">Popular Delicacies</h2>
          <span className="text-xs text-gray-500 font-medium">{filteredItems.length} items</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-3xl p-3 h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map(item => {
              const inCart = cart.find(c => c.foodItem.id === item.id);
              const isSaved = savedItemIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="relative overflow-hidden rounded-2xl mb-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => toggleSavedItem(item.id)}
                      className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-colors ${
                        isSaved ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
                      }`}
                    >
                      ♥
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Flame size={14} className="text-amber-500" />
                        {item.calories} Cal
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        {item.prep_time_minutes} min
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-gray-50 mt-3">
                    <span className="text-lg font-black text-brand-500">
                      ${Number(item.price).toFixed(2)}
                    </span>

                    <button
                      onClick={() => addToCart(item)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        inCart
                          ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                          : 'bg-brand-500 text-white hover:bg-brand-600 active:scale-95'
                      }`}
                    >
                      {inCart ? (
                        <>
                          <Check size={14} /> Added ({inCart.quantity})
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};