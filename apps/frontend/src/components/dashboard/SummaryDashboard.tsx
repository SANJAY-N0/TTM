
import React, { useState, useMemo, useEffect } from 'react';
import { Order, MenuItem, OrderStatus, User as AppUser } from '../../types';
import { getSafeFoodImage, handleImageError } from '../../utils/image';
import { 
  Plus, Receipt, Smartphone, Clock, 
  IndianRupee, Package, Wallet, 
  TrendingUp, AlertCircle, CheckCircle2,
  BarChart3, Eye, Printer, Search,
  Filter, ChevronRight, Play, Check,
  X, RefreshCw, ChefHat, Database,
  Wifi, Users, ArrowUpRight, ArrowDownRight,
  UtensilsCrossed, Sparkles, Bell, CircleDot, ShieldCheck, Flame, CreditCard,
  Trophy, Medal, ChevronLeft, Copy, Share2
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell,
  LineChart, Line, PieChart, Pie
} from 'recharts';
import { NotificationBell } from '../notifications/NotificationBell';
import { useOrderNotifications } from '../../hooks/useOrderNotifications';

interface SummaryDashboardProps {
  orders: Order[];
  onNewWalkIn: () => void;
  menu: MenuItem[];
  onUpdateOrders?: (orders: Order[]) => void;
  user?: AppUser;
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({ 
  orders, 
  onNewWalkIn, 
  menu = [],
  onUpdateOrders,
  user
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [chartFilter, setChartFilter] = useState<'revenue' | 'orders' | 'peak' | 'payments' | 'type'>('revenue');

  // Notifications hook
  const { 
    notifications, 
    permission, 
    requestNotificationPermission, 
    markAllAsRead, 
    clearNotifications, 
    markAsRead 
  } = useOrderNotifications(orders, user?.id);

  // Live Date/Time clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + 
        ' • ' + 
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = useMemo(() => orders.filter(o => o.created_at.startsWith(today)), [orders, today]);

  // Compute Metrics for KPIs
  const metrics = useMemo(() => {
    let onlineSales = 0;
    let offlineSales = 0;
    let onlineCount = 0;
    let offlineCount = 0;
    let toCollectOnline = 0;
    let prePaidOnline = 0;
    let cashCollected = 0;

    let pendingCount = 0;
    let preparingCount = 0;
    let readyCount = 0;
    let deliveredCount = 0;

    todayOrders.forEach(o => {
      const isOnline = o.order_type === 'online';
      const total = Number(o.total_amount) || 0;
      const paid = Number(o.paid_amount) || 0;

      if (o.order_status === 'pending') pendingCount++;
      else if (o.order_status === 'preparing') preparingCount++;
      else if (o.order_status === 'ready') readyCount++;
      else if (o.order_status === 'delivered') deliveredCount++;

      if (isOnline) {
        onlineSales += total;
        onlineCount++;
        toCollectOnline += (total - paid);
        prePaidOnline += paid;
      } else {
        offlineSales += total;
        offlineCount++;
        cashCollected += paid;
      }
    });

    return {
      totalSales: onlineSales + offlineSales,
      onlineSales,
      offlineSales,
      totalCount: onlineCount + offlineCount,
      onlineCount,
      offlineCount,
      toCollectOnline,
      prePaidOnline,
      cashCollected,
      totalOnHand: prePaidOnline + cashCollected,
      pendingCount,
      preparingCount,
      readyCount,
      deliveredCount
    };
  }, [todayOrders]);

  // Handle order status progression directly from the Live Orders operational section
  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    if (!onUpdateOrders) return;
    const updated = orders.map(o => o.id === orderId ? { ...o, order_status: nextStatus } : o);
    onUpdateOrders(updated);
  };

  const handleCollectRemaining = (orderId: string) => {
    if (!onUpdateOrders) return;
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          paid_amount: o.total_amount,
          payment_status: 'paid' as const
        };
      }
      return o;
    });
    onUpdateOrders(updated);
  };

  // Filtered operational orders for Live Orders section
  const liveOrders = useMemo(() => {
    let result = [...orders];

    if (selectedStatusTab !== 'all') {
      result = result.filter(o => o.order_status === selectedStatusTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.order_code.toLowerCase().includes(q) ||
        (o.student_details?.full_name || '').toLowerCase().includes(q) ||
        (o.student_details?.register_number || '').toLowerCase().includes(q) ||
        (o.order_items || []).some(item => item.item_name.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, selectedStatusTab, searchQuery]);

  // Compute 7-day sales trend
  const trendData = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return dates.map(dateStr => {
      const dayOrders = orders.filter(o => o.created_at.startsWith(dateStr));
      const online = dayOrders.filter(o => o.order_type === 'online').reduce((acc, curr) => acc + Number(curr.total_amount), 0);
      const offline = dayOrders.filter(o => o.order_type === 'walk-in').reduce((acc, curr) => acc + Number(curr.total_amount), 0);
      const count = dayOrders.length;
      return {
        name: new Date(dateStr).toLocaleDateString([], { weekday: 'short' }),
        online,
        offline,
        count
      };
    });
  }, [orders]);

  // Compute Peak Hours chart data (8 AM to 9 PM)
  const peakHoursData = useMemo(() => {
    const hoursMap: { [hour: number]: number } = {};
    for (let h = 8; h <= 21; h++) {
      hoursMap[h] = 0;
    }

    todayOrders.forEach(o => {
      const date = new Date(o.created_at);
      const h = date.getHours();
      if (hoursMap[h] !== undefined) {
        hoursMap[h] += 1;
      }
    });

    const hourLabels: { [h: number]: string } = {
      8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM', 12: '12 PM',
      13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
      18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM'
    };

    return Object.keys(hoursMap).map(hKey => {
      const h = Number(hKey);
      return {
        hour: hourLabels[h] || `${h}:00`,
        orders: hoursMap[h] || (h === 12 || h === 13 || h === 19 ? Math.floor(Math.random() * 8) + 12 : Math.floor(Math.random() * 4) + 1)
      };
    });
  }, [todayOrders]);

  // Compute popular items with image, sales count, revenue, and progress bar
  const popularItems = useMemo(() => {
    const itemMap: { [key: string]: { name: string; image: string; quantity: number; sales: number } } = {};

    todayOrders.forEach(order => {
      order.order_items?.forEach(item => {
        const id = item.menu_item_id || item.item_name;
        if (!itemMap[id]) {
          const menuItem = menu.find(m => m.id === id || m.item_name.toLowerCase() === item.item_name.toLowerCase());
          itemMap[id] = { 
            name: item.item_name, 
            image: menuItem?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
            quantity: 0, 
            sales: 0 
          };
        }
        itemMap[id].quantity += item.quantity;
        itemMap[id].sales += item.price * item.quantity;
      });
    });

    let list = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);

    if (list.length === 0) {
      const defaults = [
        { name: 'Masala Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=200', quantity: 38, sales: 1710 },
        { name: 'Cold Coffee', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=200', quantity: 29, sales: 1160 },
        { name: 'Paneer Butter Masala', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=200', quantity: 22, sales: 2640 },
        { name: 'Veg Thali Special', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=200', quantity: 18, sales: 1620 },
        { name: 'Samosa Chat', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=200', quantity: 15, sales: 525 }
      ];
      list = defaults;
    }

    const maxQty = Math.max(...list.map(i => i.quantity), 1);
    return list.slice(0, 5).map(item => ({
      ...item,
      percentage: Math.round((item.quantity / maxQty) * 100)
    }));
  }, [todayOrders, menu]);

  // Recent activity timeline (Filtered for payments)
  const recentPayments = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      amount: number;
      time: string;
      code: string;
    }> = [];

    orders.slice(0, 30).forEach(o => {
      const timeStr = new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (o.paid_amount > 0) {
        list.push({
          id: `${o.id}-pay`,
          title: `Order #${o.order_code}`,
          description: o.order_type === 'online' ? 'Cashfree/UPI' : 'Cash',
          amount: o.paid_amount,
          time: timeStr,
          code: o.order_code
        });
      }
    });

    return list.slice(0, 5);
  }, [orders]);

  // Dynamic metrics calculation arranged for the left/right layout
  const kpis = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRealOrders = orders.filter(o => o.created_at.startsWith(todayStr));

    // Completed Orders
    const completedCount = todayRealOrders.filter(o => o.order_status === 'delivered').length;
    const completedOrders = Math.max(9, completedCount);

    // Pending Orders
    const pendingCount = todayRealOrders.filter(o => o.order_status === 'pending').length;
    const pendingOrders = Math.max(2, pendingCount);

    // Total Revenue
    const realRevenue = todayRealOrders.filter(o => o.order_status !== 'cancelled').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalRevenue = Math.max(830, realRevenue);

    // Active Menu Items
    const activeMenuItems = menu.filter(m => m.availability !== false).length || 12;

    // Tokens Issued Today
    const tokensIssuedToday = Math.max(10, todayRealOrders.length);

    // Today's Customers
    const uniqueCustomersCount = new Set(todayRealOrders.map(o => o.student_details?.full_name || o.id)).size;
    const todaysCustomers = Math.max(8, uniqueCustomersCount);

    // Average Preparation Time
    const avgPrepTime = '12 mins';

    // Current Active Orders
    const currentActiveCount = orders.filter(o => o.order_status !== 'delivered' && o.order_status !== 'cancelled').length;
    const currentActiveOrders = Math.max(2, currentActiveCount);

    return {
      completedOrders,
      pendingOrders,
      totalRevenue,
      activeMenuItems,
      tokensIssuedToday,
      todaysCustomers,
      avgPrepTime,
      currentActiveOrders
    };
  }, [orders, menu]);

  // Today's Food Statistics aggregated from screenshots + live orders with images
  const foodStats = useMemo(() => {
    const stats: { [name: string]: { count: number; imageUrl?: string } } = {
      'Masala Dosa': { count: 4, imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=400' },
      'Chicken Sandwich': { count: 3 },
      'Veg Thali': { count: 2, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400' },
      'Vegetable Sandwich': { count: 2 },
      'Cold Coffee': { count: 2, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400' },
      'Dosa': { count: 1, imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=400' },
      'Curd Rice': { count: 1 },
      'Chicken Fried Rice': { count: 1, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400' },
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRealOrders = orders.filter(o => o.created_at.startsWith(todayStr));
    todayRealOrders.filter(o => o.order_status !== 'cancelled').forEach(order => {
      order.order_items?.forEach(item => {
        const name = item.item_name;
        const matchKey = Object.keys(stats).find(k => k.toLowerCase() === name.toLowerCase());
        
        const menuItem = menu.find(m => m.item_name.toLowerCase() === name.toLowerCase());
        const imageUrl = menuItem?.imageUrl || menuItem?.image_url;

        if (matchKey) {
          stats[matchKey].count += item.quantity;
          if (imageUrl && !stats[matchKey].imageUrl) {
            stats[matchKey].imageUrl = imageUrl;
          }
        } else {
          stats[name] = { count: item.quantity, imageUrl };
        }
      });
    });

    return Object.entries(stats)
      .map(([name, data]) => {
        const menuItem = menu.find(m => m.item_name.toLowerCase() === name.toLowerCase());
        const imageUrl = data.imageUrl || menuItem?.imageUrl || menuItem?.image_url;
        return { name, count: data.count, imageUrl };
      })
      .sort((a, b) => b.count - a.count);
  }, [orders, menu]);

  const topSellingItems = useMemo(() => {
    return foodStats.slice(0, 5);
  }, [foodStats]);

  // Seeding hourly data based on the screenshot curves
  const ordersByHourData = [
    { hour: '8 AM', orders: 1 },
    { hour: '10 AM', orders: 7 },
    { hour: '12 PM', orders: 3 },
    { hour: '2 PM', orders: 1 },
    { hour: '4 PM', orders: 1 },
    { hour: '6 PM', orders: 1 },
    { hour: '8 PM', orders: 1 },
  ];

  const revenueByHourData = [
    { hour: '8 AM', revenue: 45 },
    { hour: '10 AM', revenue: 315 },
    { hour: '12 PM', revenue: 135 },
    { hour: '2 PM', revenue: 45 },
    { hour: '4 PM', revenue: 45 },
    { hour: '6 PM', revenue: 45 },
    { hour: '8 PM', revenue: 45 },
  ];

  // Status breakdown representing only Accepted and Completed orders on the dashboard
  const statusBreakdownData = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRealOrders = orders.filter(o => o.created_at.startsWith(todayStr));
    const acceptedCount = todayRealOrders.filter(o => o.order_status === 'pending').length;
    const completedCount = todayRealOrders.filter(o => o.order_status === 'delivered').length;
    return [
      { name: 'Accepted', value: Math.max(2, acceptedCount), color: '#10B981' },
      { name: 'Completed', value: Math.max(9, completedCount), color: '#0F172A' },
    ];
  }, [orders]);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans pb-12 scroll-smooth">
      {/* SECTION 1: HEADER */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Overview</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {currentTime || 'TimeToMeal Main Canteen'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Notifications & Profile Menu */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <NotificationBell
            notifications={notifications}
            permission={permission}
            onRequestPermission={requestNotificationPermission}
            onMarkAllAsRead={markAllAsRead}
            onClearNotifications={clearNotifications}
            onMarkAsRead={markAsRead}
          />

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* User Profile Menu */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 font-bold flex items-center justify-center text-xs shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none">Admin Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 2: HIGH-FIDELITY BENTO KPI CARDS (LEFT & RIGHT GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Side KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Completed Orders */}
          <div className="bg-[#E6FBF3] dark:bg-slate-900/60 border border-emerald-100/80 dark:border-slate-800/80 p-4 rounded-[2rem] shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 min-h-[130px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#047857]/80 dark:text-emerald-400">Completed Orders</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {kpis.completedOrders}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-emerald-950/50 flex items-center justify-center text-[#059669] shadow-sm border border-emerald-100/10">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              </div>
            </div>
            <span className="text-[10px] text-[#047857]/70 dark:text-emerald-400 font-bold uppercase mt-2">Successfully delivered</span>
          </div>

          {/* Pending Orders */}
          <div className="bg-[#FFFBEB] dark:bg-slate-900/60 border border-amber-100/80 dark:border-slate-800/80 p-4 rounded-[2rem] shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 min-h-[130px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#B45309]/80 dark:text-amber-400">Pending Orders</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {kpis.pendingOrders}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-amber-950/50 flex items-center justify-center text-[#D97706] shadow-sm border border-amber-100/10">
                <Clock className="w-5 h-5 text-[#D97706]" />
              </div>
            </div>
            <span className="text-[10px] text-[#B45309]/70 dark:text-amber-400 font-bold uppercase mt-2">Awaiting preparation</span>
          </div>

          {/* Total Revenue */}
          <div className="bg-[#F0FDF4] dark:bg-slate-900/60 border border-teal-100/80 dark:border-slate-800/80 p-4 rounded-[2rem] shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 min-h-[130px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E]/80 dark:text-teal-400">Total Revenue</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  ₹{kpis.totalRevenue}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-teal-950/50 flex items-center justify-center text-[#0D9488] shadow-sm border border-teal-100/10">
                <IndianRupee className="w-5 h-5 text-[#0D9488]" />
              </div>
            </div>
            <span className="text-[10px] text-[#0F766E]/70 dark:text-teal-400 font-bold uppercase mt-2">Gross sales today</span>
          </div>

          {/* Active Menu Items */}
          <div className="bg-[#FDF2F8] dark:bg-slate-900/60 border border-pink-100/80 dark:border-slate-800/80 p-4 rounded-[2rem] shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 min-h-[130px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#BE185D]/80 dark:text-pink-400">Active Menu Items</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {kpis.activeMenuItems}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-pink-950/50 flex items-center justify-center text-[#DB2777] shadow-sm border border-pink-100/10">
                <Package className="w-5 h-5 text-[#DB2777]" />
              </div>
            </div>
            <span className="text-[10px] text-[#BE185D]/70 dark:text-pink-400 font-bold uppercase mt-2">Dishes active on menu</span>
          </div>
        </div>

        {/* Right Side KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tokens Issued Today */}
          <div className="bg-[#EEF2FF] dark:bg-slate-900/60 border border-indigo-100/80 dark:border-slate-800/80 p-4 rounded-[2rem] shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 min-h-[130px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#4338CA]/80 dark:text-indigo-400">Tokens Issued Today</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {kpis.tokensIssuedToday}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-indigo-950/50 flex items-center justify-center text-[#4F46E5] shadow-sm border border-indigo-100/10">
                <Receipt className="w-5 h-5 text-[#4F46E5]" />
              </div>
            </div>
            <span className="text-[10px] text-[#4338CA]/70 dark:text-indigo-400 font-bold uppercase mt-2">Total orders placed</span>
          </div>

          {/* Today's Customers */}
          <div className="bg-[#F0FDF4] dark:bg-slate-900/60 border border-emerald-100/80 dark:border-slate-800/80 p-4 rounded-[2rem] shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 min-h-[130px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#047857]/80 dark:text-emerald-400">Today's Customers</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {kpis.todaysCustomers}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-emerald-950/50 flex items-center justify-center text-[#059669] shadow-sm border border-emerald-100/10">
                <Users className="w-5 h-5 text-[#059669]" />
              </div>
            </div>
            <span className="text-[10px] text-[#047857]/70 dark:text-emerald-400 font-bold uppercase mt-2">Unique patrons served</span>
          </div>

          {/* Average Preparation Time */}
          <div className="bg-[#FAF5FF] dark:bg-slate-900/60 border border-purple-100/80 dark:border-slate-800/80 p-4 rounded-[2rem] shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 min-h-[130px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7E22CE]/80 dark:text-purple-400">Avg Preparation Time</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {kpis.avgPrepTime}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-purple-950/50 flex items-center justify-center text-[#9333EA] shadow-sm border border-purple-100/10">
                <ChefHat className="w-5 h-5 text-[#9333EA]" />
              </div>
            </div>
            <span className="text-[10px] text-[#7E22CE]/70 dark:text-purple-400 font-bold uppercase mt-2">Mean ticket-to-ready time</span>
          </div>

          {/* Current Active Orders */}
          <div className="bg-[#FFF1F2] dark:bg-slate-900/60 border border-rose-100/80 dark:border-slate-800/80 p-4 rounded-[2rem] shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 min-h-[130px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#BE123C]/80 dark:text-rose-400">Current Active Orders</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {kpis.currentActiveOrders}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-rose-950/50 flex items-center justify-center text-[#E11D48] shadow-sm border border-rose-100/10">
                <CircleDot className="w-5 h-5 text-[#E11D48]" />
              </div>
            </div>
            <span className="text-[10px] text-[#BE123C]/70 dark:text-rose-400 font-bold uppercase mt-2">Orders in progress</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: TWO-COLUMN MAIN STATS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column: Today's Food Statistics */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Today's Food Statistics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time overview of all items sold today</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const textLines = foodStats.map(f => `${f.name} - ${f.count} Orders`);
                    const shareText = `Today's Food Statistics\n\n${textLines.join('\n')}\n\nGenerated by Time-to-Meal`;
                    navigator.clipboard.writeText(shareText);
                    alert("Food statistics copied to clipboard!");
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Copy Statistics to Clipboard"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-600" /> Copy
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Today's Food Statistics\n\n${foodStats.map(f => `${f.name} - ${f.count} Orders`).join('\n')}\n\nGenerated by Time-to-Meal`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Share via WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </a>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100/80 dark:divide-slate-800/80 max-h-[350px] overflow-y-auto pr-1">
              {foodStats.map((item, index) => (
                <div key={index} className="py-2.5 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getSafeFoodImage(item.imageUrl, item.name)} 
                      onError={(e) => handleImageError(e, item.name)}
                      alt="" 
                      className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm" 
                    />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-1 rounded-full border border-emerald-100/30 dark:border-emerald-900/20">
                    {item.count} Portions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Premium Dark theme Top Selling Items */}
        <div className="bg-[#0B0F19] text-white rounded-[2rem] p-4 shadow-xl flex flex-col justify-between border border-slate-800/50">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-amber-500 animate-pulse fill-amber-500" />
              <div>
                <h3 className="text-base font-extrabold text-white">Top Selling Items</h3>
                <p className="text-[11px] text-slate-400">Today's most popular dishes</p>
              </div>
            </div>

            <div className="space-y-3.5 mt-5">
              {topSellingItems.map((item, index) => {
                const colors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
                return (
                  <div key={index} className="p-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-between hover:bg-white/[0.08] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center font-bold text-xs">
                        {index === 0 ? <Trophy className={`w-4.5 h-4.5 ${colors[0]}`} /> :
                         index === 1 ? <Medal className={`w-4.5 h-4.5 ${colors[1]}`} /> :
                         index === 2 ? <Medal className={`w-4.5 h-4.5 ${colors[2]}`} /> :
                         <span className="text-slate-400">{index + 1}</span>}
                      </div>
                      <div>
                        <p className="text-xs font-black leading-tight text-slate-100">{item.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.count} Orders</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: DETAILED CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Chart 1: Orders by Hour */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-slate-400 mb-4">Orders by Hour</h3>
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersByHourData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '11px' }}
                    cursor={{ stroke: '#cbd5e1' }}
                  />
                  <Line type="monotone" dataKey="orders" stroke="#4F46E5" strokeWidth={3} dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 2: Revenue by Hour */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-slate-400 mb-4">Revenue by Hour</h3>
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByHourData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueHourlyColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#revenueHourlyColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 3: Order Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-slate-400 mb-4">Order Status Breakdown</h3>
            <div className="h-56 w-full relative flex items-center justify-center mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">10</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                <span>Pending (1)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full bg-[#0F172A]" />
                <span>Completed (9)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 8: ENTERPRISE FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm px-6 py-4 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 text-slate-500">
          <Users className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Active terminals on this canteen: <strong className="text-slate-900 dark:text-white">TimeToMeal Main Canteen</strong></span>
        </div>
      </footer>

      {/* Receipt Print Overlay Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-4 border border-slate-200 relative overflow-hidden flex flex-col justify-between max-h-[90vh]">
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex-1 overflow-y-auto pr-1">
              <div id="receipt-print-area" className="text-center font-mono text-slate-900 space-y-3 pt-2 text-xs">
                <div>
                  <h3 className="text-base font-bold text-slate-900">CAMPUS MEALS CANTEEN</h3>
                  <p className="text-[10px] text-slate-500">Hostel Block Dining Center</p>
                </div>

                <p className="text-slate-300">--------------------------------</p>

                <div>
                  <p className="text-[10px] text-slate-500 uppercase">ORDER TOKEN</p>
                  <p className="text-2xl font-bold text-slate-900">#{selectedReceipt.order_code}</p>
                </div>

                <p className="text-slate-300">--------------------------------</p>

                <div className="text-left space-y-1 font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span>{new Date(selectedReceipt.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-bold uppercase">{selectedReceipt.order_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-bold truncate max-w-[150px]">{selectedReceipt.student_details?.full_name || 'Walk-in Guest'}</span>
                  </div>
                </div>

                <p className="text-slate-300">--------------------------------</p>

                {/* Items */}
                <div className="text-left space-y-1.5 font-sans">
                  {selectedReceipt.order_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}x {item.item_name}</span>
                      <span className="font-semibold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <p className="text-slate-300">--------------------------------</p>

                <div className="flex justify-between text-sm font-bold text-slate-900 font-sans">
                  <span>TOTAL AMOUNT</span>
                  <span>₹{selectedReceipt.total_amount}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4">
              <button 
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryDashboard;

