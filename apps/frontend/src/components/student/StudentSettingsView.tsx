import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, FileText, HelpCircle, CreditCard, Shield, Bell, Lock, UserCheck, 
  Download, Printer, Search, Filter, Plus, Trash2, Edit2, Check, X, Eye, 
  Sparkles, Clock, Globe, Phone, Mail, MapPin, MessageSquare, AlertCircle, 
  Save, RefreshCw, CheckCircle2, ChevronDown, Calendar, FileSpreadsheet, 
  FileCode, Sliders, Smartphone, ShieldCheck, Database, Key, ExternalLink,
  Bold, Italic, List, ListOrdered, Heading, Link, Copy, EyeOff, Radio
} from 'lucide-react';

export type StudentSettingsTab = 'general' | 'reports' | 'terms' | 'support' | 'payments';

export interface PhoneContact {
  id: string;
  number: string;
  label: string;
  isPrimary: boolean;
}

export interface EmailContact {
  id: string;
  email: string;
  label: string;
  isPrimary: boolean;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  isTestMode: boolean;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  icon: string;
  category: 'gateway' | 'upi' | 'card' | 'offline';
}

export interface TermsVersion {
  id: string;
  version: string;
  updatedAt: string;
  updatedBy: string;
  content: string;
  status: 'Published' | 'Draft';
}

