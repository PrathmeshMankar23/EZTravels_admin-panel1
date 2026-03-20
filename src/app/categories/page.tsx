'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/utils/api';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  _count?: {
    destinations?: number;
    itineraries?: number;
  };
}

interface DestinationForCategory {
  id: string;
  title: string;
  categoryId: string;
  isActive: boolean;
  [key: string]: any;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [destinationsInModal, setDestinationsInModal] = useState<DestinationForCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showItineraryModal, setShowItineraryModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', isActive: true });

  const router = useRouter();

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      let cats: Category[] = [];
      let dests: DestinationForCategory[] = [];
      let apiCallFailed = false;

      // 1. Fetch Data
      try {
        const [catsRes, destsRes] = await Promise.all([
          api.getCategories(),
          api.getDestinations()
        ]);
        cats = Array.isArray(catsRes) ? catsRes : [];
        dests = Array.isArray(destsRes) ? destsRes : [];
      } catch (e) {
        apiCallFailed = true;
        console.error('❌ API calls failed, using demo data');
        // Use demo data when API fails
        cats = [
          { id: 'cat1', name: 'Beaches', isActive: true },
          { id: 'cat2', name: 'Mountains', isActive: true },
          { id: 'cat3', name: 'Cities', isActive: true },
          { id: 'cat4', name: 'Adventure', isActive: true },
          { id: 'cat5', name: 'Wildlife', isActive: true }
        ];
        dests = [
          {
            id: 'dest1',
            title: 'Sunny Beach Resort',
            categoryId: 'cat1',
            isActive: true
          },
          {
            id: 'dest2',
            title: 'Mountain Peak Trek',
            categoryId: 'cat2',
            isActive: true
          },
          {
            id: 'dest3',
            title: 'City Explorer Package',
            categoryId: 'cat3',
            isActive: true
          },
          {
            id: 'dest4',
            title: 'Adventure Safari',
            categoryId: 'cat4',
            isActive: true
          },
          {
            id: 'dest5',
            title: 'Wildlife Sanctuary',
            categoryId: 'cat5',
            isActive: true
          }
        ];
      }

      // 2. Process and set data
      // Calculate destination counts dynamically
      const categoriesWithCounts = cats.map((category: Category) => {
        const destinationCount = dests.filter((dest: any) => 
          String(dest.categoryId).trim().toLowerCase() === String(category.id).trim().toLowerCase()
        ).length;
        return {
          ...category,
          _count: { destinations: destinationCount }
        };
      });
      
      setCategories(categoriesWithCounts);
      setFilteredCategories(categoriesWithCounts);
      setApiError(apiCallFailed ? 'API unavailable - showing demo data' : '');

    } catch (err: any) {
      console.error('❌ Critical error in loadCategories:', err);
      setApiError('Failed to load categories');
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
      return;
    }
    loadCategories();
  }, [router, loadCategories]);

  // Actions
  const handleAddCategory = async () => {
    if (!formData.name.trim()) return;
    try {
      await api.createCategory(formData);
      setShowAddModal(false);
      setFormData({ name: '', isActive: true });
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to create');
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory) return;
    try {
      await api.updateCategory(selectedCategory.id, formData);
      setShowEditModal(false);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.deleteCategory(id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name, isActive: category.isActive });
    setShowEditModal(true);
  };

  const openItineraryModal = async (category: Category) => {
    setSelectedCategory(category);
    setShowItineraryModal(true);
    const allDests = await api.getDestinations();
    const filtered = allDests.filter((d: any) => 
      String(d.categoryId).trim().toLowerCase() === String(category.id).trim().toLowerCase()
    );
    setDestinationsInModal(filtered);
  };

  return (
    <DashboardLayout>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards Row - Single card */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          {/* Total Categories Card - Dashboard Style - Small Width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-sm">
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
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
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
              placeholder="Search categories by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-4 pr-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute right-4 top-4 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Add Category Button - Right side */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-8 py-4 text-lg bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              + Add Category
            </button>
          </div>
        </div>

      {apiError && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <p><strong>Status:</strong> {apiError}</p>
          <button onClick={loadCategories} className="underline font-medium">Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{category.name}</h3>
              
              <div className="flex items-center text-gray-500 mb-8 bg-gray-50 p-3 rounded-lg">
                <span className="text-xl mr-2">📍</span>
                <span className="font-medium text-gray-700">{category._count?.destinations || 0}</span>
                <span className="ml-1 text-sm">Destinations linked</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t pt-4">
                <button onClick={() => openEditModal(category)} className="btn-edit-category">Edit</button>
                <button onClick={() => openItineraryModal(category)} className="btn-view-category">View</button>
                <button onClick={() => handleDeleteCategory(category.id)} className="btn-delete-category">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>

      {/* --- MODALS --- */}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">New Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name</label>
                <input
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Luxury Travel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-2">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={formData.isActive} 
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                />
                <span className="text-gray-700 font-medium">Visible on website</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleAddCategory} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md transition-all">Create Category</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DESTINATIONS MODAL */}
      {showItineraryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                {destinationsInModal.length} Total
              </span>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              {destinationsInModal.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400">No destinations found in this category.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {destinationsInModal.map((dest) => (
                    <div key={dest.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-colors shadow-sm">
                      <span className="font-bold text-gray-700">{dest.title}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-semibold uppercase">Category:</span>
                        <span className="text-sm text-gray-600">{selectedCategory?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowItineraryModal(false)} 
              className="mt-8 w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name</label>
                <input
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-2">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-blue-600" 
                  checked={formData.isActive} 
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                />
                <span className="text-gray-700 font-medium">Category Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-gray-500 font-semibold">Cancel</button>
              <button onClick={handleEditCategory} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}