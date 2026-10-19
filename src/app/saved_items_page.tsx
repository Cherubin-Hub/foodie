import React, { useEffect, useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { useAppStore } from './app_store';
import { FoodItem } from '../db/db_types';

export const SavedItemsPage: React.FC = () => {
  const { savedItemIds, addToCart } = useAppStore();
  const [items, setItems] = useState<FoodItem[]>([]);

  useEffect(() => {
    fetch('/api/home')
      .then(res => res.json())
      .then(data => {
        if (data.food_items) {
          setItems(data.food_items.filter((f: FoodItem) => savedItemIds.includes(f.id)));
        }
      });
  }, [savedItemIds]);

  const sanitizeFoodImage = (url: string, name: string): string => {
    if (
      !url ||
      url.includes('1573140247632') ||
      (name.toLowerCase().includes('garlic bread') && (url.includes('1573140247632') || !url.includes('unsplash')))
    ) {
      return 'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&q=80';
    }
    return url;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-6">
      <div className="flex items-center gap-2">
        <Heart size={24} className="text-red-500" />
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Your Saved Favorites</h1>
      </div>

      {items.length === 0 ? (
        <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          You haven't saved any food items yet. Click the heart icon on any meal to pin it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm flex flex-col justify-between">
              <img
                src={sanitizeFoodImage(item.image_url, item.name)}
                alt={item.name}
                className="w-full h-36 object-cover rounded-2xl mb-3"
              />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</h3>
                <span className="text-brand-600 dark:text-brand-400 font-black text-sm">${Number(item.price).toFixed(2)}</span>
              </div>
              <button
                onClick={() => addToCart(item)}
                className="mt-3 w-full py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <Plus size={14} /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};