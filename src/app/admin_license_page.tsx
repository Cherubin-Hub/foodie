import React, { useEffect, useState } from 'react';
import { KeyRound, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAppStore } from './app_store';

export const AdminLicensePage: React.FC = () => {
  const { setLicenseState } = useAppStore();
  const [requestCode, setRequestCode] = useState('REQ-FOODIE_POS-A9F3K2');
  const [licenseKey, setLicenseKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/license/status')
      .then(res => res.json())
      .then(data => {
        if (data.installation_request_code) {
          setRequestCode(data.installation_request_code);
        }
      });
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(requestCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({ type: 'success', text: 'License activated successfully!' });
        setLicenseState('VALID', true, data.new_request_code);
        if (data.new_request_code) setRequestCode(data.new_request_code);
        setLicenseKey('');
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Signature mismatch or invalid key' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to communicate with activation endpoint' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 pb-24 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
          <KeyRound size={32} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Offline Cryptographic License</h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Copy your hardware Installation Request Code and submit a signed activation key provided by your vendor.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Installation Request Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={requestCode}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-800"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Signed License Key
            </label>
            <input
              type="text"
              required
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)}
              placeholder="LIC-FOODIE_POS-30D-A9F3K2-XXXXXXXXXXXX"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMsg.type === 'success' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !licenseKey.trim()}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-brand-500/20 transition-all"
          >
            {loading ? 'Validating Cryptographic Signature...' : 'Activate License'}
          </button>
        </form>
      </div>
    </div>
  );
};