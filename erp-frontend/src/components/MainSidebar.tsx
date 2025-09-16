import React from 'react';
import { 
  Home, Users, Package, TrendingUp, 
  Settings, ChevronRight, User, 
  BarChart, ShoppingCart, Truck, Warehouse,
  CreditCard, Layers, IndianRupee
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import SidebarItem from './SidebarItem';

const MainSidebar: React.FC = () => {
  const { isOpen, close } = useSidebar();
  const { user } = useAuth();

  let menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      path: '/', 
      icon: <Home className="w-5 h-5" />, 
      description: 'Overview and analytics'
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
      description: 'Stock management'
    },
    { 
      id: 'count-product-overview', 
      label: 'Count/Product Overview', 
      path: '/count-product-overview', 
      icon: <BarChart className="w-5 h-5" />,
      description: 'Count product tracking'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      path: '/settings', 
      icon: <Settings className="w-5 h-5" />,
      description: 'Configuration'
    }
  ];

  // Role-based filtering: hide Count/Product Overview for manager
  const role = user?.role?.toLowerCase();
  if (role === 'manager') {
    menuItems = menuItems.filter(item => item.id !== 'count-product-overview');
  }

  return (
    <>
      {/* Drawer Overlay */}
      <div className={`drawer-overlay ${isOpen ? 'visible' : ''}`} onClick={close} />
      
      {/* Slide-out Drawer */}
      <aside 
        className={`
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
          flex flex-col shadow-2xl
          ${isOpen ? 'drawer-open' : ''}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-blue-600">ERP System</h1>
          </div>
          
          <button onClick={close} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                {...item}
                onClick={() => close()}
              />
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default MainSidebar;
