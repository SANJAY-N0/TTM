
import React, { useState, useEffect, useCallback } from 'react';
import { User, Order, AppRole, MenuItem, StudentProfile, CanteenProfile, AdminProfile } from './types';
import Login from './components/Login';
import StudentView from './components/StudentView';
import StaffView from './components/StaffView';
import AdminView from './components/AdminView';
import AutoSleepOverlay from './components/AutoSleepOverlay';
import { Coffee, Shield, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isOnlineStatus, setIsOnlineStatus] = useState<boolean>(() => {
    const saved = localStorage.getItem('hb_canteen_online');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleUpdateOnlineStatus = useCallback((status: boolean) => {
    setIsOnlineStatus(status);
    localStorage.setItem('hb_canteen_online', JSON.stringify(status));
  }, []);

  // Initialize Data from LocalStorage or Constants
  useEffect(() => {
    const savedOrders = localStorage.getItem('hb_orders');
    const savedMenu = localStorage.getItem('hb_menu');
    const savedUser = localStorage.getItem('hb_current_user');

    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedMenu) {
      try {
        setMenu(JSON.parse(savedMenu));
      } catch (e) {
        setMenu([]);
      }
    } else {
      setMenu([]);
    }

    if (savedUser) setUser(JSON.parse(savedUser));
    
    setLoading(false);
  }, []);

  // Persistence side effects
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('hb_orders', JSON.stringify(orders));
      localStorage.setItem('hb_menu', JSON.stringify(menu));
      if (user) localStorage.setItem('hb_current_user', JSON.stringify(user));
      else localStorage.removeItem('hb_current_user');
    }
  }, [orders, menu, user, loading]);

  const updateOrders = useCallback((newOrders: Order[]) => {
    // Check if a new order was added (orders array length increased)
    if (newOrders.length > orders.length) {
      // Find the newly added orders (usually at index 0)
      const newOrderIds = new Set(orders.map(o => o.id));
      const newlyAdded = newOrders.filter(o => !newOrderIds.has(o.id));
      
      if (newlyAdded.length > 0) {
        setMenu(currentMenu => {
          const updatedMenu = [...currentMenu];
          let menuChanged = false;
          
          newlyAdded.forEach(newOrder => {
            // Reduce stock when a new order is added
            newOrder.order_items.forEach(item => {
                const menuIndex = updatedMenu.findIndex(m => m.id === item.menu_item_id || m.id === (item as any).item_id);
                if (menuIndex >= 0) {
                  const menuItem = updatedMenu[menuIndex];
                  updatedMenu[menuIndex] = {
                    ...menuItem,
                    stock_offline: typeof menuItem.stock_offline === 'number' ? Math.max(0, menuItem.stock_offline - item.quantity) : 0,
                    stock_online: typeof menuItem.stock_online === 'number' ? Math.max(0, menuItem.stock_online - item.quantity) : 0
                  };
                  menuChanged = true;
                }
              });
          });
          
          return menuChanged ? updatedMenu : currentMenu;
        });
      }
    }
    setOrders(newOrders);
  }, [orders]);

  const updateMenu = useCallback((newMenu: MenuItem[]) => {
    setMenu(newMenu);
  }, []);

  const handleUpdateProfile = (profile: any) => {
    if (!user) return;
    const updatedUser = { ...user, profile: { ...user.profile, ...profile } };
    setUser(updatedUser as User);
    
    // Update users in "database" (localStorage simulated)
    const allUsers = JSON.parse(localStorage.getItem('hb_users') || '[]');
    const userIndex = allUsers.findIndex((u: any) => u.id === user.id);
    if (userIndex > -1) {
      allUsers[userIndex] = updatedUser;
      localStorage.setItem('hb_users', JSON.stringify(allUsers));
    }
  };

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    setUser(null);
    localStorage.removeItem('hb_current_user');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="animate-bounce bg-emerald-600 p-5 rounded-3xl shadow-2xl">
        <Coffee className="text-white w-10 h-10" />
      </div>
    </div>
  );

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Kiosk Auto Sleep Mode Overlay */}
      <AutoSleepOverlay />

      <main className="mx-auto">
        {user.role === 'student' && (
          <StudentView 
            user={user} 
            orders={orders} 
            menu={menu} 
            onUpdateOrders={updateOrders} 
            onLogout={handleLogoutRequest} 
            onUpdateProfile={handleUpdateProfile} 
            isCanteenOnline={isOnlineStatus}
          />
        )}

        {user.role === 'staff' && (
          <StaffView 
            user={user} 
            orders={orders} 
            menu={menu} 
            onUpdateOrders={updateOrders} 
            onUpdateMenu={updateMenu} 
            onLogout={handleLogoutRequest}
            isOnlineStatus={isOnlineStatus}
            onUpdateOnlineStatus={handleUpdateOnlineStatus}
          />
        )}

        {user.role === 'admin' && (
          <AdminView 
            user={user} 
            orders={orders} 
            menu={menu} 
            onUpdateOrders={updateOrders} 
            onLogout={handleLogoutRequest}
          />
        )}
      </main>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800 space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Confirm Logout</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to log out of your session? You will need to log back in to access your account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
      <AutoSleepOverlay />
    </div>
  );
};

export default App;
