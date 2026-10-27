import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Order, OrderStatus, User as AppUser, MenuItem, CanteenProfile } from '../../types';
import SummaryDashboard from '../dashboard/SummaryDashboard';
import WalkInOrderView from '../canteen/WalkInOrderView';
import ReportsAnalysisView from '../reports/ReportsAnalysisView';
import TVDashboard from '../tv/TVDashboard';
import MenuCatalogView from '../canteen/MenuCatalogView';
import { 
  Check, Play, Printer, Plus, Search, Trash2, 
  Package, UtensilsCrossed, Settings, 
  LogOut, LayoutDashboard,
  Edit2, ShoppingCart, ArrowLeft, RotateCw, X as XIcon, User as UserIcon,
  BarChart3, Store, Phone, Mail, Save, ToggleLeft as Toggle,
  Clock as ClockIcon, CreditCard, Monitor, AlertCircle, ChevronRight, CheckCircle2,
  Tv2, Bell, Sun, Moon, Shield, Lock, ChevronLeft, PanelLeft, PanelLeftClose,
  FileText, HelpCircle, Terminal, TrendingUp, QrCode, Receipt, Maximize2, Minimize2, XCircle
} from 'lucide-react';

import CanteenSettingsView from '../canteen/CanteenSettingsView';
import NotificationCenter from '../notifications/NotificationCenter';
import { StudentReceiptModal } from '../payment/StudentReceiptModal';
import HelpSupportView from '../notifications/HelpSupportView';
import { CanteenSetupModal } from '../canteen/CanteenSetupModal';

interface StaffViewProps {
  user: AppUser;
  orders: Order[];
  menu: MenuItem[];
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateMenu: (menu: MenuItem[]) => void;
  onLogout: () => void;
  isOnlineStatus?: boolean;
  onUpdateOnlineStatus?: (status: boolean) => void;
}

type StaffTab = 'summary' | 'orders' | 'inventory' | 'reports' | 'profile' | 'walk-in-order' | 'tv-view' | 'help-support';