export const StudentSettingsView: React.FC<{
  initialTab?: StudentSettingsTab;
  onTabChange?: (tab: StudentSettingsTab) => void;
}> = ({ initialTab = 'general', onTabChange }) => {
  const [activeTab, setActiveTab] = useState<StudentSettingsTab>(initialTab);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabSwitch = (tab: StudentSettingsTab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ==========================================
  // SECTION 1: GENERAL & FEATURE CONTROLS STATE
  // ==========================================
  const [generalSettings, setGeneralSettings] = useState(() => {
    const saved = localStorage.getItem('ttm_student_general_settings');
    return saved ? JSON.parse(saved) : {
      // General
      enableRegistration: true,
      requireEmailVerification: true,
      requireMobileVerification: true,
      allowProfileEditing: true,
      allowProfilePictureUpload: true,
      // Ordering
      allowStudentOrdering: true,
      maxOrdersPerDay: 5,
      maxQuantityPerOrder: 10,
      enablePreOrder: true,
      enableOrderCancellation: true,
      cancellationTimeLimit: 5, // minutes
      // Payments
      enableOnlinePayments: true,
      enableCashPayments: true,
      enableWalletFuture: false,
      defaultPaymentMethod: 'UPI QR',
      // Notifications
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      orderUpdates: true,
      // Security
      passwordPolicy: 'Strong (Min 8 chars, 1 Special, 1 Number)',
      sessionTimeout: 30, // minutes
      twoFactorAuthFuture: false,
      loginActivityLogging: true,
      // Privacy
      cookiePolicyEnabled: true,
      dataRetentionDays: 365,
      privacyPolicyText: 'We protect your campus food ordering privacy and data securely.'
    };
  });

  useEffect(() => {
    localStorage.setItem('ttm_student_general_settings', JSON.stringify(generalSettings));
  }, [generalSettings]);

  // ==========================================
  // SECTION 2: REPORTS & ANALYTICS STATE
  // ==========================================
  const [reportType, setReportType] = useState<string>('all');
  const [reportDateRange, setReportDateRange] = useState<'today' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [reportSearch, setReportSearch] = useState<string>('');
  const [reportDepartment, setReportDepartment] = useState<string>('All');
  const [reportYear, setReportYear] = useState<string>('All');

  const mockReportItems = useMemo(() => [
    { id: 'REP-101', type: 'Student Registration', studentName: 'Aarav Sharma', rollNo: '2024PSG101', department: 'Computer Science', year: '3rd Year', date: '2026-08-01', amount: '₹0', status: 'Verified', ordersCount: 14 },
    { id: 'REP-102', type: 'Order History', studentName: 'Priya Sundaram', rollNo: '2024CIT205', department: 'Electrical Eng', year: '2nd Year', date: '2026-08-02', amount: '₹240', status: 'Completed', ordersCount: 22 },
    { id: 'REP-103', type: 'Payment History', studentName: 'Rohan Gupta', rollNo: '2024GAC88', department: 'Mechanical Eng', year: '4th Year', date: '2026-08-02', amount: '₹180', status: 'Paid via Cashfree', ordersCount: 31 },
    { id: 'REP-104', type: 'Student Login', studentName: 'Kavya Reddy', rollNo: '2024SKC12', department: 'Civil Eng', year: '1st Year', date: '2026-08-03', amount: '₹0', status: 'Login Success', ordersCount: 9 },
    { id: 'REP-105', type: 'Top Ordering', studentName: 'Vikram Singh', rollNo: '2024PSG309', department: 'Computer Science', year: '4th Year', date: '2026-08-03', amount: '₹4,850', status: 'Top Diner #1', ordersCount: 48 },
    { id: 'REP-106', type: 'Student Activity', studentName: 'Sneha Patel', rollNo: '2024CIT114', department: 'Information Tech', year: '3rd Year', date: '2026-08-03', amount: '₹320', status: 'Active Session', ordersCount: 18 }
  ], []);

  const filteredReports = useMemo(() => {
    return mockReportItems.filter(item => {
      const matchSearch = item.studentName.toLowerCase().includes(reportSearch.toLowerCase()) || 
                          item.rollNo.toLowerCase().includes(reportSearch.toLowerCase()) ||
                          item.id.toLowerCase().includes(reportSearch.toLowerCase());
      const matchDept = reportDepartment === 'All' || item.department === reportDepartment;
      const matchYear = reportYear === 'All' || item.year === reportYear;
      return matchSearch && matchDept && matchYear;
    });
  }, [mockReportItems, reportSearch, reportDepartment, reportYear]);

  const handleExportCSV = () => {
    const headers = ['Report ID,Type,Student Name,Roll No,Department,Year,Date,Amount,Status,Orders Count\n'];
    const rows = filteredReports.map(r => `${r.id},${r.type},"${r.studentName}",${r.rollNo},"${r.department}",${r.year},${r.date},${r.amount},"${r.status}",${r.ordersCount}`);
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Report exported as CSV successfully!');
  };

  const handlePrintReport = () => {
    window.print();
  };

  // ==========================================
  // SECTION 3: TERMS & CONDITIONS EDITOR STATE
  // ==========================================
  const [termsContent, setTermsContent] = useState<string>(() => {
    return localStorage.getItem('ttm_terms_content') || `
# Time-To-Meal Terms & Conditions for Students

Welcome to Time-To-Meal! By registering and using our campus food ordering platform, you agree to comply with the following terms:

### 1. Account Eligibility & Verification
- Students must register using valid college roll numbers and institutional email addresses.
- Account credentials must be kept confidential.

### 2. Orders & Pre-Ordering
- Food orders placed via the platform are transmitted directly to the respective campus canteen.
- Orders must be collected within the estimated pick-up timeframe.

### 3. Payment & Cancellations
- Online payments via UPI, Cards, and Netbanking are processed securely.
- Order cancellation is permitted within 5 minutes of order placement if the canteen has not started food preparation.

### 4. Code of Conduct
- Any misuse of platform features, fake orders, or abuse of canteen staff will result in immediate suspension of ordering privileges.
    `.trim();
  });

  const [termsStatus, setTermsStatus] = useState<'Published' | 'Draft'>('Published');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>('2026-08-03 10:15 AM');
  
  const [versionHistory, setVersionHistory] = useState<TermsVersion[]>(() => {
    const saved = localStorage.getItem('ttm_terms_history');
    return saved ? JSON.parse(saved) : [
      { id: 'v-1.2', version: 'v1.2', updatedAt: '2026-08-03 10:15 AM', updatedBy: 'Super Admin', status: 'Published', content: termsContent },
      { id: 'v-1.1', version: 'v1.1', updatedAt: '2026-07-15 02:30 PM', updatedBy: 'Super Admin', status: 'Draft', content: 'Earlier draft of terms...' }
    ];
  });

  const handleSaveTerms = (status: 'Published' | 'Draft') => {
    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setTermsStatus(status);
    setLastUpdatedDate(nowStr);
    localStorage.setItem('ttm_terms_content', termsContent);

    const newVer: TermsVersion = {
      id: `v-${Date.now()}`,
      version: `v1.${versionHistory.length + 1}`,
      updatedAt: nowStr,
      updatedBy: 'Super Admin',
      status: status,
      content: termsContent
    };
    const updatedHistory = [newVer, ...versionHistory];
    setVersionHistory(updatedHistory);
    localStorage.setItem('ttm_terms_history', JSON.stringify(updatedHistory));
    showToast(`Terms & Conditions saved as ${status}!`);
  };

  // Simple rich-text formatting helper
  const insertFormatting = (prefix: string, suffix: string = '') => {
    setTermsContent(prev => prev + `${prefix}Selected Text${suffix}`);
  };

  // ==========================================
  // SECTION 4: HELP & SUPPORT MANAGEMENT STATE
  // ==========================================
  const [phoneList, setPhoneList] = useState<PhoneContact[]>(() => {
    const saved = localStorage.getItem('ttm_support_phones');
    return saved ? JSON.parse(saved) : [
      { id: 'p-1', number: '+91 98765 43210', label: 'Main Campus Toll-Free', isPrimary: true },
      { id: 'p-2', number: '+91 98123 45678', label: 'Canteen Support Line', isPrimary: false }
    ];
  });

  const [emailList, setEmailList] = useState<EmailContact[]>(() => {
    const saved = localStorage.getItem('ttm_support_emails');
    return saved ? JSON.parse(saved) : [
      { id: 'e-1', email: 'support@timetomeal.in', label: 'Primary Helpdesk', isPrimary: true },
      { id: 'e-2', email: 'grievance@timetomeal.in', label: 'Student Grievances', isPrimary: false }
    ];
  });

  const [supportInfo, setSupportInfo] = useState(() => {
    const saved = localStorage.getItem('ttm_support_info');
    return saved ? JSON.parse(saved) : {
      officeAddress: 'Central Tech Block, Room 402, Campus Administrative Tower, Tamil Nadu 641004',
      workingHours: 'Monday - Saturday: 08:00 AM - 10:00 PM',
      websiteUrl: 'https://timetomeal.in',
      whatsappNumber: '+91 98765 43210',
      supportDescription: 'Official student helpdesk for Time-To-Meal food ordering, refunds, pick-up inquiries, and canteen feedback.'
    };
  });

  useEffect(() => {
    localStorage.setItem('ttm_support_phones', JSON.stringify(phoneList));
  }, [phoneList]);

  useEffect(() => {
    localStorage.setItem('ttm_support_emails', JSON.stringify(emailList));
  }, [emailList]);

  useEffect(() => {
    localStorage.setItem('ttm_support_info', JSON.stringify(supportInfo));
  }, [supportInfo]);

  // Phone CRUD
  const [newPhoneNum, setNewPhoneNum] = useState('');
  const [newPhoneLabel, setNewPhoneLabel] = useState('');
  const handleAddPhone = () => {
    if (!newPhoneNum) return;
    const newP: PhoneContact = {
      id: `p-${Date.now()}`,
      number: newPhoneNum,
      label: newPhoneLabel || 'Support Line',
      isPrimary: phoneList.length === 0
    };
    setPhoneList([...phoneList, newP]);
    setNewPhoneNum('');
    setNewPhoneLabel('');
    showToast('Phone number added');
  };
  const handleSetPrimaryPhone = (id: string) => {
    setPhoneList(phoneList.map(p => ({ ...p, isPrimary: p.id === id })));
    showToast('Primary contact phone updated');
  };
  const handleDeletePhone = (id: string) => {
    setPhoneList(phoneList.filter(p => p.id !== id));
    showToast('Phone contact removed');
  };

  // Email CRUD
  const [newEmailAddr, setNewEmailAddr] = useState('');
  const [newEmailLabel, setNewEmailLabel] = useState('');
  const handleAddEmail = () => {
    if (!newEmailAddr) return;
    const newE: EmailContact = {
      id: `e-${Date.now()}`,
      email: newEmailAddr,
      label: newEmailLabel || 'Support Desk',
      isPrimary: emailList.length === 0
    };
    setEmailList([...emailList, newE]);
    setNewEmailAddr('');
    setNewEmailLabel('');
    showToast('Email address added');
  };
  const handleSetPrimaryEmail = (id: string) => {
    setEmailList(emailList.map(e => ({ ...e, isPrimary: e.id === id })));
    showToast('Primary support email updated');
  };
  const handleDeleteEmail = (id: string) => {
    setEmailList(emailList.filter(e => e.id !== id));
    showToast('Email contact removed');
  };

  // ==========================================
  // SECTION 5: PAYMENT METHODS & GATEWAYS STATE
  // ==========================================
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>(() => {
    const saved = localStorage.getItem('ttm_payment_gateways');
    return saved ? JSON.parse(saved) : [
      { id: 'gate-1', name: 'Cashfree', displayName: 'Cashfree Payments', enabled: true, isTestMode: true, apiKey: 'TEST1115864987dc532ebfcdde0745ef94685111', apiSecret: 'TvYRWi6_uF8azvYG0V_SBJAJgjE', webhookUrl: 'https://api.timetomeal.in/v1/webhooks/cashfree', icon: 'CreditCard', category: 'gateway' },
      { id: 'gate-3', name: 'PhonePe', displayName: 'PhonePe Direct Gateway', enabled: true, isTestMode: false, apiKey: 'M23061093593_TEST', apiSecret: '839210-phonepe-secret-key', webhookUrl: 'https://api.timetomeal.in/v1/webhooks/phonepe', icon: 'Smartphone', category: 'gateway' },
      { id: 'gate-4', name: 'UPI QR', displayName: 'Dynamic UPI QR Code', enabled: true, isTestMode: false, apiKey: 'ttmeal@upi', apiSecret: 'UPI Merchant VPA', webhookUrl: 'https://api.timetomeal.in/v1/webhooks/upi', icon: 'Radio', category: 'upi' },
      { id: 'gate-5', name: 'Google Pay', displayName: 'Google Pay Direct', enabled: true, isTestMode: false, apiKey: 'gpay-merchant-1092', apiSecret: 'gpay-sec-token', webhookUrl: 'https://api.timetomeal.in/v1/webhooks/gpay', icon: 'Smartphone', category: 'upi' },
      { id: 'gate-6', name: 'Paytm', displayName: 'Paytm Wallet & UPI', enabled: true, isTestMode: true, apiKey: 'PAYTM_MID_901823', apiSecret: 'paytm-secret-key', webhookUrl: 'https://api.timetomeal.in/v1/webhooks/paytm', icon: 'Smartphone', category: 'gateway' },
      { id: 'gate-7', name: 'Credit Card', displayName: 'Credit Card (Visa/Master)', enabled: true, isTestMode: false, apiKey: 'card-tokenization-enabled', apiSecret: '3ds-2.0-key', webhookUrl: '', icon: 'CreditCard', category: 'card' },
      { id: 'gate-8', name: 'Debit Card', displayName: 'Debit Card Instant Pay', enabled: true, isTestMode: false, apiKey: 'debit-tokenization-enabled', apiSecret: 'debit-sec-key', webhookUrl: '', icon: 'CreditCard', category: 'card' },
      { id: 'gate-9', name: 'Net Banking', displayName: 'Net Banking (SBI, HDFC, ICICI)', enabled: true, isTestMode: false, apiKey: 'nb-aggregator-v2', apiSecret: 'nb-sec-key', webhookUrl: '', icon: 'Globe', category: 'gateway' },
      { id: 'gate-10', name: 'Cash', displayName: 'Pay Cash at Canteen Counter', enabled: true, isTestMode: false, apiKey: 'OFFLINE_CASH', apiSecret: 'COUNTER_VERIFIED', webhookUrl: '', icon: 'Radio', category: 'offline' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ttm_payment_gateways', JSON.stringify(paymentGateways));
  }, [paymentGateways]);

  const toggleGatewayEnabled = (id: string) => {
    setPaymentGateways(paymentGateways.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
    showToast('Payment gateway status toggled');
  };

  const toggleGatewayTestMode = (id: string) => {
    setPaymentGateways(paymentGateways.map(g => g.id === id ? { ...g, isTestMode: !g.isTestMode } : g));
    showToast('Gateway mode toggled (Test/Live)');
  };

  const updateGatewayField = (id: string, field: keyof PaymentGatewayConfig, value: any) => {
    setPaymentGateways(paymentGateways.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-4 right-6 z-[9999] bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 animate-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-emerald-400 dark:text-slate-950 animate-spin" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">Student Settings Administration</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure student features, generate reports, manage support contacts, and control payment gateways.</p>
        </div>

        {/* Sub-Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          {[
            { id: 'general', label: 'General & Controls', icon: Sliders },
            { id: 'reports', label: 'Reports Hub', icon: FileText },
            { id: 'terms', label: 'Terms & Conditions', icon: ShieldCheck },
            { id: 'support', label: 'Help & Support', icon: HelpCircle },
            { id: 'payments', label: 'Payment Methods', icon: CreditCard },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id as StudentSettingsTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="w-full flex-1 p-6 space-y-6">

        {/* ==========================================
            SUB-TAB 1: GENERAL & CONTROLS
           ========================================== */}
        {activeTab === 'general' && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Student Operational Rules & Controls</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure global student ordering rules, security parameters, and privacy policies.</p>
              </div>
              <button
                onClick={() => showToast('Student general settings saved successfully!')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {/* Card 1: General Options */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <UserCheck className="w-4 h-4" /> General Student Access
                </div>
                <div className="space-y-3 text-xs font-semibold">
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Enable Student Registration</span>
                    <input type="checkbox" checked={generalSettings.enableRegistration} onChange={e => setGeneralSettings({ ...generalSettings, enableRegistration: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Require Email Verification</span>
                    <input type="checkbox" checked={generalSettings.requireEmailVerification} onChange={e => setGeneralSettings({ ...generalSettings, requireEmailVerification: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Require Mobile SMS OTP</span>
                    <input type="checkbox" checked={generalSettings.requireMobileVerification} onChange={e => setGeneralSettings({ ...generalSettings, requireMobileVerification: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Allow Profile Details Editing</span>
                    <input type="checkbox" checked={generalSettings.allowProfileEditing} onChange={e => setGeneralSettings({ ...generalSettings, allowProfileEditing: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Allow Profile Picture Upload</span>
                    <input type="checkbox" checked={generalSettings.allowProfilePictureUpload} onChange={e => setGeneralSettings({ ...generalSettings, allowProfilePictureUpload: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                </div>
              </div>

              {/* Card 2: Ordering Rules */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-blue-600 font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Clock className="w-4 h-4" /> Ordering Parameters
                </div>
                <div className="space-y-3 text-xs font-semibold">
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Allow Student Ordering</span>
                    <input type="checkbox" checked={generalSettings.allowStudentOrdering} onChange={e => setGeneralSettings({ ...generalSettings, allowStudentOrdering: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Max Orders Per Day</label>
                    <input type="number" value={generalSettings.maxOrdersPerDay} onChange={e => setGeneralSettings({ ...generalSettings, maxOrdersPerDay: Number(e.target.value) })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Max Quantity Per Item Order</label>
                    <input type="number" value={generalSettings.maxQuantityPerOrder} onChange={e => setGeneralSettings({ ...generalSettings, maxQuantityPerOrder: Number(e.target.value) })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                  </div>

                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Enable Pre-Order Window</span>
                    <input type="checkbox" checked={generalSettings.enablePreOrder} onChange={e => setGeneralSettings({ ...generalSettings, enablePreOrder: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Enable Order Cancellation</span>
                      <input type="checkbox" checked={generalSettings.enableOrderCancellation} onChange={e => setGeneralSettings({ ...generalSettings, enableOrderCancellation: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                    </div>
                    {generalSettings.enableOrderCancellation && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Cancellation Time Limit (Minutes)</label>
                        <input type="number" value={generalSettings.cancellationTimeLimit} onChange={e => setGeneralSettings({ ...generalSettings, cancellationTimeLimit: Number(e.target.value) })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Payments & Wallet */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-purple-600 font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CreditCard className="w-4 h-4" /> Payment Policies
                </div>
                <div className="space-y-3 text-xs font-semibold">
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Enable Online Gateway Payments</span>
                    <input type="checkbox" checked={generalSettings.enableOnlinePayments} onChange={e => setGeneralSettings({ ...generalSettings, enableOnlinePayments: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Enable Counter Cash Payments</span>
                    <input type="checkbox" checked={generalSettings.enableCashPayments} onChange={e => setGeneralSettings({ ...generalSettings, enableCashPayments: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Enable Student Campus Wallet (Future)</span>
                    <input type="checkbox" checked={generalSettings.enableWalletFuture} onChange={e => setGeneralSettings({ ...generalSettings, enableWalletFuture: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Default Payment Method</label>
                    <select value={generalSettings.defaultPaymentMethod} onChange={e => setGeneralSettings({ ...generalSettings, defaultPaymentMethod: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">
                      <option value="UPI QR">UPI QR Code</option>
                      <option value="Cashfree">Cashfree Gateway</option>
                      <option value="Cash">Cash at Counter</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 4: Notifications */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-amber-600 font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Bell className="w-4 h-4" /> Notification Channels
                </div>
                <div className="space-y-3 text-xs font-semibold">
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Push Notifications</span>
                    <input type="checkbox" checked={generalSettings.pushNotifications} onChange={e => setGeneralSettings({ ...generalSettings, pushNotifications: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Email Order Receipts</span>
                    <input type="checkbox" checked={generalSettings.emailNotifications} onChange={e => setGeneralSettings({ ...generalSettings, emailNotifications: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>SMS Transaction Alerts</span>
                    <input type="checkbox" checked={generalSettings.smsNotifications} onChange={e => setGeneralSettings({ ...generalSettings, smsNotifications: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Live Order Ready Alerts</span>
                    <input type="checkbox" checked={generalSettings.orderUpdates} onChange={e => setGeneralSettings({ ...generalSettings, orderUpdates: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                </div>
              </div>

              {/* Card 5: Security */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Lock className="w-4 h-4" /> Security & Sessions
                </div>
                <div className="space-y-3 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Student Password Policy</label>
                    <select value={generalSettings.passwordPolicy} onChange={e => setGeneralSettings({ ...generalSettings, passwordPolicy: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">
                      <option value="Strong (Min 8 chars, 1 Special, 1 Number)">Strong (Min 8 chars, 1 Special, 1 Number)</option>
                      <option value="Medium (Min 6 chars)">Medium (Min 6 chars)</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Session Inactivity Timeout (Minutes)</label>
                    <input type="number" value={generalSettings.sessionTimeout} onChange={e => setGeneralSettings({ ...generalSettings, sessionTimeout: Number(e.target.value) })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                  </div>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Two-Factor Authentication (2FA Future)</span>
                    <input type="checkbox" checked={generalSettings.twoFactorAuthFuture} onChange={e => setGeneralSettings({ ...generalSettings, twoFactorAuthFuture: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Log Login Activity & IP Audit</span>
                    <input type="checkbox" checked={generalSettings.loginActivityLogging} onChange={e => setGeneralSettings({ ...generalSettings, loginActivityLogging: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                </div>
              </div>

              {/* Card 6: Privacy */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Shield className="w-4 h-4" /> Privacy & Data Retention
                </div>
                <div className="space-y-3 text-xs font-semibold">
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                    <span>Enable Cookie Policy Banner</span>
                    <input type="checkbox" checked={generalSettings.cookiePolicyEnabled} onChange={e => setGeneralSettings({ ...generalSettings, cookiePolicyEnabled: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  </label>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Data Retention Period (Days)</label>
                    <input type="number" value={generalSettings.dataRetentionDays} onChange={e => setGeneralSettings({ ...generalSettings, dataRetentionDays: Number(e.target.value) })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            SUB-TAB 2: REPORTS HUB
           ========================================== */}
        {activeTab === 'reports' && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            {/* Header Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Student Reports & Analytics Center</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generate, search, filter, and export comprehensive student reports.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleExportCSV} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
                </button>
                <button onClick={handleExportCSV} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600" /> Export Excel
                </button>
                <button onClick={() => showToast('PDF Export initiated')} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                  <Download className="w-4 h-4 text-red-600" /> Export PDF
                </button>
                <button onClick={handlePrintReport} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print Report
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-4 text-xs font-bold">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={e => setReportSearch(e.target.value)}
                  placeholder="Search student, roll number..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Department Filter */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase mr-2">Department:</label>
                <select value={reportDepartment} onChange={e => setReportDepartment(e.target.value)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Eng">Electrical Eng</option>
                  <option value="Mechanical Eng">Mechanical Eng</option>
                  <option value="Civil Eng">Civil Eng</option>
                  <option value="Information Tech">Information Tech</option>
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase mr-2">Academic Year:</label>
                <select value={reportYear} onChange={e => setReportYear(e.target.value)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <option value="All">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase mr-2">Time Period:</label>
                <select value={reportDateRange} onChange={e => setReportDateRange(e.target.value as any)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <option value="today">Daily (Today)</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden w-full">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-4">Report ID</th>
                      <th className="px-5 py-4">Report Category</th>
                      <th className="px-5 py-4">Student Name</th>
                      <th className="px-5 py-4">Roll Number</th>
                      <th className="px-5 py-4">Department & Year</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Total Amount</th>
                      <th className="px-5 py-4">Status / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {filteredReports.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-emerald-600">{item.id}</td>
                        <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white">{item.type}</td>
                        <td className="px-5 py-4">{item.studentName}</td>
                        <td className="px-5 py-4 font-mono text-slate-400">{item.rollNo}</td>
                        <td className="px-5 py-4">{item.department} • <span className="text-slate-400">{item.year}</span></td>
                        <td className="px-5 py-4 text-slate-400">{item.date}</td>
                        <td className="px-5 py-4 font-black text-slate-950 dark:text-white">{item.amount}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-extrabold">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            SUB-TAB 3: TERMS & CONDITIONS EDITOR
           ========================================== */}
        {activeTab === 'terms' && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">Student Terms & Conditions Editor</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${termsStatus === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {termsStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last Updated: <span className="font-bold text-slate-800 dark:text-slate-200">{lastUpdatedDate}</span></p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" /> {isPreviewMode ? 'Edit Mode' : 'Live Preview'}
                </button>

                <button
                  onClick={() => handleSaveTerms('Draft')}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-all"
                >
                  Save Draft
                </button>

                <button
                  onClick={() => handleSaveTerms('Published')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Publish Changes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {/* Left Column: Visual / Rich Editor */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                {/* Format Toolbar */}
                {!isPreviewMode && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <button onClick={() => insertFormatting('**', '**')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold" title="Bold">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertFormatting('*', '*')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold" title="Italic">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertFormatting('### ')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold" title="Heading">
                      <Heading className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertFormatting('- ')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold" title="List">
                      <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertFormatting('1. ')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold" title="Numbered List">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isPreviewMode ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-4">
                    <h3 className="text-lg font-black text-emerald-600">Student Terms Preview</h3>
                    <pre className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">{termsContent}</pre>
                  </div>
                ) : (
                  <textarea
                    rows={16}
                    value={termsContent}
                    onChange={e => setTermsContent(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                )}
              </div>

              {/* Right Column: Version History */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-black text-sm text-slate-950 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" /> Version Audit History
                </h3>
                <div className="space-y-3">
                  {versionHistory.map(ver => (
                    <div key={ver.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-900 dark:text-white">{ver.version}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ver.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {ver.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{ver.updatedAt} • {ver.updatedBy}</p>
                      <button onClick={() => setTermsContent(ver.content)} className="text-[10px] text-emerald-600 font-bold hover:underline pt-1">
                        Restore this version →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            SUB-TAB 4: HELP & SUPPORT MANAGEMENT
           ========================================== */}
        {activeTab === 'support' && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Help & Support Desk Management</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage contact numbers, emails, office hours, and support info for students.</p>
              </div>
              <button
                onClick={() => showToast('Help & Support info saved successfully!')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Support Info
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {/* Phone Contacts */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-black text-sm text-slate-950 dark:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" /> Phone Contacts
                  </h3>
                </div>

                <div className="space-y-3">
                  {phoneList.map(p => (
                    <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          {p.number}
                          {p.isPrimary && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black">PRIMARY</span>}
                        </p>
                        <p className="text-[10px] text-slate-400">{p.label}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!p.isPrimary && (
                          <button onClick={() => handleSetPrimaryPhone(p.id)} className="p-1.5 text-slate-400 hover:text-emerald-600" title="Set Primary">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDeletePhone(p.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Phone Form */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <input type="text" value={newPhoneNum} onChange={e => setNewPhoneNum(e.target.value)} placeholder="+91 98765 00000" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold" />
                  <input type="text" value={newPhoneLabel} onChange={e => setNewPhoneLabel(e.target.value)} placeholder="Label (e.g. Toll Free)" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold" />
                  <button onClick={handleAddPhone} className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Phone Contact
                  </button>
                </div>
              </div>

              {/* Email Contacts */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-black text-sm text-slate-950 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" /> Support Emails
                  </h3>
                </div>

                <div className="space-y-3">
                  {emailList.map(e => (
                    <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          {e.email}
                          {e.isPrimary && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-black">PRIMARY</span>}
                        </p>
                        <p className="text-[10px] text-slate-400">{e.label}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!e.isPrimary && (
                          <button onClick={() => handleSetPrimaryEmail(e.id)} className="p-1.5 text-slate-400 hover:text-blue-600" title="Set Primary">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteEmail(e.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Email Form */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <input type="email" value={newEmailAddr} onChange={e => setNewEmailAddr(e.target.value)} placeholder="help@timetomeal.in" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold" />
                  <input type="text" value={newEmailLabel} onChange={e => setNewEmailLabel(e.target.value)} placeholder="Label (e.g. Refund Desk)" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold" />
                  <button onClick={handleAddEmail} className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Email Contact
                  </button>
                </div>
              </div>

              {/* Operational & Address Fields */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-black text-sm text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <MapPin className="w-4 h-4 text-purple-600" /> Operational Information
                </h3>
                <div className="space-y-3 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Campus Office Address</label>
                    <textarea rows={2} value={supportInfo.officeAddress} onChange={e => setSupportInfo({ ...supportInfo, officeAddress: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Working Hours</label>
                    <input type="text" value={supportInfo.workingHours} onChange={e => setSupportInfo({ ...supportInfo, workingHours: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Website URL</label>
                    <input type="text" value={supportInfo.websiteUrl} onChange={e => setSupportInfo({ ...supportInfo, websiteUrl: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">WhatsApp Support Number</label>
                    <input type="text" value={supportInfo.whatsappNumber} onChange={e => setSupportInfo({ ...supportInfo, whatsappNumber: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            SUB-TAB 5: PAYMENT METHODS & GATEWAYS
           ========================================== */}
        {activeTab === 'payments' && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Payment Gateways & Methods Setup</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure online payment gateways, API keys, webhooks, and counter cash options.</p>
              </div>
              <button
                onClick={() => showToast('Payment methods configuration saved!')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Gateways Setup
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {paymentGateways.map(gate => (
                <div key={gate.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 bg-slate-100 dark:bg-slate-800 text-emerald-600 rounded-xl font-bold">
                        <CreditCard className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="font-black text-sm text-slate-950 dark:text-white">{gate.displayName}</h3>
                        <p className="text-[10px] text-slate-400 font-mono">{gate.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${gate.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {gate.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-3 text-xs font-semibold">
                    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                      <span>Enable Payment Method</span>
                      <input type="checkbox" checked={gate.enabled} onChange={() => toggleGatewayEnabled(gate.id)} className="w-4 h-4 accent-emerald-600" />
                    </label>

                    {gate.category !== 'offline' && (
                      <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                        <span>Environment Mode</span>
                        <button
                          type="button"
                          onClick={() => toggleGatewayTestMode(gate.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${gate.isTestMode ? 'bg-amber-100 text-amber-900' : 'bg-emerald-600 text-white'}`}
                        >
                          {gate.isTestMode ? 'SANDBOX / TEST' : 'PRODUCTION / LIVE'}
                        </button>
                      </label>
                    )}

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Display Label</label>
                      <input type="text" value={gate.displayName} onChange={e => updateGatewayField(gate.id, 'displayName', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                    </div>

                    {gate.category !== 'offline' && (
                      <>
                        <div>
                          <label className="block text-slate-500 font-bold mb-1">API Key / Merchant ID</label>
                          <input type="text" value={gate.apiKey} onChange={e => updateGatewayField(gate.id, 'apiKey', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px]" />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1">API Secret Key</label>
                          <input type="password" value={gate.apiSecret} onChange={e => updateGatewayField(gate.id, 'apiSecret', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px]" />
                        </div>

                        {gate.webhookUrl && (
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Webhook Endpoint URL</label>
                            <input type="text" value={gate.webhookUrl} onChange={e => updateGatewayField(gate.id, 'webhookUrl', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[10px]" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default StudentSettingsView;
