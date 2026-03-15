'use client';



import { useRouter, usePathname } from 'next/navigation';

import { useEffect, useState } from 'react';



export default function Navigation() {

  const router = useRouter();

  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [user, setUser] = useState<any>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



  useEffect(() => {

    const token = localStorage.getItem('adminToken');

    const userData = localStorage.getItem('adminUser');

    if (token && userData) {

      setIsLoggedIn(true);

      setUser(JSON.parse(userData));

    }

  }, []);



  const handleLogout = () => {

    localStorage.removeItem('adminToken');

    localStorage.removeItem('adminUser');

    setIsLoggedIn(false);

    setUser(null);

    setMobileMenuOpen(false);

    router.push('/login');

  };



  if (!isLoggedIn || pathname === '/login') {

    return null;

  }



  const navItems = [

    { path: '/dashboard', label: 'Dashboard' },

    { path: '/destinations', label: 'Destinations' },

    { path: '/categories', label: 'Categories' }

  ];



  const handleNavClick = (path: string) => {

    router.push(path);

    setMobileMenuOpen(false);

  };



  return (

    <>

      <nav className="card border-b border-secondary">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between h-16">

            <div className="flex items-center">

              <button

                onClick={() => router.push('/')}

                className="text-xl font-bold text-blue-600 hover:text-blue-800"

              >

                Easy Travels Admin

              </button>

              <div className="hidden md:flex ml-10 space-x-8">

                {navItems.map((item) => (

                  <button

                    key={item.path}

                    onClick={() => handleNavClick(item.path)}

                    className={`inline-flex items-center px-3 pt-1 text-lg font-semibold ${

                      pathname === item.path

                        ? 'text-blue-600 border-b-2 border-blue-600'

                        : 'text-secondary hover:text-primary'

                    }`}

                  >

                    {item.label}

                  </button>

                ))}

              </div>

            </div>

            <div className="flex items-center space-x-4">

              <span className="hidden sm:block text-sm text-secondary">

                Welcome, {user?.name}

              </span>

              <button

                onClick={() => handleNavClick('/profile')}

                className="btn btn-sm"

              >

                Profile

              </button>

              <button

                onClick={handleLogout}

                className="btn btn-danger btn-sm"

              >

                Logout

              </button>

              {/* Mobile menu button */}

              <button

                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}

                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"

              >

                <span className="sr-only">Open main menu</span>

                {mobileMenuOpen ? (

                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                  </svg>

                ) : (

                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />

                  </svg>

                )}

              </button>

            </div>

          </div>

        </div>

      </nav>



      {/* Mobile menu */}

      {mobileMenuOpen && (

        <div className="md:hidden mobile-menu active">

          <div className="px-2 pt-2 pb-3 space-y-1">

            <div className="flex items-center justify-between px-3 py-2">

              <span className="text-sm text-secondary">Welcome, {user?.name}</span>

            </div>

            {navItems.map((item) => (

              <button

                key={item.path}

                onClick={() => handleNavClick(item.path)}

                className={`block w-full text-left px-4 py-3 rounded-md text-lg font-semibold ${

                  pathname === item.path

                    ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'

                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'

                }`}

              >

                {item.label}

              </button>

            ))}

            <button

              onClick={() => handleNavClick('/profile')}

              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"

            >

              Profile

            </button>

            <div className="border-t border-gray-200 pt-2">

              <button

                onClick={handleLogout}

                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-900 hover:bg-red-50"

              >

                Logout

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Overlay for mobile menu */}

      {mobileMenuOpen && (

        <div

          className="md:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"

          onClick={() => setMobileMenuOpen(false)}

        />

      )}

    </>

  );

}

