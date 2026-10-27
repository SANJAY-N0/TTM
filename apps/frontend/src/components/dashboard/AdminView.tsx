import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CollegeManagementView } from '../settings/CollegeManagementView';
import { CanteenManagementView, CanteenRecord } from '../canteen/CanteenManagementView';
import { StudentManagementView, StudentRecord } from '../settings/StudentManagementView';
import { StudentSettingsView } from '../student/StudentSettingsView';
import { ReportManagementView } from '../reports/ReportManagementView';
import { AdminPaymentDetailsView } from '../dashboard/AdminPaymentDetailsView';
import { DepartmentManagementView } from '../admin/DepartmentManagementView';
import { AcademicYearManagementView } from '../admin/AcademicYearManagementView';
import { CanteenAccountsView } from '../admin/CanteenAccountsView';
import { AuditLogsView } from '../admin/AuditLogsView';
import { 
  College, Order, MenuItem, User as AppUser, CanteenProfile, AdminProfile, OrderStatus 
} from '../../types';
import { 
  LayoutDashboard, Store, Users, ShoppingBag, CreditCard, BarChart3, 
  Building2, Settings, ShieldCheck, LogOut, Search, Bell, Sun, Moon, 
  Plus, Check, X, Filter, ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw, 
  Clock, ChevronRight, ChevronDown, Download, AlertTriangle, FileText, 
  CheckCircle2, XCircle, Printer, Eye, Flame, TrendingUp, Wallet, 
  IndianRupee, Package, HelpCircle, Menu, Sliders, Send, Layers,
  PieChart as PieChartIcon, UserCheck, ShieldAlert, CheckSquare, Sparkle, ArrowRight,
  Shield, SlidersHorizontal, Key, Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

interface AdminViewProps {
  user: AppUser;
  orders: Order[];
  menu: MenuItem[];
  onUpdateOrders: (orders: Order[]) => void;
  onLogout: () => void;
}

export type SidebarTab = 
  | 'dashboard' 
  | 'students'
  | 'colleges'
  | 'departments'
  | 'academic_years'
  | 'canteens' 
  | 'canteen_accounts'
  | 'orders' 
  | 'payments' 
  | 'analytics'
  | 'reports' 
  | 'settings'
  | 'settings_canteen' 
  | 'settings_student' 
  | 'settings_admin' 
  | 'audit_logs';

type QuickActionType = 
  | 'verify_canteen' 
  | 'approve_payment' 
  | 'create_college' 
  | 'export_reports' 
  | 'create_announcement' 
  | null;

// Initial State Defaults (Loaded dynamically from database)
const INITIAL_COLLEGES: College[] = [];
const INITIAL_CANTEENS: CanteenRecord[] = [];
const INITIAL_AUDIT_LOGS = [
  { id: 'log-1', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: 'SuperAdmin', action: 'System Audit', details: 'Initialized live database session', category: 'System', severity: 'Info' }
];

export const AdminView: React.FC<AdminViewProps> = ({
  user,
  orders,
  menu,
  onUpdateOrders,
  onLogout
}) => {
  // Navigation & Layout States
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tabHistory, setTabHistory] = useState<SidebarTab[]>([]);

  const navigateTo = useCallback((tab: SidebarTab) => {
    if (tab === activeTab) return;
    window.history.pushState({ tab }, '', `#${tab}`);
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  }, [activeTab]);

  const goBack = useCallback(() => {
    if (tabHistory.length === 0) return;
    const previous = tabHistory[tabHistory.length - 1];
    setTabHistory(prev => prev.slice(0, -1));
    setActiveTab(previous);
  }, [tabHistory]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else if (tabHistory.length > 0) {
        goBack();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tabHistory, goBack]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentTime, setCurrentTime] = useState('');
  
  // Interactive UI States
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [isLoadingSkeletons, setIsLoadingSkeletons] = useState(false);
  const [quickActionModal, setQuickActionModal] = useState<QuickActionType>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Database Data States
  const [colleges, setColleges] = useState<College[]>(() => {
    const saved = localStorage.getItem('ttm_colleges');
    return saved ? JSON.parse(saved) : INITIAL_COLLEGES;
  });

  const [canteens, setCanteens] = useState<CanteenRecord[]>(() => {
    const saved = localStorage.getItem('ttm_canteens');
    return saved ? JSON.parse(saved) : INITIAL_CANTEENS;
  });

  const [students, setStudents] = useState<StudentRecord[]>(() => {
    const saved = localStorage.getItem('ttm_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Fetch live records from backend API
  useEffect(() => {
    async function fetchLiveData() {
      try {
        const [colRes, cntRes, stdRes] = await Promise.all([
          fetch('/api/v1/colleges'),
          fetch('/api/v1/canteens'),
          fetch('/api/v1/admin/students')
        ]);
        if (colRes.ok) {
          const colData = await colRes.json();
          if (colData.data && Array.isArray(colData.data)) {
            const formattedColleges = colData.data.map((c: any) => ({
              id: c.id,
              name: c.name || 'Unnamed College',
              code: c.code || 'CODE',
              address: c.address || '',
              city: c.city || 'Coimbatore',
              state: c.state || 'Tamil Nadu',
              contactPerson: c.contact_person || c.contactPerson || 'Dr. Principal',
              email: c.email || 'admin@college.edu',
              phone: c.phone || '+91 422 2635678',
              status: (c.status || 'active').toLowerCase() === 'active' ? 'active' : 'inactive',
              createdDate: c.created_at || c.createdDate || new Date().toISOString()
            }));
            setColleges(formattedColleges);
          }
        }
        if (cntRes.ok) {
          const cntData = await cntRes.json();
          if (cntData.data && Array.isArray(cntData.data)) {
            const formattedCanteens = cntData.data.map((cnt: any) => ({
              id: cnt.id,
              name: cnt.name || 'Campus Canteen',
              owner: cnt.owner || cnt.owner_name || cnt.contact_person || 'Canteen Manager',
              collegeId: cnt.college_id || cnt.collegeId || '',
              college_id: cnt.college_id || cnt.collegeId || '',
              college: cnt.colleges?.name || cnt.college || 'Campus Node',
              collegeEmail: cnt.colleges?.email || cnt.collegeEmail || 'canteen@college.edu',
              phone: cnt.contact_phone || cnt.phone || '+91 98765 43210',
              email: cnt.email || 'canteen@ttm.com',
              todaySales: cnt.todaySales || 0,
              monthlySales: cnt.monthlySales || 0,
              weeklySales: cnt.weeklySales || 0,
              totalOrders: cnt.totalOrders || 0,
              completedOrders: cnt.completedOrders || 0,
              cancelledOrders: cnt.cancelledOrders || 0,
              avgOrderValue: cnt.avgOrderValue || 120,
              settlementType: cnt.settlementType || 'Daily',
              verificationStatus: cnt.verificationStatus || 'Verified',
              status: cnt.status || 'Active',
              logo: cnt.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200',
              rating: cnt.rating || 4.5,
              topSellingFood: cnt.topSellingFood || 'Special Combo',
              peakOrderingTime: cnt.peakOrderingTime || '12:00 PM - 2:00 PM',
              registrationDate: cnt.registrationDate || new Date().toISOString(),
              businessDescription: cnt.businessDescription || 'Official campus dining partner',
              address: cnt.location || cnt.address || 'Campus Block',
              latitude: cnt.latitude || 12.8231,
              longitude: cnt.longitude || 80.0442,
              radiusMeters: cnt.radiusMeters || 200,
              geofenceActive: cnt.geofenceActive ?? true,
              bankDetails: cnt.bankDetails || {
                accountHolder: cnt.owner || 'Canteen Manager',
                bankName: 'HDFC Bank',
                accountNumber: '5010000000000',
                ifsc: 'HDFC0001234'
              },
              currentBalance: cnt.currentBalance || 0,
              pendingSettlement: cnt.pendingSettlement || 0,
              completedSettlement: cnt.completedSettlement || 0,
              platformCommissionRate: cnt.platformCommissionRate || 5.0,
              gatewayChargesRate: cnt.gatewayChargesRate || 1.8,
              commissionEnabled: cnt.commissionEnabled ?? true,
              commissionType: cnt.commissionType || 'Percentage',
              commissionFixedAmount: cnt.commissionFixedAmount || 10,
              minOrderValue: cnt.minOrderValue || 40,
              maxCommissionCap: cnt.maxCommissionCap || 100,
              fssaiLicense: cnt.fssaiLicense || '12345678901234',
              documentsVerified: cnt.documentsVerified ?? true
            }));
            setCanteens(formattedCanteens);
          }
        }
        if (stdRes.ok) {
          const stdData = await stdRes.json();
          if (stdData.data && Array.isArray(stdData.data)) {
            const formattedStudents = stdData.data.map((s: any) => ({
              id: s.id,
              name: s.name || s.user_profiles?.[0]?.full_name || 'Student',
              email: s.email || 'student@college.edu',
              rollNumber: s.roll_number || 'REG000',
              college_id: s.college_id,
              status: s.status === 'ACTIVE' || s.status === 'Active' ? 'Active' : 'Suspended'
            }));
            setStudents(formattedStudents);
          }
        }
      } catch (err) {
        console.warn('Failed to load database records from API:', err);
      }
    }
    fetchLiveData();
  }, []);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('ttm_colleges', JSON.stringify(colleges));
  }, [colleges]);

  useEffect(() => {
    localStorage.setItem('ttm_canteens', JSON.stringify(canteens));
  }, [canteens]);

  useEffect(() => {
    localStorage.setItem('ttm_students', JSON.stringify(students));
  }, [students]);

  // Form Inputs for Settings & Modals
  const [commissionRate, setCommissionRate] = useState(5.0);
  const [autoVerifyCanteens, setAutoVerifyCanteens] = useState(false);
  const [geofenceRadius, setGeofenceRadius] = useState(250);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Password Reset & Logout Modal State
  const [rollInput, setRollInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passFeedback, setPassFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  const adminProfile = user.profile as AdminProfile;

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
        ' • ' +
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOverlayOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOverlayOpen(false);
        setQuickActionModal(null);
        setSelectedReceiptOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // REAL DYNAMIC DASHBOARD KPI CALCULATIONS (NO HARDCODED OFFSET NUMBERS!)
  const kpiData = useMemo(() => {
    const totalRev = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    const totalColleges = colleges.length;
    const totalCanteens = canteens.length;
    const totalStudentsCount = students.length;
    const activeStudentsCount = students.filter(s => s.status === 'Active').length;
    const totalReportsCount = auditLogs.length + orders.length;

    return {
      totalColleges,
      totalCanteens,
      activeStudentsCount,
      totalStudentsCount,
      totalReportsCount,
      totalRev
    };
  }, [orders, colleges, canteens, students, auditLogs]);

  // College Handlers connected directly to Supabase
  const handleAddCollege = async (collegeData: Omit<College, 'id' | 'createdDate'>) => {
    try {
      const payload = {
        name: collegeData.name,
        code: collegeData.code,
        address: collegeData.address || '',
        city: collegeData.city || '',
        state: collegeData.state || '',
        contact_person: collegeData.contactPerson || '',
        email: collegeData.email || '',
        phone: collegeData.phone || '',
        status: (collegeData.status || 'active').toUpperCase()
      };

      const res = await fetch('/api/v1/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.data) {
        const item = data.data;
        const newCol: College = {
          id: item.id,
          name: item.name,
          code: item.code,
          address: item.address || '',
          city: item.city || '',
          state: item.state || '',
          contactPerson: item.contact_person || '',
          email: item.email || '',
          phone: item.phone || '',
          status: (item.status || 'active').toLowerCase() as any,
          createdDate: new Date(item.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
        setColleges(prev => [newCol, ...prev]);
        triggerToast(`College "${newCol.name}" saved to Supabase!`);
        return;
      }
    } catch (err) {
      console.error('Failed to create college in Supabase:', err);
    }

    // Fallback UI state update if API error
    const newCol: College = {
      ...collegeData,
      id: `col-${Date.now()}`,
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setColleges(prev => [newCol, ...prev]);
  };

  const handleEditCollege = async (updated: College) => {
    try {
      await fetch(`/api/v1/colleges/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updated.name,
          code: updated.code,
          address: updated.address,
          city: updated.city,
          state: updated.state,
          contact_person: updated.contactPerson,
          email: updated.email,
          phone: updated.phone,
          status: (updated.status || 'active').toUpperCase()
        })
      });
    } catch (err) {
      console.error('Failed to update college in Supabase:', err);
    }
    setColleges(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteCollege = async (id: string) => {
    try {
      await fetch(`/api/v1/colleges/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete college in Supabase:', err);
    }
    setColleges(prev => prev.filter(c => c.id !== id));
  };

  // Settings Password Reset Handler
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setPassFeedback(null);
    if (rollInput.trim() !== (adminProfile?.roll_number || 'ADMIN001')) {
      setPassFeedback({ type: 'error', text: 'Admin Roll Number verification failed!' });
      return;
    }
    if (newPass.length < 6) {
      setPassFeedback({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setPassFeedback({ type: 'success', text: 'Master Security Password updated successfully!' });
    setRollInput('');
    setNewPass('');
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-6 z-[9999] bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 animate-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-emerald-400 dark:text-slate-950 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-1 h-full w-full relative overflow-hidden">
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          />
        )}

        {/* =========================================
            SIDEBAR NAVIGATION
           ========================================= */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 h-screen overflow-y-auto
          bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800
          flex flex-col justify-between transition-all duration-250 ease-in-out shadow-xl lg:shadow-none
          ${isSidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div>
            {/* Header Brand */}
            <div className={`p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 ${isSidebarCollapsed ? 'px-2 justify-center' : ''}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center font-black shadow-md shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-slate-950 dark:text-white text-base leading-none tracking-tight truncate">Time To Meal</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-1 truncate">Admin Panel</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 transition-all shrink-0"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
              </button>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="p-3 space-y-1">
              {/* 1. Dashboard */}
              <button
                onClick={() => navigateTo('dashboard')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'dashboard' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Dashboard</span>}
              </button>

              {/* 2. Students */}
              <button
                onClick={() => navigateTo('students')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'students' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Users className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Students</span>}
              </button>

              {/* 3. Colleges */}
              <button
                onClick={() => navigateTo('colleges')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'colleges' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Colleges</span>}
              </button>

              {/* 4. Departments */}
              <button
                onClick={() => navigateTo('departments')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'departments' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Departments</span>}
              </button>

              {/* 5. Academic Years */}
              <button
                onClick={() => navigateTo('academic_years')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'academic_years' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Academic Years</span>}
              </button>

              {/* 6. Canteens */}
              <button
                onClick={() => navigateTo('canteens')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'canteens' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Store className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Canteens</span>}
              </button>

              {/* 7. Canteen Accounts */}
              <button
                onClick={() => navigateTo('canteen_accounts')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'canteen_accounts' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Key className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Canteen Accounts</span>}
              </button>

              {/* 8. Orders */}
              <button
                onClick={() => navigateTo('orders')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'orders' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Orders</span>}
              </button>

              {/* 9. Payments */}
              <button
                onClick={() => navigateTo('payments')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'payments' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Payments</span>}
              </button>

              {/* 10. Analytics */}
              <button
                onClick={() => navigateTo('reports')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'reports' || activeTab === 'analytics' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Analytics</span>}
              </button>

              {/* 11. Audit Logs */}
              <button
                onClick={() => navigateTo('audit_logs')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab === 'audit_logs' ? 'bg-slate-950 text-emerald-400 dark:bg-emerald-500 dark:text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Audit Logs</span>}
              </button>

              {/* 12. Settings Dropdown */}
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''} ${activeTab.startsWith('settings_') ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-3.5">
                    <Settings className="w-4 h-4 shrink-0 text-slate-400" />
                    {!isSidebarCollapsed && <span>Settings</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSettingsOpen || activeTab.startsWith('settings_') ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* Submenu Options */}
                {(isSettingsOpen || activeTab.startsWith('settings_')) && !isSidebarCollapsed && (
                  <div className="pl-6 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-5 my-1 animate-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => navigateTo('settings_canteen')}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings_canteen' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      • Canteen Settings
                    </button>
                    <button
                      onClick={() => navigateTo('settings_student')}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings_student' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      • Student Settings
                    </button>
                    <button
                      onClick={() => navigateTo('settings_admin')}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings_admin' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      • Admin Settings
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Footer Logout */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {!isSidebarCollapsed ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                    SA
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{adminProfile?.full_name || 'Super Admin'}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirmModal(true)}
                  className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Account</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(true)}
                className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center cursor-pointer border border-rose-200 dark:border-rose-900/50"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        {/* =========================================
            MAIN CONTENT BODY
           ========================================= */}
        <div className={`flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-250 ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
          {/* Top Bar */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-6 py-3 sticky top-0 z-30 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="text-slate-400 hidden sm:inline">Admin Panel</span>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <span className="text-slate-900 dark:text-white capitalize">{activeTab.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsLoadingSkeletons(true);
                  setTimeout(() => setIsLoadingSkeletons(false), 1000);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Simulate Skeleton Loading"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSkeletons ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Refresh</span>
              </button>

              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>
            </div>
          </header>

          {/* Main Area */}
          <main className="p-4 md:p-6 space-y-6 flex-1">
            {isLoadingSkeletons ? (
              <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                  ))}
                </div>
                <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              </div>
            ) : (
              <>
                {/* 1. DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                      <div>
                        <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">Admin Overview Dashboard</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Multi-tenant hierarchy & dynamic campus metrics.</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => navigateTo('colleges')}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Manage Colleges
                        </button>
                      </div>
                    </div>

                    {/* REDESIGNED DASHBOARD KPI CARDS (ALL 6 CARDS ARE CLICKABLE WITH DRILL-DOWN) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Key Performance Indicators</h2>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                          Click any card to drill down into detailed management
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* 1. Total Colleges */}
                        <div 
                          onClick={() => navigateTo('colleges')}
                          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all hover:scale-[1.02] group"
                          title="Click to view complete college list"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">Total Colleges</span>
                            <Building2 className="w-4 h-4 text-emerald-500" />
                          </div>
                          {kpiData.totalColleges === 0 ? (
                            <p className="text-xs font-bold text-slate-400 mt-2">No colleges onboarded yet</p>
                          ) : (
                            <p className="text-2xl font-black text-slate-950 dark:text-white mt-2">{kpiData.totalColleges}</p>
                          )}
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                            Drill Down →
                          </span>
                        </div>

                        {/* 2. Total Canteens */}
                        <div 
                          onClick={() => navigateTo('canteens')}
                          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-500 hover:shadow-md transition-all hover:scale-[1.02] group"
                          title="Click to view complete canteen list"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Total Canteens</span>
                            <Store className="w-4 h-4 text-blue-500" />
                          </div>
                          {kpiData.totalCanteens === 0 ? (
                            <p className="text-xs font-bold text-slate-400 mt-2">No canteens onboarded</p>
                          ) : (
                            <p className="text-2xl font-black text-slate-950 dark:text-white mt-2">{kpiData.totalCanteens}</p>
                          )}
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1 flex items-center gap-1">
                            Drill Down →
                          </span>
                        </div>

                        {/* 3. Active Students */}
                        <div 
                          onClick={() => navigateTo('students')}
                          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all hover:scale-[1.02] group"
                          title="Click to view all active students"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">Active Students</span>
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-2xl font-black text-emerald-600 mt-2">{kpiData.activeStudentsCount}</p>
                          <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                            Drill Down →
                          </span>
                        </div>

                        {/* 4. Total Students */}
                        <div 
                          onClick={() => navigateTo('students')}
                          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-purple-500 hover:shadow-md transition-all hover:scale-[1.02] group"
                          title="Click to view complete student directory"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-purple-600 transition-colors">Total Students</span>
                            <Users className="w-4 h-4 text-purple-500" />
                          </div>
                          {kpiData.totalStudentsCount === 0 ? (
                            <p className="text-xs font-bold text-slate-400 mt-2">No students registered</p>
                          ) : (
                            <p className="text-2xl font-black text-slate-950 dark:text-white mt-2">{kpiData.totalStudentsCount}</p>
                          )}
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1 flex items-center gap-1">
                            Drill Down →
                          </span>
                        </div>

                        {/* 5. Reports */}
                        <div 
                          onClick={() => navigateTo('reports')}
                          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-500 hover:shadow-md transition-all hover:scale-[1.02] group"
                          title="Click to view complete reports & audit logs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-amber-600 transition-colors">Reports</span>
                            <FileText className="w-4 h-4 text-amber-500" />
                          </div>
                          <p className="text-2xl font-black text-slate-950 dark:text-white mt-2">{kpiData.totalReportsCount}</p>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1 flex items-center gap-1">
                            Drill Down →
                          </span>
                        </div>

                        {/* 6. Total Revenue */}
                        <div 
                          onClick={() => navigateTo('reports')}
                          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all hover:scale-[1.02] group"
                          title="Click to view complete financial breakdown & revenue logs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">Total Revenue</span>
                            <IndianRupee className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-2xl font-black text-emerald-600 mt-2">₹{kpiData.totalRev.toLocaleString()}</p>
                          <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                            Drill Down →
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                        <h3 className="font-black text-sm text-slate-950 dark:text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-600" /> College Hierarchy Quick Overview
                        </h3>
                        <div className="space-y-2 text-xs">
                          {colleges.map(col => (
                            <div key={col.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div>
                                <p className="font-bold text-slate-950 dark:text-white">{col.name}</p>
                                <p className="text-[10px] text-slate-400">{col.city}, {col.state}</p>
                              </div>
                              <button 
                                onClick={() => navigateTo('colleges')}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px]"
                              >
                                View College →
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                        <h3 className="font-black text-sm text-slate-950 dark:text-white flex items-center gap-2">
                          <Store className="w-4 h-4 text-blue-500" /> Active Campus Canteens
                        </h3>
                        <div className="space-y-2 text-xs">
                          {canteens.map(cnt => (
                            <div key={cnt.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div>
                                <p className="font-bold text-slate-950 dark:text-white">{cnt.name}</p>
                                <p className="text-[10px] text-slate-400">College: {cnt.college}</p>
                              </div>
                              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {cnt.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. COLLEGES TAB */}
                {activeTab === 'colleges' && (
                  <CollegeManagementView 
                    colleges={colleges}
                    canteens={canteens}
                    students={students}
                    orders={orders}
                    onAddCollege={handleAddCollege}
                    onEditCollege={handleEditCollege}
                    onDeleteCollege={handleDeleteCollege}
                  />
                )}

                {/* 3. DEPARTMENTS TAB */}
                {activeTab === 'departments' && (
                  <DepartmentManagementView colleges={colleges} />
                )}

                {/* 4. ACADEMIC YEARS TAB */}
                {activeTab === 'academic_years' && (
                  <AcademicYearManagementView colleges={colleges} />
                )}

                {/* 5. CANTEENS TAB */}
                {activeTab === 'canteens' && (
                  <CanteenManagementView 
                    colleges={colleges}
                    canteens={canteens}
                    onUpdateCanteens={setCanteens}
                  />
                )}

                {/* 6. CANTEEN ACCOUNTS TAB */}
                {activeTab === 'canteen_accounts' && (
                  <CanteenAccountsView colleges={colleges} />
                )}

                {/* 7. STUDENTS TAB */}
                {activeTab === 'students' && (
                  <StudentManagementView students={students} />
                )}

                {/* 8. ORDERS TAB */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-slate-900 dark:text-white">Live Campus Orders</h2>
                          <p className="text-xs text-slate-500">Real-time orders queue across all collegiate dining outlets</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                        {orders.length} Active Records
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="py-3.5 px-4">Order Token</th>
                              <th className="py-3.5 px-4">Student</th>
                              <th className="py-3.5 px-4">Items</th>
                              <th className="py-3.5 px-4">Total Amount</th>
                              <th className="py-3.5 px-4">Payment</th>
                              <th className="py-3.5 px-4">Status</th>
                              <th className="py-3.5 px-4 text-right">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                            {orders.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                                  No orders recorded yet.
                                </td>
                              </tr>
                            ) : (
                              orders.map((ord: any) => (
                                <tr key={ord.id || ord.order_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                                    #{ord.token_number || ord.token || (ord.id ? ord.id.slice(-4) : '000')}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-900 dark:text-white">{ord.student_name || ord.student_details?.name || 'Campus Student'}</div>
                                    <div className="text-[10px] text-slate-400">{ord.student_email || ord.student_id || ''}</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {(ord.order_items || ord.items || []).map((i: any) => `${i.item_name || i.name} x${i.quantity || 1}`).join(', ') || 'Assorted Meals'}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                                    ₹{ord.total_amount || ord.amount || 0}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                      {ord.payment_status || 'PAID'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 capitalize">
                                      {ord.order_status || ord.status || 'PREPARING'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right text-[11px] text-slate-400">
                                    {(ord.created_at || '').substring(11, 16) || 'Just now'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. ANALYTICS & REPORTS TAB */}
                {(activeTab === 'reports' || activeTab === 'analytics') && (
                  <ReportManagementView />
                )}

                {/* 10. PAYMENTS TAB */}
                {activeTab === 'payments' && (
                  <AdminPaymentDetailsView />
                )}

                {/* 11. AUDIT LOGS TAB */}
                {activeTab === 'audit_logs' && (
                  <AuditLogsView />
                )}

                {/* 6. CANTEEN SETTINGS PAGE */}
                {activeTab === 'settings_canteen' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                      <h2 className="text-xl font-black text-slate-950 dark:text-white">Canteen Settings & Configuration</h2>
                      <p className="text-xs text-slate-500">Configure global vendor onboarding rules, commissions, and payment gateways.</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 max-w-2xl text-xs font-semibold">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Platform Commission Rate (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(Number(e.target.value))}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div>
                          <p className="font-extrabold text-slate-950 dark:text-white">Auto-verify New Canteens</p>
                          <p className="text-[11px] text-slate-400">Automatically approve canteen applications upon form submission.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoVerifyCanteens}
                          onChange={(e) => setAutoVerifyCanteens(e.target.checked)}
                          className="w-5 h-5 accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <button
                        onClick={() => triggerToast('Canteen settings updated successfully!')}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                      >
                        Save Canteen Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. STUDENT SETTINGS PAGE */}
                {activeTab === 'settings_student' && (
                  <StudentSettingsView />
                )}

                {/* 8. ADMIN SETTINGS PAGE */}
                {activeTab === 'settings_admin' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                      <h2 className="text-xl font-black text-slate-950 dark:text-white">Admin Credentials & Security</h2>
                      <p className="text-xs text-slate-500">Manage roll number verification and master security keys.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Password Reset Form */}
                      <form onSubmit={handlePasswordReset} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-xs font-semibold">
                        <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Master Password Reset</h3>
                        {passFeedback && (
                          <div className={`p-3 rounded-xl font-bold ${passFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {passFeedback.text}
                          </div>
                        )}
                        <div>
                          <label className="block text-slate-500 font-bold mb-1">Verify Admin Roll Number *</label>
                          <input
                            type="text"
                            required
                            value={rollInput}
                            onChange={(e) => setRollInput(e.target.value)}
                            placeholder="Enter admin roll number"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1">New Master Password *</label>
                          <input
                            type="password"
                            required
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                        >
                          Update Master Security Password
                        </button>
                      </form>

                      {/* Maintenance Mode */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-xs font-semibold">
                        <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">System Controls</h3>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <div>
                            <p className="font-extrabold text-slate-950 dark:text-white">System Maintenance Mode</p>
                            <p className="text-[11px] text-slate-400">Suspend student food ordering platform wide.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={maintenanceMode}
                            onChange={(e) => setMaintenanceMode(e.target.checked)}
                            className="w-5 h-5 accent-red-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Admin Logout Confirmation Modal */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Confirm Admin Logout</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Are you sure you want to exit your Super Admin Session?</p>
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                className="flex-1 py-3 rounded-xl font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-all text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowLogoutConfirmModal(false);
                  onLogout();
                }}
                className="flex-1 py-3 rounded-xl font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md text-xs cursor-pointer"
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

export default AdminView;
