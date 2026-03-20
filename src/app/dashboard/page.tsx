'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/utils/api';

interface Itinerary {
  id: string;
  title: string;
  description: string;
  duration: number;
  nights?: number;
  price: number;
  image?: string;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
  highlights?: string[];
  included?: string[];
  notIncluded?: string[];
  days?: {
    title: string;
    image: string;
    description: string;
    activities: string[];
  }[];
}

interface DashboardStats {
  totalDestinations: number;
  totalCategories: number;
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
}

interface RecentActivity {
  id: string;
  type: 'destination' | 'category';
  action: 'created' | 'updated' | 'deleted';
  title: string;
  timestamp: string;
  user?: string;
}

interface Review {
  id: string;
  name: string;
  email?: string;
  rating: number;
  review: string;
  isApproved: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDestinations: 0,
    totalCategories: 0,
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [reportData, setReportData] = useState<Review[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({ from: '2026-03-01', to: '2026-03-31' });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Form modals state - using exact same structure as original pages
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingDestination, setEditingDestination] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  // Destination form state - exact same as destinations page
  const initialFormState = {
    id: '',
    title: '',
    description: '',
    categoryId: '',
    duration: 0,
    nights: 0,
    price: '',
    image: '',
    rating: 0,
    highlights: [''],
    included: [''],
    notIncluded: [''],
    days: [
      {
        title: '',
        image: '',
        description: '',
        activities: ['']
      }
    ]
  };
  
  const [destinationForm, setDestinationForm] = useState(initialFormState);
  const [categoryForm, setCategoryForm] = useState({ name: '', isActive: true });
  const [categories, setCategories] = useState<any[]>([]);
  
  // Helper functions from destinations page
  const safeNum = (n: unknown): string => {
    const num = Number(n);
    if (n === undefined || n === null || Number.isNaN(num)) return '';
    return String(num);
  };
  
