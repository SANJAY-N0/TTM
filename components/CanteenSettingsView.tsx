import React, { useState } from 'react';
import { User, CanteenProfile, BankDetails, DeviceIntegrationSettings, AutoSleepSettings } from '../types';
import { 
  Store, CreditCard, Monitor, Moon, Save, CheckCircle2, 
  ShieldCheck, Smartphone, LogOut, Lock, Key, Wifi, RefreshCw
} from 'lucide-react';

interface CanteenSettingsViewProps {
  user: User;
  onLogout: () => void;
}

type SettingsTab = 'payment-details' | 'device-integration' | 'auto-sleep';

export const CanteenSettingsView: React.FC<CanteenSettingsViewProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('payment-details');
  const [showToast, setShowToast] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const canteenProfile = user.profile as CanteenProfile;

  // Bank & Payment Details State
  const [bankDetails, setBankDetails] = useState<BankDetails>(() => {
    const saved = localStorage.getItem('hb_bank_details');
    return saved ? JSON.parse(saved) : {
      bank_name: 'HDFC Bank',
      account_number: '91823749210293',
      ifsc_code: 'HDFC0001234',
      account_holder_name: 'TimeToMeal Central Canteen Stalls',
      upi_id: 'timetomeal@hdfcbank',
      cashfree_merchant_id: 'CF_MERCHANT_9921',
      cashfree_api_key: 'cf_live_9921882199',
      cashfree_secret_key: '••••••••••••••••'
    };
  });

  // Device Integration Settings State
  const [deviceSettings, setDeviceSettings] = useState<DeviceIntegrationSettings>(() => {
    const saved = localStorage.getItem('hb_device_settings');
    return saved ? JSON.parse(saved) : {
      device_id: 'DEV-POS-099',
      device_name: 'Main Counter Thermal Kiosk',
      device_ip: '192.168.1.105',
      connection_status: 'connected',
      auto_print_receipt: true
    };
  });

  // Auto Sleep Mode Settings State
  const [autoSleepSettings, setAutoSleepSettings] = useState<AutoSleepSettings>(() => {
    const saved = localStorage.getItem('hb_auto_sleep_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      idle_minutes: 5,
      sleep_message: 'Touch anywhere to wake up TimeToMeal Counter Terminal'
    };
  });

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('hb_bank_details', JSON.stringify(bankDetails));
    localStorage.setItem('hb_device_settings', JSON.stringify(deviceSettings));
    localStorage.setItem('hb_auto_sleep_settings', JSON.stringify(autoSleepSettings));

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-8 z-[200] bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4" /> Settings updated & saved successfully!
        </div>
      )}

      {/* Simplified Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div>
          <h1 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-500" />
            <span>Canteen Settings</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
            {canteenProfile?.canteen_name || 'TimeToMeal Main Canteen'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('payment-details')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'payment-details'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Details</span>
          </button>

          <button
            onClick={() => setActiveTab('device-integration')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'device-integration'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Device Integration</span>
          </button>

          <button
            onClick={() => setActiveTab('auto-sleep')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'auto-sleep'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Auto Sleep Mode</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form Container */}
      <div className="max-w-4xl mx-auto w-full p-6 space-y-6 flex-1">
        <form onSubmit={handleSaveAll} className="space-y-6">
          
          {/* TAB 1: PAYMENT DETAILS */}
          {activeTab === 'payment-details' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Bank Account Information Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Bank Account Details</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Settlement & Payout Configuration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={bankDetails.account_holder_name}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankDetails.bank_name}
                      onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Account Number</label>
                    <input
                      type="text"
                      required
                      value={bankDetails.account_number}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={bankDetails.ifsc_code}
                      onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 font-mono uppercase"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Primary UPI ID for Counter QR</label>
                    <input
                      type="text"
                      required
                      value={bankDetails.upi_id}
                      onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Cashfree Payment Gateway Credentials */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Cashfree Payment Gateway Integration</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Online Pre-order Settlement Keys</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cashfree Merchant ID</label>
                    <input
                      type="text"
                      value={bankDetails.cashfree_merchant_id || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, cashfree_merchant_id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">App ID / API Key</label>
                    <input
                      type="text"
                      value={bankDetails.cashfree_api_key || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, cashfree_api_key: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Secret Key</label>
                    <input
                      type="password"
                      value={bankDetails.cashfree_secret_key || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, cashfree_secret_key: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEVICE INTEGRATION */}
          {activeTab === 'device-integration' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Counter POS & Device Integration</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Terminal Hardware Configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Device ID</label>
                  <input
                    type="text"
                    required
                    value={deviceSettings.device_id}
                    onChange={(e) => setDeviceSettings({ ...deviceSettings, device_id: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Device Name</label>
                  <input
                    type="text"
                    required
                    value={deviceSettings.device_name}
                    onChange={(e) => setDeviceSettings({ ...deviceSettings, device_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Device IP Address</label>
                  <input
                    type="text"
                    required
                    value={deviceSettings.device_ip}
                    onChange={(e) => setDeviceSettings({ ...deviceSettings, device_ip: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Connection Status</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                    <Wifi className="w-4 h-4 animate-pulse" />
                    <span>Connected / Online (100% Signal)</span>
                  </div>
                </div>
              </div>

              {/* Auto Print Receipt Toggle */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Auto Print Receipt</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Automatically trigger thermal bill printing upon order confirmation</p>
                </div>

                <button
                  type="button"
                  onClick={() => setDeviceSettings({ ...deviceSettings, auto_print_receipt: !deviceSettings.auto_print_receipt })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    deviceSettings.auto_print_receipt ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      deviceSettings.auto_print_receipt ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AUTO SLEEP MODE */}
          {activeTab === 'auto-sleep' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Kiosk Auto Sleep Mode</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Power Saving & Idle Screen Protection</p>
                </div>
              </div>

              {/* Enable Auto Sleep Toggle */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Enable Auto Sleep Mode</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Screen darkens into full-screen branded kiosk state during inactivity</p>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoSleepSettings({ ...autoSleepSettings, enabled: !autoSleepSettings.enabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    autoSleepSettings.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      autoSleepSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Idle Duration Before Sleep</label>
                  <select
                    value={autoSleepSettings.idle_minutes}
                    onChange={(e) => setAutoSleepSettings({ ...autoSleepSettings, idle_minutes: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 font-bold text-xs"
                  >
                    <option value={1}>1 Minute</option>
                    <option value={2}>2 Minutes</option>
                    <option value={5}>5 Minutes (Default)</option>
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Custom Screen Wake Message</label>
                  <input
                    type="text"
                    required
                    value={autoSleepSettings.sleep_message}
                    onChange={(e) => setAutoSleepSettings({ ...autoSleepSettings, sleep_message: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowLogoutDialog(true)}
              className="px-5 py-3 rounded-xl text-xs font-black bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-all flex items-center gap-2 border border-rose-200 dark:border-rose-900/50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Account</span>
            </button>

            <button
              type="submit"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>

        </form>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Confirm Account Logout</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Are you sure you want to end your current terminal session?</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 py-3 rounded-xl font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-all text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowLogoutDialog(false);
                  onLogout();
                }}
                className="flex-1 py-3 rounded-xl font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md text-xs"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanteenSettingsView;
