import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Utensils } from 'lucide-react';
import { useAppStore } from './app_store';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { branding } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col justify-between p-6">
      <div className="pt-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4">
          <Utensils size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{branding.store_name}</h1>
        <p className="text-gray-600 mt-2 text-sm font-medium">{branding.tagline}</p>
      </div>

      <div className="my-auto flex justify-center">
        <img
          src={branding.hero_image_url}
          alt="Delivery Scooter"
          className="w-full max-w-sm h-64 object-cover rounded-3xl shadow-xl shadow-gray-200 border-4 border-white"
        />
      </div>

      <div className="pb-8 space-y-3">
        <button
          onClick={() => navigate('/login')}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
        >
          <span>Get Started</span>
          <ArrowRight size={18} />
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl text-sm transition-colors"
        >
          Browse Menu Anonymously
        </button>
      </div>
    </div>
  );
};