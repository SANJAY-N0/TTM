import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { User } from '../../types';

interface AdminLoginPortalProps {
  onLogin: (user: User) => void;
  onNavigate?: (path: string) => void;
}

export const AdminLoginPortal: React.FC<AdminLoginPortalProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('admin@timetomeal.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email.trim(),
          password,
          role: 'ADMIN'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Administrator authentication failed.');
      }

      const { user, token } = data.data;

      if (token) {
        localStorage.setItem('timetomeal_auth_token', token);
      }

      const appUser: User = {
        id: user.id || user.user_id,
        name: user.name || 'System Super Admin',
        email: user.email,
        role: 'admin',
        college_id: user.college_id,
        profile: {
          name: user.name || 'System Super Admin',
          department: 'Platform Administration'
        }
      };

      localStorage.setItem('hb_current_user', JSON.stringify(appUser));
      onLogin(appUser);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7fa] flex items-center justify-center p-4 selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-[420px] bg-white rounded-[2rem] sm:rounded-[2.5rem] p-7 sm:p-8 shadow-2xl border border-slate-100 text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-purple-700 text-white shadow-xl shadow-purple-700/30 mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          TimeTo<span className="text-purple-600">Meal</span>
        </h1>
        <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-1 mb-6">
          Administrator Command Center
        </p>

        {/* Notice */}
        <div className="bg-purple-50/60 border border-purple-200/60 rounded-2xl p-4 mb-6 text-left">
          <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
            🛡️ <strong>Authorized Access Only:</strong> This console is strictly reserved for platform administrators to manage colleges, departments, academic years, canteens, and audit trails.
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
              Admin Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@timetomeal.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
              Admin Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-2xl bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-700/25 transition-all uppercase disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Access Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-left">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">
            Super Administrator Credentials
          </span>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@timetomeal.com');
              setPassword('admin123');
            }}
            className="w-full p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition-all"
          >
            <div className="text-[11px] font-extrabold text-purple-900">Platform Super Admin</div>
            <div className="text-[10px] text-purple-700">Email: <code className="font-mono">admin@timetomeal.com</code> &bull; Pass: <code className="font-mono">admin123</code></div>
          </button>
        </div>
      </div>
    </div>
  );
};
