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
  createdAt: string;
  destination?: {
    id: string;
    title: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await api.getReviews();
      setReviews(data);
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

  const filteredReviews = reviews.filter(review => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return !review.isApproved;
    if (filter === 'APPROVED') return review.isApproved;
    return true;
  });

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
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
          <p className="text-gray-600 mb-6">Manage customer reviews and approve/reject submissions</p>
          
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
              All Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'PENDING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending ({reviews.filter(r => !r.isApproved).length})
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'APPROVED'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Approved ({reviews.filter(r => r.isApproved).length})
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No reviews found for this filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{review.name}</h3>
                        {review.email && (
                          <span className="ml-2 text-sm text-gray-500">({review.email})</span>
                        )}
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                      </div>
                      
                      {/* Review Text */}
                      <p className="text-gray-700 mb-3">{review.review}</p>
                      
                      {/* Date */}
                      <p className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2 ml-4">
                      {!review.isApproved && (
                        <button
                          onClick={() => updateReviewStatus(review.id, true)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {review.isApproved && (
                        <button
                          onClick={() => updateReviewStatus(review.id, false)}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
