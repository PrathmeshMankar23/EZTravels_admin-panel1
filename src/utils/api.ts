const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://easy-travels-backend.onrender.com/api';

// Debug: Log the API URL being used
console.log('API Base URL:', API_BASE_URL);

// Test connectivity to backend
export const testConnectivity = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET'
    });
    return response.ok;
  } catch (error) {
    console.error('Backend connectivity test failed:', error);
    return false;
  }
};

export const api = {
  // Auth endpoints
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  },

  // Categories endpoints
  getCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to fetch categories");
      }
      return response.json();
    } catch (error) {
      console.error('Categories API Error:', error);
      // Return empty array as fallback for any network issues
      return [];
    }
  },

  createCategory: async (categoryData: any) => {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to create category");
    }
    
    // Dispatch event to notify frontend
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminAction', {
        detail: { 
          type: 'category', 
          action: 'added', 
          itemName: categoryData.name || categoryData.title || 'New Category',
          details: `Category "${categoryData.name || categoryData.title || 'New Category'}" was added successfully`
        }
      }));
      console.log('📢 Admin event dispatched: category added');
    }
    
    return response.json();
  },

  updateCategory: async (id: string, categoryData: any) => {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to update category");
    }
    
    // Dispatch event to notify frontend
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminAction', {
        detail: { 
          type: 'category', 
          action: 'updated', 
          itemName: categoryData.name || categoryData.title || 'Updated Category',
          details: `Category "${categoryData.name || categoryData.title || 'Updated Category'}" was updated successfully`
        }
      }));
      console.log('📢 Admin event dispatched: category updated');
    }
    
    return response.json();
  },

  deleteCategory: async (id: string) => {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to delete category");
    }
    
    // Dispatch event to notify frontend
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminAction', {
        detail: { 
          type: 'category', 
          action: 'deleted', 
          itemName: `Category ID: ${id}`,
          details: `Category with ID ${id} was deleted successfully`
        }
      }));
      console.log('📢 Admin event dispatched: category deleted');
    }
    
    return response.json();
  },

  // Destinations endpoints
  getDestinations: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to fetch destinations");
      }
      return response.json();
    } catch (error) {
      console.error('Destinations API Error:', error);
      // Return empty array as fallback for any network issues
      return [];
    }
  },

  getDestinationsByCategory: async (categoryId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations?categoryId=${categoryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to fetch destinations by category");
      }
      return response.json();
    } catch (error) {
      console.error(`Destinations by Category API Error (${categoryId}):`, error);
      // Return empty array as fallback
      return [];
    }
  },

  getDestinationById: async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/destinations/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to fetch destination");
      }
      return response.json();
    } catch (error) {
      console.error('Destination by ID API Error:', error);
      throw new Error("Failed to fetch destination details");
    }
  },

  createDestination: async (destinationData: any) => {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/destinations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(destinationData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to create destination");
    }
    
    // Dispatch event to notify frontend
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminAction', {
        detail: { 
          type: 'destination', 
          action: 'added', 
          itemName: destinationData.title || destinationData.name || 'New Destination',
          details: `Destination "${destinationData.title || destinationData.name || 'New Destination'}" was added successfully`
        }
      }));
      console.log('📢 Admin event dispatched: destination added');
    }
    
    return response.json();
  },

  updateDestination: async (id: string, destinationData: any) => {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/destinations/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(destinationData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to update destination");
    }
    
    // Dispatch event to notify frontend
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminAction', {
        detail: { 
          type: 'destination', 
          action: 'updated', 
          itemName: destinationData.title || destinationData.name || 'Updated Destination',
          details: `Destination "${destinationData.title || destinationData.name || 'Updated Destination'}" was updated successfully`
        }
      }));
      console.log('📢 Admin event dispatched: destination updated');
    }
    
    return response.json();
  },

  deleteDestination: async (id: string) => {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/destinations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to delete destination");
    }
    
    // Dispatch event to notify frontend
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminAction', {
        detail: { 
          type: 'destination', 
          action: 'deleted', 
          itemName: `Destination ID: ${id}`,
          details: `Destination with ID ${id} was deleted successfully`
        }
      }));
      console.log('📢 Admin event dispatched: destination deleted');
    }
    
    return response.json();
  },

  // Reviews endpoints

  // Submit review (Public user)
submitReview: async (reviewData: {
  name: string;
  email: string;
  rating: number;
  review: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...reviewData,
        isApproved: false
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to submit review");
    }

    return response.json();
  } catch (error) {
    console.error("Submit Review Error:", error);
    throw error;
  }
},
  getReviews: async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to fetch reviews");
      }
      return response.json();
    } catch (error) {
      console.error('Reviews API Error:', error);
      // Return empty array as fallback for any network issues
      return [];
    }
  },

  updateReviewStatus: async (id: string, statusData: { isApproved: boolean }) => {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(statusData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to update review");
    }
    return response.json();
  },

  deleteReview: async (id: string) => {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to delete review");
    }
    return response.json();
  },
};

// ================= REVIEWS =================

// Get all reviews (Admin)
export const getReviews = async () => {
  const response = await fetch(`${API_BASE_URL}/reviews`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to fetch reviews");
  }

  return response.json();
};


// Approve or Reject review
export const updateReviewStatus = async (
  id: string,
  status: "APPROVED" | "REJECTED"
) => {

  const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update review status");
  }

  return response.json();
};


// Delete review
export const deleteReview = async (id: string) => {

  const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete review");
  }
};
