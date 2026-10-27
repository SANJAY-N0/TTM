import React, { useState } from 'react';
import { Store, Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2, HelpCircle, Phone, Mail, ShieldAlert } from 'lucide-react';
import { User } from '../../types';

interface CanteenLoginPortalProps {
  onLogin: (user: User) => void;
  onNavigate?: (path: string) => void;
}

export const CanteenLoginPortal: React.FC<CanteenLoginPortalProps> = ({ onLogin, onNavigate }) => {
  const [identifier, setIdentifier] = useState('kprcanteen');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role: 'CANTEEN_OWNER'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please check your canteen credentials.');
      }

      const { user, token } = data.data;

      if (token) {
        localStorage.setItem('timetomeal_auth_token', token);
      }

      const appUser: User = {
        id: user.id || user.user_id,
        name: user.name || 'Canteen Owner',
        email: user.email,
        role: 'staff',
        canteen_id: user.canteen_id,
        college_id: user.college_id,
        profile: {
          name: user.name || 'Canteen Owner',
          canteen_id: user.canteen_id,
          college_id: user.college_id
        }
      };

      localStorage.setItem('hb_current_user', JSON.stringify(appUser));
      onLogin(appUser);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate canteen account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7fa] flex items-center justify-center p-4 selection:bg-amber-500 selection:text-white">
      <div className="w-full max-w-[420px] bg-white rounded-[2rem] sm:rounded-[2.5rem] p-7 sm:p-8 shadow-2xl border border-slate-100 text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-600 text-white shadow-xl shadow-amber-600/30 mb-6">
          <Store className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          TimeTo<span className="text-amber-600">Meal</span>
        </h1>
        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1 mb-6">
          Canteen Partner Portal
        </p>

        {/* Notice: No Public Registration */}
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 mb-6 text-left">
          <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
            🔒 <strong>Staff Access Only:</strong> Canteen accounts are provisioned exclusively by authorized campus administrators. Public self-registration is disabled.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 text-left animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
              Canteen Username or Email
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. kprcanteen"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all uppercase disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In as Canteen Owner</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-left">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">
            Demo Canteen Credentials
          </span>
          <button
            type="button"
            onClick={() => {
              setIdentifier('kprcanteen');
              setPassword('admin123');
            }}
            className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-all"
          >
            <div className="text-[11px] font-extrabold text-amber-900">KPR Campus Canteen</div>
            <div className="text-[10px] text-amber-700">Username: <code className="font-mono">kprcanteen</code> &bull; Pass: <code className="font-mono">admin123</code></div>
          </button>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-left animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">Canteen Account Recovery</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                For security reasons, canteen owner passwords cannot be reset automatically online. Please reach out directly to the TimeToMeal Support Team or your Campus Administrator.
              </p>
              <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 mb-5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold">support@timetomeal.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold">+91 422 2635678 (Ext. 402)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
              >
                Close Support Notice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
