'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Grid3x3,
  Menu,
  X,
  Star
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/destinations',
      label: 'Destinations',
      icon: MapPin
    },
    {
      path: '/categories',
      label: 'Categories',
      icon: Grid3x3
    },
    {
      path: '/reviews',
      label: 'Reviews',
      icon: Star
    }
  ];

  const handleNavClick = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
      `}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => router.push('/')}
            className="text-xl font-bold text-blue-600 hover:text-blue-800"
          >
            Easy Travels
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`
                  w-full flex items-center px-4 py-3 text-base font-semibold rounded-lg transition-colors duration-200
                  ${pathname === item.path
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Section - At absolute bottom */}
        <div className="border-t border-gray-200 p-4 mt-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-200 cursor-pointer">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Admin User
                </p>
                <p className="text-xs text-gray-500 truncate">
                  admin@easytravels.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md bg-white shadow-md border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}
