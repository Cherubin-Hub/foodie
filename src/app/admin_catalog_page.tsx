import React, { useEffect, useState } from 'react';
import { Plus, Check, SlidersHorizontal } from 'lucide-react';
import { FoodItem } from '../db/db_types';

export const AdminCatalogPage: React.FC = () => {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [calories, setCalories] = useState('450');
  const [prepTime, setPrepTime] = useState('15');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/home')
      .then(res => res.json())
      .then(data => setItems(data.food_items || []));
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    await fetch('/api/admin/catalog/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        category_id: Number(categoryId),
        price: Number(price),
        calories: Number(calories),
        prep_time_minutes: Number(prepTime),
        image_url: imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
        is_available: true
      })
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setName('');
    setPrice('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-6">
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={24} className="text-brand-500" />
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Catalog Builder</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-4 transition-colors">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Add New Food Item</h2>
        <form onSubmit={handleCreateItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Item Name (e.g. Truffle Fries)"
            className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          />
          <input
            type="number"
            step="0.01"
            required
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="Price (e.g. 8.99)"
            className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          />
          <select
            value={categoryId}
            onChange={e => setCategoryId(Number(e.target.value))}
            className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          >
            <option value={1}>Burger</option>
            <option value={2}>Pizza</option>
            <option value={3}>Sushi</option>
            <option value={4}>Chicken</option>
            <option value={5}>Meat</option>
            <option value={6}>Noodles</option>
            <option value={7}>Pasta</option>
          </select>
          <input
            type="number"
            value={calories}
            onChange={e => setCalories(e.target.value)}
            placeholder="Calories"
            className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          />
          <input
            type="number"
            value={prepTime}
            onChange={e => setPrepTime(e.target.value)}
            placeholder="Prep Time (Minutes)"
            className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          />
          <input
            type="text"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Image URL"
            className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          />
          <button
            type="submit"
            className="sm:col-span-2 py-3 bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {saved ? <Check size={16} /> : <Plus size={16} />}
            <span>{saved ? 'Item Created!' : 'Save Food Item'}</span>
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-3 transition-colors">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Current Items ({items.length})</h3>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map(item => (
            <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-800 dark:text-gray-200">{item.name}</span>
              <span className="text-brand-600 dark:text-brand-400 font-bold">${Number(item.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};