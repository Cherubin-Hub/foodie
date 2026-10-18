import React, { useEffect, useState } from 'react';
import { Tag, Sparkles, Copy, Check } from 'lucide-react';
import { Deal } from '../db/db_types';

export const OffersPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/home')
      .then(res => res.json())
      .then(data => setDeals(data.deals || []));
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 space-y-6">
      <div className="flex items-center gap-2">
        <Tag size={24} className="text-brand-500" />
        <h1 className="text-2xl font-black text-gray-900">Deals & Coupons</h1>
      </div>

      <div className="space-y-4">
        {deals.map(deal => (
          <div
            key={deal.id}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Sparkles size={12} /> {deal.discount_percentage}% Discount
              </span>
              <h3 className="text-lg font-black text-gray-900">{deal.title}</h3>
              <p className="text-xs text-gray-500">{deal.description}</p>
            </div>

            <button
              onClick={() => handleCopy(deal.promo_code)}
              className="px-5 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors self-start sm:self-auto"
            >
              {copiedCode === deal.promo_code ? (
                <>
                  <Check size={14} className="text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy '{deal.promo_code}'
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};