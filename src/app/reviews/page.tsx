'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/utils/api';

interface Review {
  id: string;
  name: string;
  email?: string;
  rating: number;
  review: string;
  isApproved: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  destination?: {
    id: string;
    title: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [starFilter, setStarFilter] = useState<'ALL' | '5+' | '4+' | '3+' | '2+' | '1+'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate stats
  const totalReviews = reviews.length;
  const pendingReviews = reviews.filter(r => !r.isApproved && r.status !== 'REJECTED').length;
  const approvedReviews = reviews.filter(r => r.isApproved).length;
  const rejectedReviews = reviews.filter(r => r.status === 'REJECTED').length;

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await api.getReviews();
      setReviews(data);
      setFilteredReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: string, isApproved: boolean) => {
    try {
      await api.updateReviewStatus(reviewId, { isApproved });
      await loadReviews(); // Refresh list
    } catch (error) {
      console.error('Failed to update review:', error);
      alert('Failed to update review status');
    }
  };

  const rejectReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to reject this review?')) return;
    
    try {
      // Update the review locally to mark as rejected
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId 
            ? { ...review, status: 'REJECTED', isApproved: false }
            : review
        )
      );
      
      // In the future, this would call an API to update the status
      // await api.updateReviewStatus(reviewId, { status: 'REJECTED' });
      
      console.log('Review rejected:', reviewId);
    } catch (error) {
      console.error('Failed to reject review:', error);
      alert('Failed to reject review');
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await api.deleteReview(reviewId);
      await loadReviews(); // Refresh list
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review');
    }
  };

  // Search and filter functionality
  useEffect(() => {
    let filtered = reviews;
    
    // Apply status filter
    if (filter === 'PENDING') {
      filtered = filtered.filter(review => !review.isApproved && review.status !== 'REJECTED');
    } else if (filter === 'APPROVED') {
      filtered = filtered.filter(review => review.isApproved);
    } else if (filter === 'REJECTED') {
      filtered = filtered.filter(review => review.status === 'REJECTED');
    }
    
    // Apply star rating filter
    if (starFilter !== 'ALL') {
      filtered = filtered.filter(review => {
        switch (starFilter) {
          case '5+':
            return review.rating === 5;
          case '4+':
            return review.rating >= 4;
          case '3+':
            return review.rating >= 3;
          case '2+':
            return review.rating >= 2;
          case '1+':
            return review.rating >= 1;
          default:
            return true;
        }
      });
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(review => 
        review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredReviews(filtered);
  }, [searchTerm, reviews, filter, starFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards Row - Four cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
              </div>
            </div>
          </div>

          {/* Pending Reviews Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{pendingReviews}</p>
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
                <p className="text-2xl font-bold text-gray-900">{approvedReviews}</p>
              </div>
            </div>
          </div>

          {/* Rejected Reviews Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedReviews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 md:max-w-lg">
              <input
                type="text"
                placeholder="Search reviews by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-4 pr-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute right-4 top-4 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Star Rating Filter Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => {
                  const dropdown = document.getElementById('starFilterDropdown');
                  if (dropdown) {
                    dropdown.classList.toggle('hidden');
                  }
                }}
                className="px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer flex items-center justify-between min-w-32"
              >
                <span>
                  {starFilter === 'ALL' ? 'All Stars' : 
                   starFilter === '5+' ? '5 Stars' : 
                   starFilter === '4+' ? '4+ Stars' : 
                   starFilter === '3+' ? '3+ Stars' : 
                   starFilter === '2+' ? '2+ Stars' : '1+ Stars'}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              <div id="starFilterDropdown" className="hidden absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => { 
                      setStarFilter('ALL'); 
                      const dropdown = document.getElementById('starFilterDropdown');
                      if (dropdown) dropdown.classList.add('hidden');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      starFilter === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    All Stars
                  </button>
                  <button
                    onClick={() => { 
                      setStarFilter('5+'); 
                      const dropdown = document.getElementById('starFilterDropdown');
                      if (dropdown) dropdown.classList.add('hidden');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      starFilter === '5+' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    5 Stars
                  </button>
                  <button
                    onClick={() => { 
                      setStarFilter('4+'); 
                      const dropdown = document.getElementById('starFilterDropdown');
                      if (dropdown) dropdown.classList.add('hidden');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      starFilter === '4+' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    4+ Stars
                  </button>
                  <button
                    onClick={() => { 
                      setStarFilter('3+'); 
                      const dropdown = document.getElementById('starFilterDropdown');
                      if (dropdown) dropdown.classList.add('hidden');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      starFilter === '3+' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    3+ Stars
                  </button>
                  <button
                    onClick={() => { 
                      setStarFilter('2+'); 
                      const dropdown = document.getElementById('starFilterDropdown');
                      if (dropdown) dropdown.classList.add('hidden');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      starFilter === '2+' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    2+ Stars
                  </button>
                  <button
                    onClick={() => { 
                      setStarFilter('1+'); 
                      const dropdown = document.getElementById('starFilterDropdown');
                      if (dropdown) dropdown.classList.add('hidden');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      starFilter === '1+' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    1+ Stars
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'PENDING'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending Reviews
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'APPROVED'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Approved Reviews
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'REJECTED'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rejected Reviews
          </button>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No reviews found for this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{review.name}</div>
                          {review.email && (
                            <div className="text-sm text-gray-500">{review.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{review.review}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          review.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : review.isApproved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {review.status === 'REJECTED' ? 'Rejected' : review.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!review.isApproved && review.status !== 'REJECTED' && (
                          <button
                            onClick={() => updateReviewStatus(review.id, true)}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            Approve
                          </button>
                        )}
                        {review.status !== 'REJECTED' && (
                          <button
                            onClick={() => rejectReview(review.id)}
                            className="text-red-600 hover:text-red-900 mr-2"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
