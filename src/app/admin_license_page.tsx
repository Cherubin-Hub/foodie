import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from './app_store';

interface TimeRemaining {
  isLifetime: boolean;
  isExpired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

function calculateTimeRemaining(expiresAt?: string | null): TimeRemaining | null {
  if (!expiresAt) return null;
  const targetDate = new Date(expiresAt);
  if (isNaN(targetDate.getTime())) return null;

  // Year 9000+ represents the Lifetime tier ('LIFE')
  if (targetDate.getFullYear() >= 9000) {
    return {
      isLifetime: true,
      isExpired: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'Lifetime Unlimited Access'
    };
  }

  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      isLifetime: false,
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'Expired'
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return {
    isLifetime: false,
    isExpired: false,
    days,
    hours,
    minutes,
    seconds,
    formatted: parts.join(' ')
  };
}

export const AdminLicensePage: React.FC = () => {
  const { licenseStatus, licenseExpiresAt, setLicenseState } = useAppStore();
  const [requestCode, setRequestCode] = useState('REQ-FOODIE_POS-A9F3K2');
  const [expiresAt, setExpiresAt] = useState<string | null>(licenseExpiresAt || null);
  const [currentStatus, setCurrentStatus] = useState<string>(licenseStatus);
  const [licenseKey, setLicenseKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [_currentTime, setCurrentTime] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/license/status');
      const data = await res.json();
      if (data.installation_request_code) {
        setRequestCode(data.installation_request_code);
      }
      if (data.expires_at !== undefined) {
        setExpiresAt(data.expires_at);
      }
      if (data.status) {
        setCurrentStatus(data.status);
      }
      setLicenseState(
        data.status || 'INACTIVE',
        Boolean(data.is_usable),
        data.installation_request_code,
        data.expires_at
      );
    } catch (err) {
      console.error('[AdminLicensePage] Failed to fetch license status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Live real-time ticker updating countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
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
        setCurrentStatus('VALID');
        if (data.expires_at) {
          setExpiresAt(data.expires_at);
        }
        if (data.new_request_code) {
          setRequestCode(data.new_request_code);
        }
        setLicenseState('VALID', true, data.new_request_code, data.expires_at);
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

  const timeRemaining = calculateTimeRemaining(expiresAt);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 pb-24 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
          <KeyRound size={32} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Offline Cryptographic License</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Manage cryptographic store activation, verify expiration time remaining, and rotate hardware request nonces.
        </p>
      </div>

      {/* Expiration & Countdown Status Card */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {currentStatus === 'VALID' && timeRemaining && !timeRemaining.isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <ShieldCheck size={14} />
                <span>Active & Verified License</span>
              </span>
            ) : currentStatus === 'EXPIRED' || (timeRemaining && timeRemaining.isExpired) ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-full text-xs font-bold">
                <AlertTriangle size={14} />
                <span>License Expired</span>
              </span>
            ) : currentStatus === 'CLOCK_TAMPERED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold">
                <AlertCircle size={14} />
                <span>Clock Tampered</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold">
                <Clock size={14} />
                <span>Store Inactive (Unlicensed)</span>
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Countdown Section */}
        {currentStatus === 'VALID' && timeRemaining && !timeRemaining.isExpired ? (
          timeRemaining.isLifetime ? (
            <div className="p-5 bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-emerald-500/10 border border-brand-200 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span>Lifetime Unlimited License</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-brand-500 text-white rounded-md">
                    Permanent
                  </span>
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  This POS terminal has unrestricted access and will never expire.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Time Left Before Expiration
                </span>
              </div>

              {/* 3 Digit Tiles: Days, Hours, Minutes */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-gray-900 dark:text-white">
                    {String(timeRemaining.days).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 mt-1">
                    Days
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-gray-900 dark:text-white">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 mt-1">
                    Hours
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-gray-900 dark:text-white">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 mt-1">
                    Minutes
                  </div>
                </div>
              </div>

              {expiresAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pt-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span>
                    Expires on:{' '}
                    <strong className="text-gray-700 dark:text-gray-200">
                      {new Date(expiresAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )
        ) : currentStatus === 'EXPIRED' || (timeRemaining && timeRemaining.isExpired) ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <AlertTriangle size={16} />
              <span>License Expired</span>
            </div>
            <p>
              Your terminal license expired
              {expiresAt ? ` on ${new Date(expiresAt).toLocaleDateString()}` : ''}. Client ordering and checkout operations are currently suspended. Enter a new activation key below to restore store access.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sm text-gray-800">
              <Clock size={16} />
              <span>No Active License Detected</span>
            </div>
            <p>
              The store ordering system is currently locked. Copy your Installation Request Code below and enter a signed activation key from your vendor.
            </p>
          </div>
        )}
      </div>

      {/* Installation Request Code Card */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 transition-colors">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Installation Request Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={requestCode}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
            Send this Request Code to your vendor to generate an activation key matching your terminal hardware nonce.
          </p>
        </div>

        {/* License Key Activation Form */}
        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Signed License Key
            </label>
            <input
              type="text"
              required
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)}
              placeholder="LIC-FOODIE_POS-30D-A9F3K2-XXXXXXXXXXXX"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono uppercase text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Validating Cryptographic Signature...</span>
              </>
            ) : (
              <span>Activate License</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};