const StaffView: React.FC<StaffViewProps> = ({ 
  user, 
  orders, 
  menu, 
  onUpdateOrders, 
  onUpdateMenu, 
  onLogout,
  isOnlineStatus: propOnlineStatus,
  onUpdateOnlineStatus
}) => {
  const [activeTab, setActiveTab] = useState<StaffTab>('walk-in-order');
  const [tabHistory, setTabHistory] = useState<StaffTab[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [localOnlineStatus, setLocalOnlineStatus] = useState(true);
  const isOnlineStatus = propOnlineStatus !== undefined ? propOnlineStatus : localOnlineStatus;
  const setIsOnlineStatus = (status: boolean) => {
    if (onUpdateOnlineStatus) {
      onUpdateOnlineStatus(status);
    } else {
      setLocalOnlineStatus(status);
    }
  };
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Fullscreen Handler using Browser Fullscreen API (Keeps Sidebar Visible)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn('Fullscreen error:', err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn('Exit fullscreen error:', err));
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Inventory Edit State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    item_name: '',
    price: 0,
    category: 'breakfast',
    availability: true,
    is_veg: true,
    stock_offline: 100,
    stock_online: 50,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'
  });

  const canteenProfile = user.profile as CanteenProfile;
  const [showSetupModal, setShowSetupModal] = useState<boolean>(() => {
    return !(canteenProfile && canteenProfile.canteen_name && canteenProfile.canteen_name !== 'TimeToMeal Main Canteen' && (canteenProfile as any).location);
  });

  const navigateTo = useCallback((tab: StaffTab) => {
    if (tab === activeTab) return;
    window.history.pushState({ tab }, '', `#${tab}`);
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
  }, [activeTab]);

  const goBack = useCallback(() => {
    if (tabHistory.length === 0) return;
    const previous = tabHistory[tabHistory.length - 1];
    setTabHistory(prev => prev.slice(0, -1));
    setActiveTab(previous);
  }, [tabHistory]);

  // Handle browser / Android back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.modalSubScreen) return;
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else if (tabHistory.length > 0) {
        goBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tabHistory, goBack]);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Tab') { e.preventDefault(); navigateTo('walk-in-order'); }
      if (e.key === 'Escape') { e.preventDefault(); goBack(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); setIsSidebarOpen(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, navigateTo]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, order_status: status } : o);
    onUpdateOrders(updated);
  };

  const toggleAvailability = (itemId: string) => {
    const updated = menu.map(m => m.id === itemId ? { ...m, availability: !m.availability } : m);
    onUpdateMenu(updated);
  };

  const deleteMenuItem = (itemId: string) => {
    if (confirm('Permanently delete this item?')) {
      onUpdateMenu(menu.filter(m => m.id !== itemId));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const createdItem: MenuItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      canteen_id: 's1', 
      low_stock_threshold: 10
    } as MenuItem;
    onUpdateMenu([...menu, createdItem]);
    setIsAddingItem(false);
    setNewItem({ item_name: '', price: 0, category: 'breakfast', availability: true, is_veg: true, stock_offline: 100, stock_online: 50, imageUrl: newItem.imageUrl, description: '' });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.student_details?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const filteredInventory = useMemo(() => {
    return menu.filter(m => m.item_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [menu, searchTerm]);

  if (activeTab === 'tv-view') {
    return <TVDashboard orders={orders} onBack={goBack} />;
  }

  const navItems = [
    { id: 'summary', icon: BarChart3, label: 'Overview' },
    { id: 'inventory', icon: UtensilsCrossed, label: 'Menu Catalog & Add Items' },
    { id: 'orders', icon: CheckCircle2, label: 'Order Confirm' },
    { id: 'walk-in-order', icon: FileText, label: 'New Bill System' },
    { id: 'profile', icon: Settings, label: 'Canteen Settings' }
  ];

  const bottomNavItems = [
    { id: 'summary', icon: BarChart3, label: 'Overview' },
    { id: 'orders', icon: CheckCircle2, label: 'Orders' },
    { id: 'walk-in-order', icon: FileText, label: 'Billing' },
    { id: 'inventory', icon: UtensilsCrossed, label: 'Menu' },
    { id: 'profile', icon: Settings, label: 'Settings' }
  ];

  return (
    <div key={refreshKey} className={`h-screen max-h-screen w-full overflow-hidden flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-5 z-[200] bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4" /> {showToast}
        </div>
      )}

      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 lg:hidden hidden md:block transition-opacity duration-300"
        />
      )}

      {/* Clean White Sidebar (Remains Visible in Full Screen Mode) */}
      <aside 
        className={`bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-40 fixed top-0 bottom-0 left-0 h-screen overflow-y-auto overflow-x-hidden ${
          isSidebarOpen 
            ? 'w-64 translate-x-0 shadow-xl shadow-slate-100/50 dark:shadow-none' 
            : '-translate-x-full lg:translate-x-0 lg:w-16'
        } hidden md:flex`}
      >
        <div>
          {/* Brand Header */}
          <div className={`p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'gap-3' : 'justify-center p-2'}`}>
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-md shadow-emerald-500/20">
              T
            </div>
            <div className={`flex flex-col whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0 hidden lg:hidden'}`}>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">TimeToMeal</span>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">CANTEEN PORTAL</span>
            </div>
          </div>

          {/* Main Navigation Items */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigateTo(item.id as StaffTab);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition-all group cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  } ${!isSidebarOpen ? 'lg:justify-center lg:px-0' : ''}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-emerald-400'}`} />
                  <span className={`truncate whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 max-w-[170px]' : 'opacity-0 max-w-0 hidden lg:hidden'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Help & Support Header Section */}
          <div className="px-3 pt-6">
            <p className={`px-3.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0 hidden lg:hidden'}`}>
              HELP & SUPPORT
            </p>
            <div className="space-y-1">
              {[
                { label: 'Help & Support', icon: HelpCircle, action: () => navigateTo('help-support') },
              ].map((actionItem, i) => {
                const ActionIcon = actionItem.icon;
                return (
                  <button 
                    key={i}
                    onClick={() => {
                      actionItem.action();
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    title={!isSidebarOpen ? actionItem.label : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-bold text-xs cursor-pointer ${
                      activeTab === 'help-support' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-extrabold' : ''
                    } ${!isSidebarOpen ? 'lg:justify-center lg:px-0' : ''}`}
                  >
                    <ActionIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-emerald-400 shrink-0" />
                    <span className={`truncate whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0 hidden lg:hidden'}`}>
                      {actionItem.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Staff Account Info at Bottom */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className={`p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 transition-all duration-300 ${!isSidebarOpen ? 'lg:justify-center lg:p-2' : ''}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-sm shrink-0">
                S
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 max-w-[130px]' : 'opacity-0 max-w-0 hidden lg:hidden'}`}>
                <p className="font-extrabold text-xs text-slate-800 dark:text-white truncate leading-tight">Staff Account</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Right Content Panel */}
      <div className={`flex-1 flex flex-col h-screen overflow-y-auto min-w-0 transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        
        {/* Top Header Navigation Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:px-5 md:py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs h-14 md:h-16">
          <div className="flex items-center gap-2.5 md:gap-3">
            {/* Open/Close Sidebar Toggle button */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer hidden md:block"
              title="Toggle Sidebar Menu"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Back Button (Only on Mobile) */}
            {tabHistory.length > 0 && (
              <button 
                onClick={goBack} 
                className="md:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Title View */}
            <div className="md:hidden">
              <h1 className="text-sm font-black text-slate-950 dark:text-white tracking-tight leading-none pt-0.5">
                {activeTab === 'walk-in-order' ? 'Counter Billing' : 
                 activeTab === 'summary' ? 'Overview' : 
                 activeTab === 'orders' ? 'Orders Queue' : 
                 activeTab === 'inventory' ? 'Menu Catalog' : 
                 activeTab === 'profile' ? 'Settings' : 'Canteen Portal'}
              </h1>
            </div>

            {/* Desktop Title View */}
            <div className="hidden md:flex items-center gap-2">
              {tabHistory.length > 0 && (
                <button 
                  onClick={goBack} 
                  className="mr-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                  title="Go Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h1 className="text-sm font-black text-slate-950 dark:text-white tracking-tight leading-tight">
                  {activeTab === 'walk-in-order' ? 'New Bill System' : 
                   activeTab === 'summary' ? 'Overview' : 
                   activeTab === 'orders' ? 'Order Confirm & Live Queue' : 
                   activeTab === 'inventory' ? 'Menu Catalog & Add Items' : 
                   activeTab === 'reports' ? 'Financial Reports' : 
                   activeTab === 'profile' ? 'Canteen Settings' : 
                   activeTab === 'help-support' ? 'Help & Support' : 'Admin Panel'}
                </h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider mt-0.5">
                  {canteenProfile?.canteen_name || 'TimeToMeal Main Canteen'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls Header Bar */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Canteen Status Toggle Badge (Online/Offline) */}
            <label className="flex items-center cursor-pointer gap-1.5 md:gap-2 bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 select-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {isOnlineStatus ? '🟢' : '🔴'} <span className="hidden sm:inline-block">{isOnlineStatus ? 'Online' : 'Offline'}</span>
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={isOnlineStatus} 
                  onChange={() => setIsOnlineStatus(!isOnlineStatus)}
                  className="sr-only peer" 
                />
                <div className="w-7 h-4 md:w-8 md:h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 md:after:h-4 md:after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>

            {/* FULL SCREEN TOGGLE BUTTON Beside Online/Offline Toggle */}
            <button 
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-all font-bold text-xs cursor-pointer shadow-2xs"
              title={isFullscreen ? "Exit Full Screen Kiosk Mode" : "Enter Full Screen Kiosk Mode"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-600" /> : <Maximize2 className="w-4 h-4 text-emerald-600" />}
              <span className="hidden sm:inline-block font-black uppercase text-[10px] tracking-wider">{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
            </button>

            <button 
              onClick={() => setIsNotificationCenterOpen(true)}
              className="p-1.5 md:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[#031B15] font-black text-[9px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                3
              </span>
            </button>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-1.5 md:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </header>

        {/* Content Views */}
        <main key={activeTab} className={`flex-1 animate-in fade-in duration-200 ease-out ${
          activeTab === 'walk-in-order'
            ? 'p-2 sm:p-3 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-hidden flex flex-col justify-between'
            : 'p-4 lg:p-4 pb-24 md:pb-5 space-y-4'
        }`}>
          {activeTab === 'summary' && <SummaryDashboard orders={orders} onNewWalkIn={() => navigateTo('walk-in-order')} menu={menu} />}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-xs font-bold"
                    placeholder="Search Token ID or Name..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
                    <Package className="w-12 h-12 opacity-20" />
                    <p className="font-bold text-xs">No active orders found in queue</p>
                  </div>
                ) : (
                  filteredOrders.map(order => {
                    const cancelTimerMinutes = parseInt(localStorage.getItem('ttm_cancel_timer_minutes') || '20', 10);
                    const orderCreatedAt = new Date(order.created_at || Date.now()).getTime();
                    const now = Date.now();
                    const elapsedSec = Math.floor((now - orderCreatedAt) / 1000);
                    const totalAllowedSec = cancelTimerMinutes * 60;
                    const remSec = Math.max(0, totalAllowedSec - elapsedSec);
                    const remMins = Math.floor(remSec / 60);
                    const remSecs = remSec % 60;
                    const isCancelWindowActive = remSec > 0 && order.order_status !== 'delivered' && order.order_status !== 'cancelled';

                    return (
                    <div key={order.id} className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-gray-100 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3">
                      {/* Card Header row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/40">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono bg-slate-950 text-[#00FF66] font-black tracking-wider text-xs px-2.5 py-1.5 rounded-lg shrink-0">
                            #{order.order_code}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {order.student_details?.full_name || 'Walk-in Counter Guest'}
                            </h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              <ClockIcon className="w-3 h-3 text-slate-300 dark:text-slate-600" /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${order.payment_status === 'paid' || order.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {order.payment_status || 'Unpaid'}
                          </span>
                          <span className="text-lg font-black text-slate-950 dark:text-white tracking-tight">
                            ₹{order.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Card Body - Order items list container */}
                      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-4 space-y-1.5">
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 py-1.5 border-b border-slate-100 dark:border-slate-800/30 last:border-0 last:pb-0 first:pt-0">
                            <span className="flex items-center gap-1 text-slate-900 dark:text-slate-200 font-extrabold">
                              <span className="text-emerald-600 dark:text-emerald-400 font-black shrink-0">{item.quantity}x</span> 
                              {item.item_name}
                            </span>
                            <span className="text-slate-500 font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Card Footer row - Status badge & Action buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        {/* Status Label & Timer */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            order.order_status === 'delivered' 
                              ? 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400' 
                              : order.order_status === 'cancelled'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                          }`}>
                            {order.order_status === 'delivered' ? 'Completed' : order.order_status === 'cancelled' ? 'Cancelled' : 'Pending Pickup'}
                          </span>

                          {isCancelWindowActive && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1">
                              <ClockIcon className="w-3 h-3 animate-pulse" />
                              Auto-Cancel: {remMins}m {remSecs}s
                            </span>
                          )}
                        </div>

                        {/* Button Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:justify-end">
                          <button 
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 w-full sm:w-auto"
                          >
                            <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            View Bill / Token
                          </button>

                          {isCancelWindowActive && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to cancel Order #${order.order_code}?`)) {
                                  updateOrderStatus(order.id, 'cancelled');
                                  triggerToast(`Order #${order.order_code} cancelled`);
                                }
                              }}
                              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel Order
                            </button>
                          )}

                          {order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
                            <button 
                              onClick={() => {
                                const tokenInput = prompt(`Enter Token Number for ${order.student_details?.full_name || 'Walk-in Guest'} (Expected: ${order.order_code}):`);
                                if (tokenInput === order.order_code) {
                                  updateOrderStatus(order.id, 'delivered');
                                } else if (tokenInput !== null) {
                                  alert('Invalid Token Number. Please check the token and try again.');
                                }
                              }} 
                              className="px-4 py-2.5 bg-slate-950 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer w-full sm:w-auto"
                            >
                              <Check className="w-3.5 h-3.5" /> Verify & Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <MenuCatalogView 
              menu={menu} 
              orders={orders} 
              onUpdateMenu={onUpdateMenu} 
              onBackToDashboard={() => setActiveTab('summary')}
            />
          )}

          {activeTab === 'reports' && <ReportsAnalysisView orders={orders} menu={menu} onNewWalkIn={() => navigateTo('walk-in-order')} />}
          {activeTab === 'walk-in-order' && <WalkInOrderView user={user} menu={menu} onBack={goBack} onPlaceOrder={(o) => onUpdateOrders([o, ...orders])} />}
          {/* CANTEEN SETTINGS PAGE */}
          {activeTab === 'profile' && (
             <CanteenSettingsView user={user} onLogout={onLogout} />
          )}

          {/* HELP & SUPPORT PAGE */}
          {activeTab === 'help-support' && (
             <HelpSupportView onBack={goBack} userRole="staff" />
          )}
        </main>
      </div>

      {/* Add New Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Add New Menu Item</h3>
                  <p className="text-xs text-slate-400 font-medium">Add a new dish to Canteen Menu Catalog</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingItem(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dish Name</label>
                <input 
                  type="text" 
                  required 
                  value={newItem.item_name || ''} 
                  onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="e.g. Masala Dosa, Paneer Butter Masala..." 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={newItem.price || ''} 
                    onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    placeholder="75" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                  <select 
                    value={newItem.category || 'breakfast'} 
                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="beverage">Beverages</option>
                    <option value="snacks">Snacks & Fast Food</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Counter Stock</label>
                  <input 
                    type="number" 
                    value={newItem.stock_offline || 100} 
                    onChange={e => setNewItem({ ...newItem, stock_offline: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Online Stock</label>
                  <input 
                    type="number" 
                    value={newItem.stock_online || 50} 
                    onChange={e => setNewItem({ ...newItem, stock_online: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dish Image URL</label>
                <input 
                  type="url" 
                  value={newItem.imageUrl || ''} 
                  onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..." 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none" 
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={newItem.is_veg !== false} 
                    onChange={e => setNewItem({ ...newItem, is_veg: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" 
                  />
                  Vegetarian Dish
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddingItem(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Save Item to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NotificationCenter isOpen={isNotificationCenterOpen} onClose={() => setIsNotificationCenterOpen(false)} />

      {/* Student Receipt Modal for QR Bill Printing */}
      <StudentReceiptModal order={selectedReceiptOrder} onClose={() => setSelectedReceiptOrder(null)} />

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex justify-around items-center shadow-lg transition-colors duration-300 pb-safe">
        {bottomNavItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id as StaffTab)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative cursor-pointer min-w-[64px] ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5.5 h-5.5 transition-transform duration-200 ${isActive ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-1 font-bold whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mandatory First-Time Login Canteen Setup Modal */}
      {showSetupModal && (
        <CanteenSetupModal 
          user={user} 
          onComplete={(updatedCanteen) => {
            setShowSetupModal(false);
            triggerToast('Canteen profile setup completed successfully!');
          }} 
        />
      )}
    </div>
  );
};

export default StaffView;
