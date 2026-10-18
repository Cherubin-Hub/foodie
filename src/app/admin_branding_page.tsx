import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useAppStore } from './app_store';

export const AdminBrandingPage: React.FC = () => {
  const { branding, setBranding } = useAppStore();
  const [storeName, setStoreName] = useState(branding.store_name);
  const [tagline, setTagline] = useState(branding.tagline);
  const [defaultAddress, setDefaultAddress] = useState(branding.default_address);
  const [heroImage, setHeroImage] = useState(branding.hero_image_url);
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      store_name: storeName,
      tagline,
      default_address: defaultAddress,
      hero_image_url: heroImage,
      primary_color: primaryColor
    };

    await fetch('/api/admin/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    setBranding(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 space-y-6">
      <div className="flex items-center gap-2">
        <Palette size={24} className="text-brand-500" />
        <h1 className="text-2xl font-black text-gray-900">Store Branding</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Store Name</label>
          <input
            type="text"
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={e => setTagline(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Default Address Header</label>
          <input
            type="text"
            value={defaultAddress}
            onChange={e => setDefaultAddress(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hero Image URL</label>
          <input
            type="text"
            value={heroImage}
            onChange={e => setHeroImage(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Theme Color Hex</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded-xl cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-brand-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          {saved ? <Check size={16} /> : null}
          <span>{saved ? 'Branding Saved!' : 'Save Branding Changes'}</span>
        </button>
      </form>
    </div>
  );
};