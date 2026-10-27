import React, { useState, useEffect } from 'react';
import { AutoSleepSettings } from '../types';
import { Moon, Sparkles, Utensils } from 'lucide-react';

export const AutoSleepOverlay: React.FC = () => {
  const [isSleeping, setIsSleeping] = useState(false);
  const [time, setTime] = useState(new Date());

  const getSettings = (): AutoSleepSettings => {
    const saved = localStorage.getItem('hb_auto_sleep_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      idle_minutes: 5,
      // sleep_message: 'Touch anywhere to wake up TimeToMeal Counter Terminal'
    };
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const resetTimer = () => {
      const settings = getSettings();
      if (!settings.enabled) {
        setIsSleeping(false);
        return;
      }

      setIsSleeping(false);
      clearTimeout(idleTimer);

      const timeoutMs = (settings.idle_minutes || 5) * 60 * 1000;
      idleTimer = setTimeout(() => {
        setIsSleeping(true);
      }, timeoutMs);
    };

    // Events to track user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, []);

  if (!isSleeping) return null;

  const settings = getSettings();

  return (
    <div
      onClick={() => setIsSleeping(false)}
      className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md text-white flex flex-col items-center justify-between p-12 cursor-pointer select-none animate-in fade-in duration-500"
    >
      {/* Top Branding Header */}
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
          <Utensils className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h2 className="text-sm font-black tracking-widest uppercase text-emerald-400">TimeToMeal SaaS</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kiosk Standby Mode</p>
        </div>
      </div>

      {/* Center Digital Clock & Message */}
      <div className="text-center space-y-4 my-auto">
        <div className="space-y-1">
          <h1 className="text-7xl sm:text-9xl font-black font-mono tracking-tight text-white drop-shadow-2xl">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-lg animate-bounce mt-6">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{settings.sleep_message || 'Touch anywhere to wake up terminal'}</span>
        </div>
      </div>

    </div>
  );
};

export default AutoSleepOverlay;
