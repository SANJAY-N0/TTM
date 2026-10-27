import React, { useState } from 'react';
import { Coffee, ArrowRight, ShieldCheck, AlertCircle, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { User } from '../../types';
import { StudentProfileSetup } from './StudentProfileSetup';

interface StudentLoginPortalProps {
  onLogin: (user: User) => void;
  onNavigate?: (path: string) => void;
}

export const StudentLoginPortal: React.FC<StudentLoginPortalProps> = ({ onLogin, onNavigate }) => {
  const [googleEmail, setGoogleEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile setup wizard state (when new student logs in)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [detectedCollege, setDetectedCollege] = useState<any>(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [studentName, setStudentName] = useState('');

  const handleGoogleSignIn = async (emailToUse?: string, nameToUse?: string) => {
    setError(null);
    setLoading(true);

    const email = (emailToUse || googleEmail).trim().toLowerCase();

    if (!email) {
      setError('Please enter your college email address to sign in with Google.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: nameToUse || email.split('@')[0].replace(/\./g, ' '),
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed.');
      }

      const { isProfileComplete, detectedCollege: college, user, token } = data.data;

      if (token) {
        localStorage.setItem('timetomeal_auth_token', token);
      }

      if (!isProfileComplete) {
        // Redirect new students to Profile Setup
        setVerifiedEmail(email);
        setStudentName(user?.name || nameToUse || email.split('@')[0]);
        setDetectedCollege(college);
        setNeedsProfileSetup(true);
      } else {
        // Profile is already completed, redirect directly to Student Dashboard
        const appUser: User = {
          id: user.student_id || user.id,
          name: user.name,
          email: user.email,
          role: 'student',
          college_id: user.college_id,
          rollNumber: user.roll_number,
          profile: {
            full_name: user.name,
            roll_number: user.roll_number,
            stay_classification: user.stay_classification || 'HOSTELLER'
          }
        };
        localStorage.setItem('hb_current_user', JSON.stringify(appUser));
        onLogin(appUser);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate student account.');
    } finally {
      setLoading(false);
    }
  };

  if (needsProfileSetup) {
    return (
      <StudentProfileSetup
        email={verifiedEmail}
        initialName={studentName}
        detectedCollege={detectedCollege}
        onSuccess={onLogin}
        onBack={() => setNeedsProfileSetup(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f7fa] flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-[420px] bg-white rounded-[2rem] sm:rounded-[2.5rem] p-7 sm:p-8 shadow-2xl border border-slate-100 text-center">
        {/* Platform Brand Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 mb-6">
          <Coffee className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          TimeTo<span className="text-emerald-600">Meal</span>
        </h1>
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1 mb-6">
          Student Dining Portal
        </p>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 text-left animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Google OAuth Callout Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-6 text-left">
          <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Campus Email Verification</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Please log in using your official institutional email (e.g. <strong className="text-slate-700">@kprcas.ac.in</strong>). External domains are restricted for student safety.
          </p>
        </div>

        {/* Google Sign-In Action */}
        <div className="space-y-4">
          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
              College Email ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="e.g. sanjay.26k24@kprcas.ac.in"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGoogleSignIn();
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGoogleSignIn()}
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.99] text-slate-700 font-bold text-xs tracking-wide flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Sign in with Google OAuth</span>
          </button>

          {/* Quick Demo Student Sign-In */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Instant Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGoogleSignIn('sanjay.26k24@kprcas.ac.in', 'Sanjay N')}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-all"
              >
                <div className="text-[11px] font-extrabold text-emerald-800">Sanjay N</div>
                <div className="text-[9px] text-emerald-600 truncate">sanjay.26k24@kprcas.ac.in</div>
              </button>
              <button
                type="button"
                onClick={() => handleGoogleSignIn('new.student@kprcas.ac.in', 'New Student')}
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition-all"
              >
                <div className="text-[11px] font-extrabold text-blue-800">+ New Student</div>
                <div className="text-[9px] text-blue-600 truncate">Setup Profile Demo</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          TimeToMeal Campus Dining System &bull; Multi-Tenant Platform
        </div>
      </div>
    </div>
  );
};
