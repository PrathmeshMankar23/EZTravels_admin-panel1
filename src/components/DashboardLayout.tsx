'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');
    if (!token && pathname !== '/login') {
      router.push('/login');
      return;
    }
    setIsLoggedIn(!!token);
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsLoggedIn(false);
    setUser(null);
    router.push('/login');
  };

  if (!isLoggedIn && pathname !== '/login') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-1">
                {/* Page Title Removed */}
              </div>
              
              {/* User Actions */}
              <div className="flex items-center space-x-3">
                <span className="hidden sm:block text-sm text-gray-600">
                  {user?.name || 'Admin'}
                </span>
                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center px-3 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors duration-200"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
              
              {/* Mobile spacer for menu button */}
              <div className="lg:hidden w-10"></div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