  const addArrayItem = (field: 'highlights' | 'included' | 'notIncluded') => {
    setDestinationForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayItem = (
    field: 'highlights' | 'included' | 'notIncluded',
    index: number,
    value: string
  ) => {
    setDestinationForm(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const removeArrayItem = (
    field: 'highlights' | 'included' | 'notIncluded',
    index: number
  ) => {
    setDestinationForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateDay = (dayIndex: number, key: string, value: any) => {
    setDestinationForm(prev => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], [key]: value };
      return { ...prev, days };
    });
  };

  const addDay = () => {
    setDestinationForm({
      ...destinationForm,
      days: [...destinationForm.days, { title: '', image: '', description: '', activities: [''] }]
    });
  };

  const addActivity = (dayIndex: number) => {
    setDestinationForm(prev => {
      const days = [...prev.days];
      days[dayIndex].activities.push('');
      return { ...prev, days };
    });
  };

  const updateActivity = (
    dayIndex: number,
    actIndex: number,
    value: string
  ) => {
    setDestinationForm(prev => {
      const days = [...prev.days];
      days[dayIndex].activities[actIndex] = value;
      return { ...prev, days };
    });
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    setDestinationForm(prev => {
      const days = [...prev.days];
      days[dayIndex].activities =
        days[dayIndex].activities.filter((_, i) => i !== actIndex);
      return { ...prev, days };
    });
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        // For now, just use the base64 as image
        setDestinationForm({ ...destinationForm, image: base64 });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.message || 'Failed to upload image');
    }
  };

  const handleDayImageUpload = async (dayIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        updateDay(dayIndex, 'image', base64);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.message || 'Failed to upload day image');
    }
  };

  // Form submission handlers
  const buildBackendPayload = () => {
    const priceVal = destinationForm.price.toString().replace(/[^0-9]/g, '') || '0';
    const itinerary = destinationForm.days
      .filter((d) => d.title.trim() || d.description.trim())
      .map((d, i) => ({
        day: i + 1,
        title: d.title,
        desc: d.description,
        image: d.image,
        activities: Array.isArray(d.activities) ? d.activities.filter((a) => String(a).trim() !== '') : [],
      }));
    if (itinerary.length === 0) itinerary.push({ day: 1, title: '', desc: '', image: '', activities: [] });
    return {
      title: destinationForm.title,
      img: destinationForm.image,
      description: destinationForm.description,
      price: priceVal,
      duration: String(destinationForm.duration || 0),
      nights: Number(destinationForm.nights || 0),
      groupSize: 'Up to 15',
      about: destinationForm.description,
      categoryId: destinationForm.categoryId,
      highlights: destinationForm.highlights.filter((h) => h.trim() !== ''),
      included: destinationForm.included.filter((i) => i.trim() !== ''),
      notIncluded: destinationForm.notIncluded.filter((n) => n.trim() !== ''),
      itinerary,
    };
  };

  const handleDestinationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationForm.title || !destinationForm.categoryId || !destinationForm.price) {
      alert('Please fill required fields');
      return;
    }
    try {
      const payload = buildBackendPayload();
      console.log('Destination payload:', payload);
      
      // Add activity to localStorage
      const newActivity = {
        id: Date.now().toString(),
        type: 'destination' as const,
        action: 'created' as const,
        title: destinationForm.title,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      };
      
      const existingActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
      const updatedActivities = [newActivity, ...existingActivities].slice(0, 10);
      localStorage.setItem('recentActivities', JSON.stringify(updatedActivities));
      
      setDestinationForm(initialFormState);
      setShowDestinationModal(false);
      setEditingDestination(null);
      alert('Destination created successfully!');
    } catch (err: any) {
      alert(err?.message || 'Failed to save destination');
    }
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) return;
    try {
      await api.createCategory(categoryForm);
      setShowCategoryModal(false);
      setCategoryForm({ name: '', isActive: true });
      alert('Category created successfully!');
      
      // Refresh categories in localStorage so categories page shows the new category
      const cachedCategories = JSON.parse(localStorage.getItem('cachedCategories') || '[]');
      const newCategory = {
        id: Date.now().toString(), // Generate unique ID
        name: categoryForm.name,
        isActive: categoryForm.isActive,
        _count: { destinations: 0 }
      };
      const updatedCategories = [...cachedCategories, newCategory];
      localStorage.setItem('cachedCategories', JSON.stringify(updatedCategories));
      
    } catch (err: any) {
      alert(err.message || 'Failed to create');
    }
  };

  const router = useRouter();

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return past.toLocaleDateString();
  };

  // =================================
  // LOAD DATA FROM API
  // =================================

  const loadData = useCallback(async () => {
    try {
      // Load real data from API
      const [categories, destinations, reviews] = await Promise.all([
        api.getCategories(),
        api.getDestinations(),
        api.getReviews()
      ]);

      // Calculate review stats
      const totalReviews = Array.isArray(reviews) ? reviews.length : 0;
      const pendingReviews = Array.isArray(reviews) ? reviews.filter(r => !r.isApproved).length : 0;
      const approvedReviews = Array.isArray(reviews) ? reviews.filter(r => r.isApproved).length : 0;

      // Get recent reviews (latest 3)
      const recent = Array.isArray(reviews) ? reviews.slice(0, 3) : [];

      setStats({
        totalDestinations: Array.isArray(destinations) ? destinations.length : 0,
        totalCategories: Array.isArray(categories) ? categories.length : 0,
        totalReviews,
        pendingReviews,
        approvedReviews
      });

      // Load real activities from localStorage
      const storedActivities = localStorage.getItem('recentActivities');
      console.log('Stored activities from localStorage:', storedActivities);
      const activities = storedActivities ? JSON.parse(storedActivities) : [];
      console.log('Parsed activities:', activities);
      setRecentActivities(activities);
      setRecentReviews(recent);
    } catch (error: any) {
      console.error('Dashboard loading error:', error);
      setStats({
        totalDestinations: 0,
        totalCategories: 0,
        totalReviews: 0,
        pendingReviews: 0,
        approvedReviews: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate Report Function
  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      // Get all reviews from API
      const allReviews = await api.getReviews();
      
      // Filter reviews by date range
      const fromDate = new Date(reportDateRange.from);
      const toDate = new Date(reportDateRange.to);
      toDate.setHours(23, 59, 59, 999); // End of day
      
      const filteredReviews = allReviews.filter((review: Review) => {
        const reviewDate = new Date(review.createdAt);
        return reviewDate >= fromDate && reviewDate <= toDate;
      });
      
      setReportData(filteredReviews);
      setShowReportModal(true);
      
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // =================================
  // INIT
  // =================================

  useEffect(() => {
    const token = localStorage.getItem('adminToken');

    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [loadData, router]);

  // =================================
  // UI (UNCHANGED)
  // =================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-secondary animate-pulse">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header with Quick Actions */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome to your Easy Travels Admin Panel</p>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/destinations?add=true')}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Destination
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
            <button
              onClick={() => router.push('/reviews')}
              className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Manage Reviews
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Destinations Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Destinations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDestinations}</p>
            </div>
          </div>
        </div>

        {/* Categories Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
            </div>
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
            </div>
          </div>
        </div>

        {/* Approved Reviews Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Analytics and Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Review Analytics & Reports - Left Side */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Review Analytics & Reports</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar Widget */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">📅 Review Calendar</h3>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-medium">March 2026</span>
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center font-medium text-gray-500 py-1">{day}</div>
                  ))}
                  {/* Calendar Days - March 2026 */}
                  {[...Array(31)].map((_, i) => {
                    const dayNum = i + 1;
                    const reviewCount = Math.floor(Math.random() * 5); // Demo data
                    const hasReviews = reviewCount > 0;
                    const isToday = dayNum === 19;
                    
                    return (
                      <div
                        key={i}
                        className={`text-center py-1 rounded cursor-pointer transition-colors ${
                          isToday ? 'bg-blue-500 text-white' : 
                          hasReviews ? 'bg-green-100 hover:bg-green-200' : 
                          'hover:bg-gray-100'
                        }`}
                        title={`${reviewCount} reviews on March ${dayNum}`}
                      >
                        {dayNum}
                        {hasReviews && <div className="text-xs">•</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Date Range Selector */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">📅 Date Range Report</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={reportDateRange.from}
                    onChange={(e) => setReportDateRange({...reportDateRange, from: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={reportDateRange.to}
                    onChange={(e) => setReportDateRange({...reportDateRange, to: e.target.value})}
                  />
                </div>
                <button 
                  onClick={generateReport}
                  disabled={isGeneratingReport}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reviews - Right Side */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
            <button
              onClick={() => router.push('/reviews')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </button>
          </div>
          {recentReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-l-4 border-purple-200 pl-4 py-2">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900">{review.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      review.isApproved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {review.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="ml-2 text-xs text-gray-500">({review.rating}/5)</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{review.review}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(review.createdAt)}
                  </p>
                </div>
              ))}
              {recentReviews.length > 3 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => router.push('/reviews')}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View all {recentReviews.length} reviews →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  📊 Review Report ({reportDateRange.from} to {reportDateRange.to})
                </h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Found <span className="font-semibold">{reportData.length}</span> reviews in selected date range
                </p>
              </div>
              
              {reportData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No reviews found in the selected date range.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportData.map((review: Review) => (
                    <div key={review.id} className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{review.name}</h3>
                          {review.email && <p className="text-sm text-gray-500">{review.email}</p>}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          review.isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {review.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400 text-sm">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="ml-2 text-xs text-gray-500">({review.rating}/5)</span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{review.review}</p>
                      
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Destination Form Modal - Exact Same Form as Destinations Page */}
      {showDestinationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingDestination ? 'Edit Destination' : 'Create Destination'}</h2>
              <button onClick={() => setShowDestinationModal(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleDestinationSubmit} className="form-container">
              <div className="form-section">
                <h3 className="form-title">Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input type="text" className="form-input" value={destinationForm.title ?? ''} onChange={e => setDestinationForm({ ...destinationForm, title: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={destinationForm.categoryId ?? ''} onChange={e => setDestinationForm({ ...destinationForm, categoryId: e.target.value })} required>
                      <option value="">Select</option>
                      <option value="cat1">Beaches</option>
                      <option value="cat2">Mountains</option>
                      <option value="cat3">Cities</option>
                      <option value="cat4">Adventure</option>
                      <option value="cat5">Wildlife</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input type="text" className="form-input" value={destinationForm.price ?? ''} onChange={e => setDestinationForm({ ...destinationForm, price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Days/Nights)</label>
                    <div className="flex gap-2">
                      <input type="number" className="form-input" value={safeNum(destinationForm.duration)} onChange={e => setDestinationForm({ ...destinationForm, duration: parseInt(e.target.value, 10) || 0 })} placeholder="Days" />
                      <input type="number" className="form-input" value={safeNum(destinationForm.nights)} onChange={e => setDestinationForm({ ...destinationForm, nights: parseInt(e.target.value, 10) || 0 })} placeholder="Nights" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination Image</label>
                    <div className="flex gap-2">
                      <input type="file" accept="image/*" onChange={handleMainImageUpload} className="form-input" />
                      {destinationForm.image && (
                        <button type="button" onClick={() => setDestinationForm({ ...destinationForm, image: '' })} className="btn btn-danger">Clear</button>
                      )}
                    </div>
                    {destinationForm.image && (
                      <img src={destinationForm.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <input type="number" className="form-input" value={safeNum(destinationForm.rating)} onChange={e => setDestinationForm({ ...destinationForm, rating: parseFloat(e.target.value) || 0 })} step="0.1" max="5" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Destination Description</label>
                <textarea className="form-textarea" rows={3} value={destinationForm.description ?? ''} onChange={e => setDestinationForm({ ...destinationForm, description: e.target.value })} />
              </div>

              {/* Highlights */}
              <div className="form-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="form-title">Highlights</h3>
                  <button type="button" onClick={() => addArrayItem('highlights')} className="btn btn-primary">+ Add</button>
                </div>
                {destinationForm.highlights.map((h, i) => (
                  <div key={i} className="array-item-container flex gap-2 mb-2">
                    <input type="text" className="form-input" value={h ?? ''} onChange={e => updateArrayItem('highlights', i, e.target.value)} />
                    <button type="button" onClick={() => removeArrayItem('highlights', i)} className="btn btn-danger">×</button>
                  </div>
                ))}
              </div>

              {/* Day-by-Day */}
              <div className="form-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="form-title">Day-by-Day Plan</h3>
                  <button type="button" onClick={addDay} className="btn btn-primary">+ Add Day</button>
                </div>
                {destinationForm.days.map((day, i) => (
                  <div key={i} className="border p-4 rounded-lg mb-4 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-bold">Day {i + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newDays = destinationForm.days.filter((_, idx) => idx !== i);
                          setDestinationForm({ ...destinationForm, days: newDays.length ? newDays : initialFormState.days });
                        }}
                        className="btn-remove-day"
                      >
                        Remove Day
                      </button>
                    </div>
                    <input type="text" placeholder="Day Title" className="form-input mb-2" value={day.title ?? ''} onChange={e => updateDay(i, 'title', e.target.value)} />
                    <div className="mb-2">
                      <label className="form-label text-sm">Day Image</label>
                      <div className="flex gap-2">
                        <input type="file" accept="image/*" onChange={(e) => handleDayImageUpload(i, e)} className="form-input text-sm" />
                        {day.image && (
                          <button type="button" onClick={() => updateDay(i, 'image', '')} className="btn btn-danger text-sm">Clear</button>
                        )}
                      </div>
                      {day.image && (
                        <img src={day.image} alt="Day preview" className="mt-1 h-16 w-16 object-cover rounded" />
                      )}
                    </div>
                    <textarea placeholder="Description" className="form-textarea mb-2" rows={2} value={day.description ?? ''} onChange={e => updateDay(i, 'description', e.target.value)} />

                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Activities</label>
                        <button type="button" onClick={() => addActivity(i)} className="btn-add-activity">+ Add Activity</button>
                      </div>
                      {day.activities.map((act, actIdx) => (
                        <div key={actIdx} className="flex gap-2 mb-1">
                          <input type="text" className="form-input text-sm" value={act ?? ''} onChange={e => updateActivity(i, actIdx, e.target.value)} />
                          <button type="button" onClick={() => removeActivity(i, actIdx)} className="text-red-500">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Included Section */}
              <div className="form-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="form-title">Included</h3>
                  <button type="button" onClick={() => addArrayItem('included')} className="btn btn-primary">+ Add Item</button>
                </div>
                {destinationForm.included.map((item, i) => (
                  <div key={i} className="array-item-container flex gap-2 mb-2">
                    <input type="text" className="form-input" value={item ?? ''} onChange={e => updateArrayItem('included', i, e.target.value)} placeholder="Enter included item..." />
                    <button type="button" onClick={() => removeArrayItem('included', i)} className="btn btn-danger">×</button>
                  </div>
                ))}
              </div>

              {/* Not Included Section */}
              <div className="form-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="form-title">Not Included</h3>
                  <button type="button" onClick={() => addArrayItem('notIncluded')} className="btn btn-primary">+ Add Item</button>
                </div>
                {destinationForm.notIncluded.map((item, i) => (
                  <div key={i} className="array-item-container flex gap-2 mb-2">
                    <input type="text" className="form-input" value={item ?? ''} onChange={e => updateArrayItem('notIncluded', i, e.target.value)} placeholder="Enter not included item..." />
                    <button type="button" onClick={() => removeArrayItem('notIncluded', i)} className="btn btn-danger">×</button>
                  </div>
                ))}
              </div>

              <div className="form-actions flex justify-end gap-3">
                <button type="button" onClick={() => setShowDestinationModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Destination</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal - Complete Form from Categories Page */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">New Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name</label>
                <input
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Luxury Travel"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-2">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={categoryForm.isActive} 
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })} 
                />
                <span className="text-gray-700 font-medium">Visible on website</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowCategoryModal(false)} className="px-5 py-2.5 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleCategorySubmit} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md transition-all">Create Category</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

