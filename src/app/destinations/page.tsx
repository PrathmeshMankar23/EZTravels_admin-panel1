'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/utils/api';

interface Destination {
  id: string;
  title: string;
  description: string;
  duration: number | string;
  nights?: number;
  price: number | string;
  image?: string;
  img?: string;
  isActive?: boolean;
  rating?: number;
  categoryId?: string;
  category: {
    id: string;
    name: string;
  };
  highlights?: string[];
  included?: string[];
  notIncluded?: string[];
  itinerary?: { day: number; title: string; desc: string; image?: string; activities: string[] }[];
  days?: {
    title: string;
    image: string;
    description: string;
    desc?: string;
    activities: string[];
  }[];
}

function mapApiToDestination(d: any): Destination {
  const img = d.img || d.image;
  const days = (d.itinerary || []).map((day: any) => ({
    title: day.title || '',
    image: day.image || '',
    description: day.desc || '',
    activities: Array.isArray(day.activities) ? day.activities : [],
  }));
  const durationNum = Number(d.duration);
  const nightsNum = d.nights != null ? Number(d.nights) : 0;
  const ratingNum = Number(d.rating);
  return {
    id: d.id,
    title: d.title,
    description: d.description || '',
    duration: Number.isNaN(durationNum) ? 0 : durationNum,
    nights: Number.isNaN(nightsNum) ? 0 : nightsNum,
    price: typeof d.price === 'string' ? d.price : String(d.price ?? 0),
    image: img,
    img,
    rating: Number.isNaN(ratingNum) ? 0 : ratingNum,
    categoryId: d.categoryId,
    category: d.category || { id: d.categoryId, name: '' },
    highlights: d.highlights || [],
    included: d.included || [],
    notIncluded: d.notIncluded || [],
    days: days.length ? days : [{ title: '', image: '', description: '', activities: [''] }],
  };
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate stats
  const totalDestinations = destinations.length;
  const liveDestinations = destinations.filter(d => d.isActive !== false).length;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingDestination, setEditingDestination] =
    useState<Destination | null>(null);
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const router = useRouter();

  // =================================
  // Form State
  // =================================

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

  const [formData, setFormData] = useState(initialFormState);

  // Safe value for number inputs – never pass NaN to React (fixes console error)
  const safeNum = (n: unknown): string => {
    const num = Number(n);
    if (n === undefined || n === null || Number.isNaN(num)) return '';
    return String(num);
  };

  const loadData = useCallback(async () => {
    try {
      const [cats, dests] = await Promise.all([api.getCategories(), api.getDestinations()]);
      setCategories(Array.isArray(cats) ? cats : []);
      const mappedDestinations = (Array.isArray(dests) ? dests : []).map(mapApiToDestination);
      setDestinations(mappedDestinations);
      setFilteredDestinations(mappedDestinations);
      
      // Cache data for categories page
      localStorage.setItem('cachedCategories', JSON.stringify(Array.isArray(cats) ? cats : []));
      localStorage.setItem('cachedDestinations', JSON.stringify(Array.isArray(dests) ? dests : []));
      console.log('✅ Cached data for categories page');
      
    } catch (e) {
      console.error('❌ API failed, using demo data for UI testing');
      // Use demo data when API fails to allow UI testing
      const demoCategories = [
        { id: 'cat1', name: 'Beaches', isActive: true },
        { id: 'cat2', name: 'Mountains', isActive: true },
        { id: 'cat3', name: 'Cities', isActive: true }
      ];
      
      const demoDestinations = [
        {
          id: 'dest1',
          title: 'Sunny Beach Resort',
          description: 'A beautiful beachfront resort with crystal clear waters and white sand beaches. Perfect for relaxation and water sports.',
          duration: 5,
          nights: 4,
          price: 25000,
          categoryId: 'cat1',
          category: demoCategories[0],
          image: 'https://images.unsplash.com/photo-1506905925346-56b1e46b7554?w=1200&h=600&fit=crop',
          isActive: true,
          highlights: ['Beach Access', 'Water Sports', 'Spa Services', 'Ocean View Rooms'],
          included: ['Daily Breakfast', 'Airport Transfer', 'Beach Umbrella', 'Towel Service'],
          days: [
            {
              title: 'Arrival & Beach Day',
              description: 'Welcome to paradise! Check in, relax on the beach, enjoy welcome dinner.',
              image: 'https://images.unsplash.com/photo-1506905925346-56b1e46b7554?w=800&h=400&fit=crop',
              activities: ['Beach Walk', 'Swimming', 'Sunset Watching', 'Welcome Dinner']
            },
            {
              title: 'Water Sports Adventure',
              description: 'Full day of exciting water activities including snorkeling, jet skiing, and parasailing.',
              image: 'https://images.unsplash.com/photo-1506905925346-56b1e46b7554?w=800&h=400&fit=crop',
              activities: ['Snorkeling', 'Jet Ski', 'Parasailing', 'Beach Volleyball', 'Lunch']
            },
            {
              title: 'Relaxation & Spa',
              description: 'Indulge in spa treatments and relaxation by the pool with ocean views.',
              image: 'https://images.unsplash.com/photo-1506905925346-56b1e46b7554?w=800&h=400&fit=crop',
              activities: ['Spa Treatment', 'Pool Relaxation', 'Massage Therapy', 'Healthy Lunch']
            },
            {
              title: 'Departure Day',
              description: 'Final beach breakfast, souvenir shopping, and departure to airport.',
              image: 'https://images.unsplash.com/photo-1506905925346-56b1e46b7554?w=800&h=400&fit=crop',
              activities: ['Breakfast', 'Souvenir Shopping', 'Check-out']
            }
          ]
        },
        {
          id: 'dest2',
          title: 'Mountain Peak Trek',
          description: 'Challenging mountain trek with breathtaking views and professional guides. Experience the thrill of high altitude.',
          duration: 7,
          nights: 6,
          price: 35000,
          categoryId: 'cat2',
          category: demoCategories[1],
          image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=1200&h=600&fit=crop',
          isActive: true,
          highlights: ['Mountain Views', 'Professional Guide', 'Camping Equipment', 'Altitude Experience'],
          included: ['All Meals', 'Camping Gear', 'Guide Services', 'Porter Service'],
          days: [
            {
              title: 'Base Camp Arrival',
              description: 'Arrive at base camp, meet your guide, and prepare for the trek.',
              image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=800&h=400&fit=crop',
              activities: ['Camp Setup', 'Guide Briefing', 'Equipment Check', 'Welcome Dinner']
            },
            {
              title: 'Summit Day',
              description: 'The big day! Early start, challenging climb to the summit with spectacular views.',
              image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=800&h=400&fit=crop',
              activities: ['Summit Attempt', 'Mountain Climbing', 'Peak Photography', 'Celebration Lunch']
            },
            {
              title: 'Descent Day',
              description: 'Begin descent back to base camp with beautiful valley views and rest stops.',
              image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=800&h=400&fit=crop',
              activities: ['Descent Hiking', 'Valley Views', 'Rest Stops', 'Camp Dinner']
            },
            {
              title: 'Departure',
              description: 'Final breakfast, certificate distribution, and farewell to mountain team.',
              image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=800&h=400&fit=crop',
              activities: ['Breakfast', 'Certificate Ceremony', 'Group Photo', 'Departure']
            }
          ]
        },
        {
          id: 'dest3',
          title: 'City Explorer Package',
          description: 'Comprehensive city tour with cultural experiences, local cuisine, and urban exploration.',
          duration: 4,
          nights: 3,
          price: 20000,
          categoryId: 'cat3',
          category: demoCategories[2],
          image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=1200&h=600&fit=crop',
          isActive: true,
          highlights: ['City Tours', 'Museums', 'Local Cuisine', 'Shopping Districts'],
          included: ['Hotel Accommodation', 'City Tours', 'Museum Entry', 'Guide Services'],
          days: [
            {
              title: 'City Arrival & Orientation',
              description: 'Arrive in the city, check into hotel, and get oriented with welcome dinner.',
              image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=800&h=400&fit=crop',
              activities: ['Hotel Check-in', 'City Orientation', 'Welcome Dinner', 'Evening Walk']
            },
            {
              title: 'Cultural Exploration',
              description: 'Visit museums, historical sites, and experience local culture and traditions.',
              image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=800&h=400&fit=crop',
              activities: ['Museum Tours', 'Historical Sites', 'Cultural Shows', 'Local Lunch']
            },
            {
              title: 'Shopping & Leisure',
              description: 'Free time for shopping, exploring markets, and personal leisure activities.',
              image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=800&h=400&fit=crop',
              activities: ['Market Shopping', 'Souvenir Hunting', 'Cafe Hopping', 'Dinner Show']
            },
            {
              title: 'Departure Day',
              description: 'Final city breakfast, last-minute sightseeing, and airport transfer.',
              image: 'https://images.unsplash.com/photo-1464821697019-f8bbcc01999?w=800&h=400&fit=crop',
              activities: ['Farewell Breakfast', 'Last Sightseeing', 'Airport Transfer']
            }
          ]
        }
      ];
      
      setCategories(demoCategories);
      const mappedDemoDestinations = demoDestinations.map(mapApiToDestination);
      setDestinations(mappedDemoDestinations);
      setFilteredDestinations(mappedDemoDestinations);
      
      // Cache demo data for categories page
      localStorage.setItem('cachedCategories', JSON.stringify(demoCategories));
      localStorage.setItem('cachedDestinations', JSON.stringify(demoDestinations));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openViewModal = useCallback((destination: Destination) => {
    setSelectedDestination(destination);
    setShowViewModal(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router, loadData]);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDestinations(destinations);
    } else {
      const filtered = destinations.filter(destination => 
        destination.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        destination.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        destination.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDestinations(filtered);
    }
  }, [searchTerm, destinations]);

  useEffect(() => {
    if (destinations.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const destinationId = urlParams.get('id');
      const shouldAdd = urlParams.get('add') === 'true';
      
      if (destinationId) {
        const destination = destinations.find((d) => d.id === destinationId);
        if (destination) openViewModal(destination);
      }
      
      // Auto-open add modal if add=true parameter is present
      if (shouldAdd) {
        setFormData(initialFormState);
        setEditingDestination(null);
        setShowAddModal(true);
      }
    }
  }, [destinations, openViewModal]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this destination?')) return;
    try {
      // Find destination to get title for activity
      const destinationToDelete = destinations.find(d => d.id === id);

      await api.deleteDestination(id);

      // Add activity to localStorage
      if (destinationToDelete) {
        const newActivity = {
          id: Date.now().toString(),
          type: 'destination' as const,
          action: 'deleted' as const,
          title: destinationToDelete.title,
          timestamp: new Date().toISOString(),
          user: 'Admin'
        };
        
        console.log('Adding destination deletion activity:', newActivity);
        
        const existingActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        const updatedActivities = [newActivity, ...existingActivities].slice(0, 10);
        localStorage.setItem('recentActivities', JSON.stringify(updatedActivities));
        
        console.log('Updated activities after deletion:', updatedActivities);
      }

      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete destination');
    }
  };

  const buildBackendPayload = () => {
    const priceVal = formData.price.toString().replace(/[^0-9]/g, '') || '0';
    const itinerary = formData.days
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
      title: formData.title,
      img: formData.image,
      description: formData.description,
      price: priceVal,
      duration: String(formData.duration || 0),
      nights: Number(formData.nights || 0),
      groupSize: 'Up to 15',
      about: formData.description,
      categoryId: formData.categoryId,
      highlights: formData.highlights.filter((h) => h.trim() !== ''),
      included: formData.included.filter((i) => i.trim() !== ''),
      notIncluded: formData.notIncluded.filter((n) => n.trim() !== ''),
      itinerary,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.categoryId || !formData.price) {
      alert('Please fill required fields');
      return;
    }
    try {
      const payload = buildBackendPayload();
      if (editingDestination) {
        await api.updateDestination(editingDestination.id, payload);

        // Add activity to localStorage
        const newActivity = {
          id: Date.now().toString(),
          type: 'destination' as const,
          action: 'updated' as const,
          title: formData.title,
          timestamp: new Date().toISOString(),
          user: 'Admin'
        };
        
        const existingActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        const updatedActivities = [newActivity, ...existingActivities].slice(0, 10);
        localStorage.setItem('recentActivities', JSON.stringify(updatedActivities));
      } else {
        await api.createDestination(payload);

        // Add activity to localStorage
        const newActivity = {
          id: Date.now().toString(),
          type: 'destination' as const,
          action: 'created' as const,
          title: formData.title,
          timestamp: new Date().toISOString(),
          user: 'Admin'
        };
        
        console.log('Adding destination activity:', newActivity);
        
        const existingActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        const updatedActivities = [newActivity, ...existingActivities].slice(0, 10);
        localStorage.setItem('recentActivities', JSON.stringify(updatedActivities));
        
        console.log('Updated activities:', updatedActivities);
      }
      setFormData(initialFormState);
      setShowAddModal(false);
      setEditingDestination(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to save destination');
    }
  };

  // Day Management Functions
  const addDay = () => {
    setFormData({
      ...formData,
      days: [...formData.days, { title: '', image: '', description: '', activities: [''] }]
    });
  };

  // ===============================
  // ✅ PASTE ALL HELPERS HERE
  // ===============================

  const addArrayItem = (field: 'highlights' | 'included' | 'notIncluded') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayItem = (
    field: 'highlights' | 'included' | 'notIncluded',
    index: number,
    value: string
  ) => {
    setFormData(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const removeArrayItem = (
    field: 'highlights' | 'included' | 'notIncluded',
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };


  // Day helpers
  const updateDay = (dayIndex: number, key: string, value: any) => {
    setFormData(prev => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], [key]: value };
      return { ...prev, days };
    });
  };

  const addActivity = (dayIndex: number) => {
    setFormData(prev => {
      const days = [...prev.days];
      days[dayIndex] = {
        ...days[dayIndex],
        activities: [...days[dayIndex].activities, '']
      };
      return { ...prev, days };
    });
  };

  const updateActivity = (
    dayIndex: number,
    actIndex: number,
    value: string
  ) => {
    setFormData(prev => {
      const days = [...prev.days];
      const newActivities = [...days[dayIndex].activities];
      newActivities[actIndex] = value;
      days[dayIndex] = {
        ...days[dayIndex],
        activities: newActivities
      };
      return { ...prev, days };
    });
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    setFormData(prev => {
      const days = [...prev.days];
      days[dayIndex] = {
        ...days[dayIndex],
        activities: days[dayIndex].activities.filter((_, i) => i !== actIndex)
      };
      return { ...prev, days };
    });
  };



  const openEditModal = (destination: Destination) => {
    setEditingDestination(destination);

    const dur = Number(destination.duration);
    const nts = Number(destination.nights);
    const rat = Number(destination.rating);
    setFormData({
      id: destination.id,
      title: destination.title,
      description: destination.description,
      categoryId: destination.category?.id || '',
      duration: Number.isNaN(dur) ? 0 : dur,
      nights: Number.isNaN(nts) ? 0 : nts,
      price: destination.price.toString(),
      image: destination.image || '',
      rating: Number.isNaN(rat) ? 0 : rat,

      highlights:
        destination.highlights?.length
          ? destination.highlights
          : [''],

      included:
        destination.included?.length
          ? destination.included
          : [''],

      notIncluded:
        destination.notIncluded?.length
          ? destination.notIncluded
          : [''],

      days:
        destination.days?.length
          ? destination.days
          : initialFormState.days
    });


    setShowAddModal(true);
  };

  // =================================
  // Image Upload Handlers
  // =================================

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const imageResult = await (api as any).uploadImage(file);
        setFormData({ ...formData, image: imageResult.url });
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
      const imageResult = await (api as any).uploadImage(file);
        updateDay(dayIndex, 'image', imageResult.url);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.message || 'Failed to upload day image');
    }
  };

  // =================================
  // UI (UNCHANGED)
  // =================================

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  return (
    <DashboardLayout>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards Row - Single card */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          {/* Total Destinations Card - Dashboard Style - Small Width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-sm">
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
                <p className="text-2xl font-bold text-gray-900">{totalDestinations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Search Bar - Wider, Left side */}
          <div className="relative flex-1 lg:max-w-lg">
            <input
              type="text"
              placeholder="Search destinations by title, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-4 pr-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute right-4 top-4 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Toggle and Add Buttons - Right side */}
          <div className="flex items-center space-x-4">
            <div className="view-toggle">
              <button onClick={() => setViewMode('card')} className={`view-toggle button ${viewMode === 'card' ? 'active' : ''}`}>Card</button>
              <button onClick={() => setViewMode('table')} className={`view-toggle button ${viewMode === 'table' ? 'active' : ''}`}>Table</button>
            </div>
            <button onClick={() => { setFormData(initialFormState); setEditingDestination(null); setShowAddModal(true); }} className="px-8 py-4 text-lg bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              + Add Destination
            </button>
          </div>
        </div>

        <div className="content-area">
          {filteredDestinations.length === 0 ? (
            <div className="no-itineraries">{searchTerm ? 'No destinations found matching your search.' : 'No destinations found.'}</div>
          ) : (
            viewMode === 'card' ? (
              <div className="card-grid">
                {filteredDestinations.map(destination => (
                  <div key={destination.id} className="itinerary-card">
                    <div className="card-image-container">
                      <img src={destination.image || 'https://images.unsplash.com/photo-1469474968028-5669f8e4b82?w=500&h=300&fit=crop'} alt={destination.title} className="card-image" />
                      <div className="category-badge">{destination.category?.name}</div>
                      <div className="duration-badge"><span>{destination.duration}D / {(destination.nights || 0)}N</span></div>
                    </div>
                    <div className="card-content">
                      <div className="card-header">
                        <div className="card-title-section">
                          <h3 className="card-title">{destination.title}</h3>
                          <div className="card-meta">
                            <span className="flex items-center">Active</span>
                          </div>
                        </div>
                        <div className="card-price-section">
                          <div className="card-price">₹{Number(destination.price).toLocaleString('en-IN')}</div>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button onClick={() => openEditModal(destination)} className="card-btn card-btn-edit">Edit</button>
                        <button onClick={() => openViewModal(destination)} className="card-btn card-btn-view">View</button>
                        <button onClick={() => handleDelete(destination.id)} className="card-btn card-btn-delete">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Destination</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Duration</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Rating</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDestinations.map(destination => (
                      <tr key={destination.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium">{destination.title}</div>
                          <div className="text-xs text-gray-500">ID: {destination.id}</div>
                        </td>

                        <td className="px-6 py-4">
                          {destination.category?.name}
                        </td>

                        <td className="px-6 py-4">
                          {destination.duration}D / {destination.nights || 0}N
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          ₹{Number(destination.price).toLocaleString('en-IN')}
                        </td>

                        <td className="px-6 py-4">
                          ⭐ {destination.rating || 'N/A'}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${destination.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {destination.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(destination)}
                            className="px-3 py-1  bg-gray-200 rounded"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => openViewModal(destination)}
                            className="px-3 py-1 bg-blue-500 text-white rounded"
                          >
                            View
                          </button>

                          <button
                            onClick={() => handleDelete(destination.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            )
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingDestination ? 'Edit Destination' : 'Create Destination'}</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-section">
                <h3 className="form-title">Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input type="text" className="form-input" value={formData.title ?? ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={formData.categoryId ?? ''} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} required>
                      <option value="">Select</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input type="text" className="form-input" value={formData.price ?? ''} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Days/Nights)</label>
                    <div className="flex gap-2">
                      <input type="number" className="form-input" value={safeNum(formData.duration)} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 0 })} placeholder="Days" />
                      <input type="number" className="form-input" value={safeNum(formData.nights)} onChange={e => setFormData({ ...formData, nights: parseInt(e.target.value, 10) || 0 })} placeholder="Nights" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination Image</label>
                    <div className="flex gap-2">
                      <input type="file" accept="image/*" onChange={handleMainImageUpload} className="form-input" />
                      {formData.image && (
                        <button type="button" onClick={() => setFormData({ ...formData, image: '' })} className="btn btn-danger">Clear</button>
                      )}
                    </div>
                    {formData.image && (
                      <img src={formData.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <input type="number" className="form-input" value={safeNum(formData.rating)} onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })} step="0.1" max="5" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Destination Description</label>
                <textarea className="form-textarea" rows={3} value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              {/* Highlights */}
              <div className="form-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="form-title">Highlights</h3>
                  <button type="button" onClick={() => addArrayItem('highlights')} className="btn btn-primary">+ Add</button>
                </div>
                {formData.highlights.map((h, i) => (
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
                {formData.days.map((day, i) => (
                  <div key={i} className="border p-4 rounded-lg mb-4 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-bold">Day {i + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newDays = formData.days.filter((_, idx) => idx !== i);
                          setFormData({ ...formData, days: newDays.length ? newDays : initialFormState.days });
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
                {formData.included.map((item, i) => (
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
                {formData.notIncluded.map((item, i) => (
                  <div key={i} className="array-item-container flex gap-2 mb-2">
                    <input type="text" className="form-input" value={item ?? ''} onChange={e => updateArrayItem('notIncluded', i, e.target.value)} placeholder="Enter not included item..." />
                    <button type="button" onClick={() => removeArrayItem('notIncluded', i)} className="btn btn-danger">×</button>
                  </div>
                ))}
              </div>

              <div className="form-actions flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Destination</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDestination && (
        <div className="modal-overlay">
          <div className="modal-content max-w-7xl max-h-[95vh] overflow-y-auto">
            {/* Header with Large Image */}
            <div className="relative h-96 md:h-[32rem] rounded-t-xl overflow-hidden">
              <img 
                src={selectedDestination.image || 'https://images.unsplash.com/photo-1469474968028-5669f8e4b82?w=1200&h=600&fit=crop'} 
                className="w-full h-full object-cover" 
                alt={selectedDestination.title} 
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1469474968028-5669f8e4b82?w=1200&h=600&fit=crop';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent"></div>
              <button 
                onClick={() => setShowViewModal(false)} 
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-xl hover:bg-white transition-all hover:scale-105 z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Title and Badges - Left Side Only */}
              <div className="absolute left-0 top-12 bottom-6 bg-gradient-to-r from-blue-600/95 to-transparent p-6 rounded-r-xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white drop-shadow-lg">{selectedDestination.title}</h1>
                <div className="flex flex-wrap gap-3 text-lg md:text-xl">
                  <span className="bg-orange-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-orange-400 font-bold">
                    🕒 {selectedDestination.duration}D / {(selectedDestination.nights || 0)}N
                  </span>
                  <span className="bg-teal-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-teal-400 font-bold">
                    📂 {selectedDestination.category?.name || 'Uncategorized'}
                  </span>
                  <span className="bg-emerald-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-400 font-bold text-lg">
                    ₹{Number(selectedDestination.price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    📝
                  </span>
                  About This Destination
                </h2>
                <p className="text-gray-600 leading-relaxed text-lg md:text-xl">{selectedDestination.description}</p>
              </div>

              {/* Highlights */}
              {selectedDestination.highlights && selectedDestination.highlights.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 shadow-sm border border-purple-100">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      ✨
                    </span>
                    Destination Highlights
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedDestination.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <span className="text-purple-500 text-2xl">✨</span>
                        <span className="text-gray-700 font-medium">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day by Day Itinerary */}
              {selectedDestination.days && selectedDestination.days.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 shadow-sm border border-orange-100">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                    <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                      📅
                    </span>
                    Day-by-Day Itinerary
                  </h2>
                  <div className="space-y-8">
                    {selectedDestination.days.map((day, idx) => (
                      <div key={idx} className="relative">
                        {/* Day Number */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {idx + 1}
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex-1">
                            {day.title}
                          </h3>
                        </div>
                        
                        {/* Day Content */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 ml-16">
                          {day.image && (
                            <img 
                              src={day.image} 
                              className="w-full h-64 md:h-80 object-cover rounded-xl mb-6 shadow-sm" 
                              alt={day.title}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1506905925346-56b1e46b7554?w=800&h=400&fit=crop';
                              }}
                            />
                          )}
                          <p className="text-gray-600 leading-relaxed text-lg mb-6">{day.description}</p>
                          
                          {day.activities && day.activities.length > 0 && (
                            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                              <h4 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-3">
                                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                                  🎯
                                </span>
                                Activities:
                              </h4>
                              <ul className="grid md:grid-cols-2 gap-4">
                                {day.activities.map((activity, actIndex) => (
                                  <li key={actIndex} className="flex items-start gap-3 text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                                    <span className="w-3 h-3 bg-blue-400 rounded-full mt-1 flex-shrink-0"></span>
                                    <span className="text-lg leading-relaxed">{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Included & Not Included */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Included */}
                {selectedDestination.included && selectedDestination.included.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-green-600">What's Included</h2>
                    <div className="bg-green-50 rounded-lg p-6">
                      <ul className="space-y-3">
                        {selectedDestination.included.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700">
                            <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Not Included */}
                {selectedDestination.notIncluded && selectedDestination.notIncluded.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-red-600">What's Not Included</h2>
                    <div className="bg-red-50 rounded-lg p-6">
                      <ul className="space-y-3">
                        {selectedDestination.notIncluded.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700">
                            <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
