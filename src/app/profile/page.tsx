'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Mail, Phone, Building } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    role: '',
    department: ''
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData({
        username: parsedUser.username || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '+91 98765 43210',
        role: parsedUser.role || 'Administrator',
        department: parsedUser.department || 'Travel Management'
      });
    }
    
    setIsLoading(false);
  }, [router]);

  const handleSaveProfile = () => {
    const updatedUser = {
      ...user,
      ...formData
    };
    
    localStorage.setItem('adminUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card with Account Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">{user?.username}</h3>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {formData.role}
                </span>
              </div>
            </div>
          </div>
          
          {/* Account Activity - Moved below profile */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-900">Jan 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Login</span>
                <span className="text-sm font-medium text-gray-900">Today</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Username</h4>
                  <p className="mt-1 text-sm text-gray-900">{formData.username}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email Address</h4>
                  <p className="mt-1 text-sm text-gray-900">{formData.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
                  <p className="mt-1 text-sm text-gray-900">{formData.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Role</h4>
                  <p className="mt-1 text-sm text-gray-900">{formData.role.replace('_', ' ')}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Department</h4>
                  <p className="mt-1 text-sm text-gray-900">{formData.department}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
