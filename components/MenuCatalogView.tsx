import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MenuItem, Order } from '../types';
import { getSafeFoodImage, handleImageError } from '../lib/imageUtils';
import { 
  Search, Plus, Minus, MoreVertical, Edit, Trash2, Copy, BarChart3, 
  X, Check, AlertTriangle, Filter, SlidersHorizontal, Sparkles, Image, CheckCircle2, 
  TrendingUp, Clock, Calendar, DollarSign, ShoppingBag, Eye, EyeOff, Flame,
  ChevronDown, Tag, Utensils, Coffee, Pizza, Moon, Sun, Layers, ChevronLeft
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ImageUpload } from './ImageUpload';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface MenuCatalogViewProps {
  menu: MenuItem[];
  orders: Order[];
  onUpdateMenu: (updatedMenu: MenuItem[]) => void;
  onBackToDashboard?: () => void;
}

const PRESET_IMAGES = [
  { name: 'Dosa', url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=400' },
  { name: 'Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400' },
  { name: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400' },
  { name: 'Coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400' },
  { name: 'Paneer', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400' },
  { name: 'Thali', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400' }
];

// Rich Business Food Categories
const CATEGORY_PRESETS = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅', desc: 'Idli, Dosa, Poha, Paratha (7 AM - 11 AM)', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'lunch', label: 'Lunch', icon: '🍲', desc: 'Meals, Thali, Rice Bowls (12 PM - 3 PM)', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  { id: 'dinner', label: 'Dinner', icon: '🌙', desc: 'Roti, Curry, Biryani (7 PM - 10 PM)', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'snacks', label: 'Snacks & Fast Food', icon: '🍕', desc: 'Samosa, Burgers, Rolls (All Day)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'milkshakes', label: 'Gourmet Milkshakes', icon: '🥤', desc: 'Rose Milk, Oreo, Chocolate & Vanilla Shakes', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  { id: 'beverage', label: 'Beverages', icon: '🧃', desc: 'Coffee, Tea, Fresh Juices, Drinks', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { id: 'dessert', label: 'Desserts & Sweets', icon: '🍨', desc: 'Ice Cream, Gulab Jamun, Pastries', color: 'bg-pink-50 text-pink-800 border-pink-200' },
  { id: 'combo', label: 'Combos & Thali', icon: '🍱', desc: 'Value Combo Packs & Executive Thali', color: 'bg-purple-50 text-purple-800 border-purple-200' },
];

const MenuCatalogView: React.FC<MenuCatalogViewProps> = ({ menu, orders, onUpdateMenu, onBackToDashboard }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Applied filters states
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState<string>('all');
  const [appliedDietFilter, setAppliedDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [appliedStockFilter, setAppliedStockFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [appliedSortBy, setAppliedSortBy] = useState<string>('newest');

  // Filter Panel visibility
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Draft filters states (for the Filter Panel)
  const [draftCategoryFilter, setDraftCategoryFilter] = useState<string>('all');
  const [draftDietFilter, setDraftDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [draftStockFilter, setDraftStockFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [draftSortBy, setDraftSortBy] = useState<string>('newest');

  // Sync draft states when panel is opened
  useEffect(() => {
    if (isFilterPanelOpen) {
      setDraftCategoryFilter(appliedCategoryFilter);
      setDraftDietFilter(appliedDietFilter);
      setDraftStockFilter(appliedStockFilter);
      setDraftSortBy(appliedSortBy);
    }
  }, [isFilterPanelOpen, appliedCategoryFilter, appliedDietFilter, appliedStockFilter, appliedSortBy]);

  // Menu item action dropdown state
  const [activeMenuDropdown, setActiveMenuDropdown] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [analyticsItem, setAnalyticsItem] = useState<MenuItem | null>(null);

  // Custom Category Selection States
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    item_name: '',
    price: 50,
    category: 'breakfast',
    availability: true,
    is_veg: true,
    stock_offline: 50,
    stock_online: 20,
    low_stock_threshold: 10,
    imageUrl: PRESET_IMAGES[0].url,
    description: ''
  });

  // Extract all unique categories present in the current menu
  const availableCategories = useMemo(() => {
    const defaultIds = CATEGORY_PRESETS.map(c => c.id);
    const existingFromMenu = menu.map(m => m.category).filter(Boolean);
    const combined = Array.from(new Set([...defaultIds, ...existingFromMenu]));
    return combined;
  }, [menu]);

  // Reset function to clear all search & filter criteria
  const handleResetFilters = () => {
    setSearchTerm('');
    setAppliedCategoryFilter('all');
    setAppliedDietFilter('all');
    setAppliedStockFilter('all');
    setAppliedSortBy('newest');

    setDraftCategoryFilter('all');
    setDraftDietFilter('all');
    setDraftStockFilter('all');
    setDraftSortBy('newest');
  };

  // Filtered & Sorted Menu Items
  const filteredMenu = useMemo(() => {
    // 1. Filter items matching criteria
    const items = menu.filter(item => {
      const matchesSearch = 
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = appliedCategoryFilter === 'all' || item.category === appliedCategoryFilter;
      
      const matchesDiet = 
        appliedDietFilter === 'all' ? true :
        appliedDietFilter === 'veg' ? item.is_veg === true :
        item.is_veg === false;

      const matchesStock = 
        appliedStockFilter === 'all' ? true :
        appliedStockFilter === 'available' ? item.stock_offline > (item.low_stock_threshold || 10) :
        appliedStockFilter === 'low' ? item.stock_offline <= (item.low_stock_threshold || 10) && item.stock_offline > 0 :
        item.stock_offline <= 0; // out of stock

      return matchesSearch && matchesCategory && matchesDiet && matchesStock;
    });

    // 2. Sort items by mapping each to its original array index to keep insertion order
    const itemsWithIndex = items.map((item, index) => ({ item, index }));

    itemsWithIndex.sort((a, b) => {
      switch (appliedSortBy) {
        case 'newest':
          return b.index - a.index;
        case 'oldest':
          return a.index - b.index;
        case 'name-az':
          return a.item.item_name.localeCompare(b.item.item_name);
        case 'name-za':
          return b.item.item_name.localeCompare(a.item.item_name);
        case 'price-high':
          return b.item.price - a.item.price;
        case 'price-low':
          return a.item.price - b.item.price;
        default:
          return 0;
      }
    });

    return itemsWithIndex.map(x => x.item);
  }, [menu, searchTerm, appliedCategoryFilter, appliedDietFilter, appliedStockFilter, appliedSortBy]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      item_name: '',
      price: 50,
      category: 'breakfast',
      availability: true,
      is_veg: true,
      stock_offline: 50,
      stock_online: 20,
      low_stock_threshold: 10,
      imageUrl: PRESET_IMAGES[0].url,
      description: ''
    });
    setIsCategoryPickerOpen(false);
    setIsAddingCustomCategory(false);
    setCustomCategoryInput('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsCategoryPickerOpen(false);
    setIsAddingCustomCategory(false);
    setCustomCategoryInput('');
    setIsModalOpen(true);
    setActiveMenuDropdown(null);
  };

  // Duplicate Item
  const handleDuplicateItem = (item: MenuItem) => {
    const newItem: MenuItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 10),
      item_name: `${item.item_name} (Copy)`
    };
    onUpdateMenu([...menu, newItem]);
    setActiveMenuDropdown(null);
  };

  // Delete Item
  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = menu.find(m => m.id === itemId);
    if (confirm('Are you sure you want to delete this dish from the catalog?')) {
      if (itemToDelete?.cloudinary_public_id) {
        fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_id: itemToDelete.cloudinary_public_id })
        }).catch(err => console.error('Silent Cloudinary delete error:', err));
      }

      onUpdateMenu(menu.filter(m => m.id !== itemId));

      if (isSupabaseConfigured) {
        supabase
          .from('menu_items')
          .delete()
          .eq('id', itemId)
          .then(({ error }) => {
            if (error) console.error('Error deleting menu item from Supabase:', error);
          });
      }
    }
    setActiveMenuDropdown(null);
  };

  // Toggle Daily Availability
  const handleToggleDailyAvailability = (itemId: string) => {
    const updated = menu.map(m => {
      if (m.id === itemId) {
        return { ...m, availability: !m.availability };
      }
      return m;
    });
    onUpdateMenu(updated);
  };

  // Adjust Stock Quantity (+ or -)
  const handleAdjustStock = (itemId: string, delta: number) => {
    const updated = menu.map(m => {
      if (m.id === itemId) {
        const newStock = Math.max(0, (m.stock_offline || 0) + delta);
        return { 
          ...m, 
          stock_offline: newStock,
          availability: newStock === 0 ? false : m.availability 
        };
      }
      return m;
    });
    onUpdateMenu(updated);
  };

  // Save Dish (Add or Edit)
  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_name || !formData.price) return;

    const finalCategory = isAddingCustomCategory && customCategoryInput.trim()
      ? customCategoryInput.trim().toLowerCase()
      : (formData.category || 'breakfast');

    const imageUrlToSave = formData.imageUrl || formData.image_url || '';
    const publicIdToSave = formData.cloudinary_public_id || '';

    const updatedFormData = {
      ...formData,
      category: finalCategory as any,
      imageUrl: imageUrlToSave,
      image_url: imageUrlToSave,
      cloudinary_public_id: publicIdToSave
    };

    if (editingItem) {
      // Delete old image if replaced
      if (editingItem.cloudinary_public_id && editingItem.cloudinary_public_id !== publicIdToSave) {
        fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_id: editingItem.cloudinary_public_id })
        }).catch(err => console.error('Failed to delete replaced image from Cloudinary:', err));
      }

      // Edit existing
      const updated = menu.map(m => m.id === editingItem.id ? { ...m, ...updatedFormData } as MenuItem : m);
      onUpdateMenu(updated);

      if (isSupabaseConfigured) {
        supabase
          .from('menu_items')
          .update({
            item_name: updatedFormData.item_name,
            price: updatedFormData.price,
            category: updatedFormData.category,
            availability: updatedFormData.availability,
            is_veg: updatedFormData.is_veg,
            stock_offline: updatedFormData.stock_offline,
            stock_online: updatedFormData.stock_online,
            low_stock_threshold: updatedFormData.low_stock_threshold,
            description: updatedFormData.description,
            image_url: imageUrlToSave,
            cloudinary_public_id: publicIdToSave
          })
          .eq('id', editingItem.id)
          .then(({ error }) => {
            if (error) console.error('Error syncing edited dish to Supabase:', error);
          });
      }
    } else {
      // Create new
      const newId = Math.random().toString(36).substring(2, 10);
      const newItem: MenuItem = {
        ...updatedFormData,
        id: newId,
        canteen_id: 'c1',
        availability: (formData.stock_offline || 0) > 0 ? (formData.availability ?? true) : false
      } as MenuItem;
      onUpdateMenu([...menu, newItem]);

      if (isSupabaseConfigured) {
        supabase
          .from('menu_items')
          .insert({
            id: newId,
            canteen_id: 'c1',
            item_name: updatedFormData.item_name,
            price: updatedFormData.price,
            category: updatedFormData.category,
            availability: updatedFormData.availability,
            is_veg: updatedFormData.is_veg,
            stock_offline: updatedFormData.stock_offline,
            stock_online: updatedFormData.stock_online,
            low_stock_threshold: updatedFormData.low_stock_threshold,
            description: updatedFormData.description,
            image_url: imageUrlToSave,
            cloudinary_public_id: publicIdToSave
          })
          .then(({ error }) => {
            if (error) console.error('Error syncing new dish to Supabase:', error);
          });
      }
    }

    setIsModalOpen(false);
  };

  // Select category helper
  const handleSelectCategory = (catId: string) => {
    setFormData(prev => ({ ...prev, category: catId as any }));
    setIsCategoryPickerOpen(false);
    setIsAddingCustomCategory(false);
  };

  // Analytics Computation for selected dish
  const analyticsData = useMemo(() => {
    if (!analyticsItem) return null;

    let totalQuantity = 0;
    let totalRevenue = 0;
    let todayQuantity = 0;
    let todayRevenue = 0;
    let weeklyQuantity = 0;
    let weeklyRevenue = 0;
    let monthlyQuantity = 0;
    let monthlyRevenue = 0;
    let lastOrderedDate: string | null = null;

    const now = new Date();
    const todayStr = now.toDateString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const chartMap: { [key: string]: { day: string; sales: number; revenue: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayLabel = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      chartMap[d.toDateString()] = { day: dayLabel, sales: 0, revenue: 0 };
    }

    orders.forEach(order => {
      if (order.order_status === 'cancelled') return;
      const orderDate = new Date(order.created_at);

      order.order_items?.forEach(item => {
        if (item.menu_item_id === analyticsItem.id || item.item_name === analyticsItem.item_name) {
          totalQuantity += item.quantity;
          const itemRev = item.price * item.quantity;
          totalRevenue += itemRev;

          if (!lastOrderedDate || orderDate > new Date(lastOrderedDate)) {
            lastOrderedDate = order.created_at;
          }

          if (orderDate.toDateString() === todayStr) {
            todayQuantity += item.quantity;
            todayRevenue += itemRev;
          }

          if (orderDate >= sevenDaysAgo) {
            weeklyQuantity += item.quantity;
            weeklyRevenue += itemRev;
          }

          if (orderDate >= thirtyDaysAgo) {
            monthlyQuantity += item.quantity;
            monthlyRevenue += itemRev;
          }

          const key = orderDate.toDateString();
          if (chartMap[key]) {
            chartMap[key].sales += item.quantity;
            chartMap[key].revenue += itemRev;
          }
        }
      });
    });

    const chartData = Object.values(chartMap);
    const avgOrdersPerDay = (weeklyQuantity / 7).toFixed(1);

    return {
      totalQuantity,
      totalRevenue,
      todayQuantity,
      todayRevenue,
      weeklyQuantity,
      weeklyRevenue,
      monthlyQuantity,
      monthlyRevenue,
      avgOrdersPerDay,
      lastOrderedDate,
      bestSellingSlot: 'Lunch (12:00 PM - 2:00 PM)',
      chartData
    };
  }, [analyticsItem, orders]);

  // Current selected category object
  const selectedCategoryObj = CATEGORY_PRESETS.find(c => c.id === formData.category) || {
    id: formData.category || 'custom',
    label: (formData.category || 'custom').toUpperCase(),
    icon: '🍽️',
    desc: 'Custom Canteen Specialty',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  };

  if (analyticsItem && analyticsData) {
    return (
      <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-4 shadow-sm animate-in fade-in duration-200">
        
        {/* Top Header with Back button & Food Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => {
              setAnalyticsItem(null);
            }}
            className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 w-fit"
          >
            <ChevronLeft className="w-4 h-4" /> ← Back
          </button>

          <div className="flex items-center gap-3">
            <img 
              src={getSafeFoodImage(analyticsItem.imageUrl || analyticsItem.image_url, analyticsItem.item_name)} 
              onError={(e) => handleImageError(e, analyticsItem.item_name)}
              alt="" 
              className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">{analyticsItem.item_name}</h2>
                <span className="text-xs font-bold text-emerald-600">₹{analyticsItem.price}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Product Performance & Sales Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Key Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Total Orders</span>
            <span className="text-lg font-extrabold text-emerald-900 mt-1 block">{analyticsData.totalQuantity} Pcs</span>
          </div>

          <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-lg font-extrabold text-blue-900 mt-1 block">₹{analyticsData.totalRevenue.toFixed(2)}</span>
          </div>

          <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-3">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Avg/Day</span>
            <span className="text-lg font-extrabold text-amber-900 mt-1 block">{analyticsData.avgOrdersPerDay} Orders</span>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Weekly Sales</span>
            <span className="text-lg font-extrabold text-slate-900 mt-1 block">₹{analyticsData.weeklyRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              7-Day Sales Trend
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">Revenue (₹)</span>
          </div>

          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${val}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Analytics Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium block">Best Selling Period</span>
            <span className="font-bold text-slate-800">{analyticsData.bestSellingSlot}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium block">Last Ordered Date</span>
            <span className="font-bold text-slate-800">
              {analyticsData.lastOrderedDate 
                ? new Date(analyticsData.lastOrderedDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                : 'No recent orders'}
            </span>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100">
      
      {/* 2. Sticky Search, Filter & Add Dish Toolbar */}
      <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-slate-200/50 dark:border-slate-800/60 transition-all">
        <div className="flex flex-row items-center gap-2 w-full">
          {/* Search Bar - Flex grows to fill available space */}
          <div className="flex-1 min-w-0 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search food..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-xs"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(true)}
            className="flex-none px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-xs relative"
          >
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {(appliedCategoryFilter !== 'all' || appliedDietFilter !== 'all' || appliedStockFilter !== 'all' || appliedSortBy !== 'newest') && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Add Dish Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex-none px-3 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Panel Modal Overlay (Bottom sheet on Mobile, Centered Modal on Desktop) */}
      {isFilterPanelOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop Click triggers close */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsFilterPanelOpen(false)} />
          
          <div className="relative bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                Filter & Sort Menu
              </h3>
              <button 
                type="button"
                onClick={() => setIsFilterPanelOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Food Type Option */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Food Type
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDraftDietFilter('all')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      draftDietFilter === 'all' 
                        ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftDietFilter('veg')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      draftDietFilter === 'veg' 
                        ? 'bg-white dark:bg-slate-850 text-emerald-600 dark:text-emerald-400 shadow-2xs' 
                        : 'text-slate-500 hover:text-emerald-600'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftDietFilter('non-veg')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      draftDietFilter === 'non-veg' 
                        ? 'bg-white dark:bg-slate-850 text-red-600 dark:text-red-400 shadow-2xs' 
                        : 'text-slate-500 hover:text-red-600'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Non-Veg
                  </button>
                </div>
              </div>

              {/* Category Dropdown Option */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={draftCategoryFilter}
                    onChange={e => setDraftCategoryFilter(e.target.value)}
                    className="w-full py-2.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 cursor-pointer appearance-none"
                  >
                    <option value="all">🍽️ All Categories</option>
                    {availableCategories.map(cat => {
                      const preset = CATEGORY_PRESETS.find(p => p.id === cat);
                      const icon = preset ? preset.icon : '🍴';
                      const label = preset ? preset.label : cat.charAt(0).toUpperCase() + cat.slice(1);
                      return (
                        <option key={cat} value={cat}>
                          {icon} {label}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Stock Status Option */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Stock Status
                </label>
                <div className="relative">
                  <select
                    value={draftStockFilter}
                    onChange={e => setDraftStockFilter(e.target.value as any)}
                    className="w-full py-2.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 cursor-pointer appearance-none"
                  >
                    <option value="all">📦 All Stock Status</option>
                    <option value="available">🟢 Available</option>
                    <option value="low">🟡 Low Stock</option>
                    <option value="out">🔴 Out of Stock</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Sort By Dropdown Option */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={draftSortBy}
                    onChange={e => setDraftSortBy(e.target.value)}
                    className="w-full py-2.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 cursor-pointer appearance-none"
                  >
                    <option value="newest">📅 Newest First</option>
                    <option value="oldest">📅 Oldest First</option>
                    <option value="name-az">🔤 Name (A-Z)</option>
                    <option value="name-za">🔤 Name (Z-A)</option>
                    <option value="price-high">💰 Highest Price</option>
                    <option value="price-low">💰 Lowest Price</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Filter Panel Footer Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setIsFilterPanelOpen(false);
                }}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppliedCategoryFilter(draftCategoryFilter);
                  setAppliedDietFilter(draftDietFilter);
                  setAppliedStockFilter(draftStockFilter);
                  setAppliedSortBy(draftSortBy);
                  setIsFilterPanelOpen(false);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-md shadow-emerald-600/10"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Menu Card Grid (Desktop: 4, Tablet: 3, Mobile: 2) */}
      {filteredMenu.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 space-y-4 shadow-sm">
          <div className="text-4xl animate-bounce">🍽️</div>
          <h3 className="text-base font-extrabold text-slate-750 dark:text-slate-300">No menu items found.</h3>
          <p className="text-xs text-slate-400 dark:text-slate-550 max-w-xs mx-auto leading-relaxed">
            Try changing your filters or add a new menu item.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMenu.map(item => {
            const isOutOfStock = (item.stock_offline || 0) <= 0;
            const isLowStock = !isOutOfStock && (item.stock_offline || 0) <= (item.low_stock_threshold || 10);
            const isVeg = item.is_veg !== false;
            const isTodayAvailable = item.availability && !isOutOfStock;

            const categoryPreset = CATEGORY_PRESETS.find(c => c.id === item.category);

            return (
              <div 
                key={item.id} 
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-3 shadow-2xs flex flex-col justify-between transition-all relative group ${
                  isOutOfStock 
                    ? 'border-red-150 dark:border-red-950/40 bg-red-50/5 dark:bg-red-950/5' 
                    : 'border-slate-150 dark:border-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-md'
                }`}
              >
                {/* Food Image */}
                <div className="w-full h-28 sm:h-32 bg-slate-100 dark:bg-slate-850 rounded-xl overflow-hidden relative mb-2.5 shrink-0">
                  <img 
                    src={getSafeFoodImage(item.imageUrl || item.image_url, item.item_name)} 
                    onError={(e) => handleImageError(e, item.item_name)}
                    alt={item.item_name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />

                  {/* Veg / Non-Veg Badge */}
                  <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white shadow-xs ${
                    isVeg ? 'bg-emerald-600' : 'bg-red-600'
                  }`}>
                    {isVeg ? 'Veg' : 'Non-Veg'}
                  </span>

                  {/* Category Badge */}
                  <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-xs bg-slate-900/80 backdrop-blur-xs text-white`}>
                    <span>{categoryPreset ? categoryPreset.icon : '🍽️'}</span>
                    <span>{item.category}</span>
                  </span>

                  {/* Overlays / Badges */}
                  {isOutOfStock ? (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-red-600 text-white px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider shadow-sm">
                        Out of Stock
                      </span>
                    </div>
                  ) : isLowStock ? (
                    <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black flex items-center gap-0.5 shadow-xs">
                      <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                    </span>
                  ) : null}
                </div>

                {/* Content Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Food Name, Price & Three-Dot Menu */}
                    <div className="flex items-start justify-between gap-1 mb-1 relative">
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1 leading-snug" title={item.item_name}>
                          {item.item_name}
                        </h3>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs sm:text-sm shrink-0">
                          ₹{item.price}
                        </span>
                      </div>

                      {/* Three-Dot Action Menu */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuDropdown(activeMenuDropdown === item.id ? null : item.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          title="Dish Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Popup */}
                        {activeMenuDropdown === item.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-30" 
                              onClick={() => setActiveMenuDropdown(null)} 
                            />
                            <div className="absolute right-0 top-7 z-40 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 w-32 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5 text-emerald-600" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(item)}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                              >
                                <Copy className="w-3.5 h-3.5 text-blue-600" /> Copy
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuDropdown(null);
                                  setAnalyticsItem(item);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <BarChart3 className="w-3.5 h-3.5 text-amber-600" /> Analytics
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-550 line-clamp-1 mb-2">
                        {item.description}
                      </p>
                    )}

                    {/* Stock Status Badge & Quantity Available */}
                    <div className="flex items-center justify-between gap-2 py-1 flex-wrap">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
                          <span className="w-1 h-1 rounded-full bg-red-500" /> Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
                          <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" /> Available
                        </span>
                      )}

                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Qty: <span className="font-extrabold text-slate-800 dark:text-slate-200">{item.stock_offline} Pcs</span>
                      </span>
                    </div>
                  </div>

                  {/* Interactive controls */}
                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    
                    {/* Toggle Availability Switch */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        {isTodayAvailable ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                        Daily Menu
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleDailyAvailability(item.id)}
                        disabled={isOutOfStock}
                        className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          item.availability ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                        } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            item.availability ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Stock Adjustment Controls: [-] 25 [+] */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Adjust Stock
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(item.id, -1)}
                          disabled={(item.stock_offline || 0) <= 0}
                          className="w-6 h-6 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 flex items-center justify-center font-black text-xs rounded-lg shadow-2xs cursor-pointer active:scale-95 transition-all"
                          title="Decrement stock (stock--)"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-xs font-black text-slate-900 dark:text-white min-w-[20px] text-center">
                          {item.stock_offline || 0}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAdjustStock(item.id, 1)}
                          className="w-6 h-6 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center font-black text-xs rounded-lg shadow-2xs cursor-pointer active:scale-95 transition-all"
                          title="Increment stock (stock++)"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT DISH MODAL WITH ELEGANT CUSTOM CATEGORY SELECTOR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-b-none rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 ease-out pb-safe">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {editingItem ? 'Edit Product Details' : 'Add New Dish to Menu'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4 text-xs font-medium">
              
              {/* Dish Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Dish Name *</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. Special Masala Dosa</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={formData.item_name || ''}
                  onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="80"
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={formData.stock_offline ?? 50}
                    onChange={e => setFormData({ ...formData, stock_offline: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              {/* RICH BUSINESS CATEGORY DROPDOWN & SELECTOR */}
              <div className="space-y-1.5 relative">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    Food Category *
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Business Meal Timing</span>
                </label>

                {/* Custom Interactive Category Trigger Button */}
                {!isAddingCustomCategory ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-emerald-500 focus:outline-none transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                          {selectedCategoryObj.icon}
                        </span>
                        <div className="text-left">
                          <span className="font-bold text-slate-900 block text-xs">
                            {selectedCategoryObj.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {selectedCategoryObj.desc}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform duration-200 ${
                        isCategoryPickerOpen ? 'rotate-180 text-emerald-600' : ''
                      }`} />
                    </button>

                    {/* Quick Category Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {CATEGORY_PRESETS.slice(0, 5).map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectCategory(preset.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer whitespace-nowrap ${
                            formData.category === preset.id 
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{preset.icon}</span>
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Dropdown Menu Popup */}
                    {isCategoryPickerOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-64 overflow-y-auto">
                        <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Select Food Category
                        </div>
                        {CATEGORY_PRESETS.map(preset => {
                          const isSelected = formData.category === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectCategory(preset.id)}
                              className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold' 
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-base">{preset.icon}</span>
                                <div>
                                  <span className="text-xs font-bold block">{preset.label}</span>
                                  <span className="text-[10px] text-slate-400 block">{preset.desc}</span>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })}

                        {/* Custom Category Option */}
                        <div className="border-t border-slate-100 pt-1 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCustomCategory(true);
                              setIsCategoryPickerOpen(false);
                            }}
                            className="w-full p-2 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> + Create Custom Category
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Custom Category Input Box */
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800">Enter Custom Category Name</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomCategory(false)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800"
                      >
                        Cancel & Pick Preset
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Juices, South Indian, Sweets"
                      value={customCategoryInput}
                      onChange={e => setCustomCategoryInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Diet Type Switch */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Diet Type</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_veg: true })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.is_veg !== false ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Vegetarian
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_veg: false })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.is_veg === false ? 'bg-white text-red-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Non-Vegetarian
                  </button>
                </div>
              </div>

              {/* Product Image (Secure Cloudinary Upload with presets) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Product Image *</label>
                <ImageUpload
                  value={formData.imageUrl || formData.image_url}
                  publicId={formData.cloudinary_public_id}
                  onChange={(url, publicId, metadata) => {
                    setFormData({
                      ...formData,
                      imageUrl: url,
                      image_url: url,
                      image_public_id: publicId,
                      image_secure_url: url,
                      image_width: metadata?.image_width,
                      image_height: metadata?.image_height,
                      image_format: metadata?.image_format,
                      image_bytes: metadata?.image_bytes,
                      cloudinary_public_id: publicId
                    });
                  }}
                  onRemove={() => {
                    setFormData({
                      ...formData,
                      imageUrl: '',
                      image_url: '',
                      image_public_id: '',
                      image_secure_url: '',
                      image_width: undefined,
                      image_height: undefined,
                      image_format: undefined,
                      image_bytes: undefined,
                      cloudinary_public_id: ''
                    });
                  }}
                  folder="timetomeal/meals"
                />

                {/* Presets Gallery */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">Or select a preset image:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {PRESET_IMAGES.map((preset, idx) => {
                      const isSelected = (formData.imageUrl === preset.url || formData.image_url === preset.url);
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setFormData({ 
                            ...formData, 
                            imageUrl: preset.url,
                            image_url: preset.url,
                            cloudinary_public_id: '' 
                          })}
                          className={`p-1 border rounded-xl shrink-0 transition-all cursor-pointer ${
                            isSelected ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-10 h-10 object-cover rounded-lg" />
                          <span className="text-[9px] font-bold block text-center text-slate-600 mt-0.5">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Product Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description, ingredients, portion size..."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              {/* Daily Availability Checkbox */}
              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="availability_cb"
                  checked={formData.availability !== false}
                  onChange={e => setFormData({ ...formData, availability: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="availability_cb" className="font-bold text-slate-800 cursor-pointer">
                  Available in Today's Canteen Menu
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MenuCatalogView;
