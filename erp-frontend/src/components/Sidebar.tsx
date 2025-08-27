import React from 'react';
import { 
  Home, Users, Package, TrendingUp, 
  Settings, Bell, ChevronRight, User, 
  Calendar, Activity, BarChart, PieChart,
  ShoppingCart, Truck, Warehouse, FileText,
  CreditCard, Target, Award, Zap, Layers,
  Clock, Database, Shield, HelpCircle, IndianRupee
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import SidebarItem from './SidebarItem';

const Sidebar: React.FC = () => {
  const { 
    isOpen, 
    close 
  } = useSidebar();
  
  const { user } = useAuth();

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      path: '/', 
      icon: <Home className="w-5 h-5" />, 
      description: 'Overview and analytics',
      badge: '4',
      badgeVariant: 'primary' as const
    },
    { 
      id: 'sales', 
      label: 'Sales', 
      path: '/sales', 
      icon: <IndianRupee className="w-5 h-5" />,
      description: 'Revenue and sales tracking',
      badge: 'New',
      badgeVariant: 'success' as const
    },
    { 
      id: 'customers', 
      label: 'Customers', 
      path: '/customers', 
      icon: <Users className="w-5 h-5" />,
      description: 'Customer management'
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      path: '/inventory', 
      icon: <Package className="w-5 h-5" />,
      description: 'Stock and warehouse management',
      badge: '12',
      badgeVariant: 'warning' as const
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      path: '/orders', 
      icon: <ShoppingCart className="w-5 h-5" />,
      description: 'Order processing and fulfillment',
      badge: '3',
      badgeVariant: 'danger' as const
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      path: '/analytics', 
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Business intelligence and reporting'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      path: '/settings', 
      icon: <Settings className="w-5 h-5" />,
      description: 'System configuration'
    }
  ];

  const quickAccessItems = [
    { 
      id: 'notifications', 
      label: 'Notifications', 
      path: '/notifications', 
      icon: <Bell className="w-5 h-5" />,
      badge: '7',
      badgeVariant: 'info' as const
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      path: '/profile', 
      icon: <User className="w-5 h-5" />
    }
    // Search option removed as requested
  ];

  return (
    <>
      {/* 🌟 Professional Drawer Overlay - Backdrop when drawer is open */}
      <div className={`drawer-overlay ${isOpen ? 'visible' : ''}`} onClick={close} />
      
      {/* 🎯 PROFESSIONAL SLIDE-OUT DRAWER - Hidden by default, slides in from left */}
      <aside 
        className={`
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
          flex flex-col shadow-2xl shadow-black/10
          ${isOpen ? 'drawer-open' : ''}
          backdrop-blur-xl bg-white/95 dark:bg-gray-900/95
        `}
        role="navigation"
        aria-label="Main navigation"
        aria-expanded={isOpen}
      >
        {/* 📱 Header Section with Close Button */}
        <div className={`
          flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20
        `}>
          {/* Drawer Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ERP System
            </h1>
          </div>
          
          {/* Close Button */}
          <button
            onClick={close}
            className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/50 dark:hover:to-red-700/50 transition-all duration-300 ease-out transform hover:scale-105 shadow-lg shadow-gray-400/25 dark:shadow-gray-800/25 focus:outline-none focus:ring-2 focus:ring-red-500/50 group"
            aria-label="Close drawer"
            title="Close drawer"
          >
            <ChevronRight 
              className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-all duration-300 ease-out group-hover:text-red-600 dark:group-hover:text-red-400 rotate-180"
            />
          </button>
        </div>

        {/* 🌐 Navigation Content - Scrollable Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 📊 Main Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
            <div className="p-2 space-y-1">
              {/* 🎯 Main Menu Section */}
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Main Menu
                </h3>
              </div>
              
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  {...item}
                  onClick={() => close()}
                />
              ))}

              {/* ⚡ Quick Access Section */}
              <div className="px-3 py-2 mt-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quick Access
                </h3>
              </div>
              
              {quickAccessItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  {...item}
                  onClick={() => close()}
                />
              ))}
            </div>
          </nav>

          {/* 👤 User Profile Section */}
          <div className={`
            p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50
            px-4
          `}>
            <div className="flex items-center space-x-3 animate-in slide-in-from-bottom duration-300">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-lg animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name || 'Sign In'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email ? user.email : 'No user logged in'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              </div>
            </div>
          </div>
        </div>

        {/* ✨ Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-white/5 pointer-events-none"></div>
      </aside>
    </>
  );
};

export default Sidebar;
