// API configuration and utility functions
const API_BASE = `${import.meta.env.VITE_API_BASE}/inf/api/acc` || 'http://localhost:3000/inf/api/acc';

// Generic fetch wrapper with error handling
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
};

// Room API functions
export const roomAPI = {
  // Get all rooms
  getAllRooms: async () => {
    return apiRequest('/rooms/');
  },

  // Create a new room
  createRoom: async (roomData: { RoomName: string; gender: string; Capacity: number }) => {
    return apiRequest('/rooms/', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  },

  // Update a room
  updateRoom: async (roomId: string, roomData: { RoomName?: string; gender?: string; Capacity?: number }) => {
    return apiRequest(`/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  },

  // Get a single room by ID
  getRoomById: async (roomId: string) => {
    return apiRequest(`/rooms/${roomId}`);
  },

  // Delete a room
  deleteRoom: async (roomId: string) => {
    return apiRequest(`/rooms/${roomId}`, {
      method: 'DELETE',
    });
  },

  // Add a member to a room
  addMember: async (memberData: { uniqueId: string; email: string; roomName: string }) => {
    return apiRequest('/rooms/add-member', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  // Find room by member identifier (email or uniqueId)
  findRoomByMember: async (identifier: string) => {
    return apiRequest(`/rooms/member/${identifier}`);
  },

  // Change a member's room
  changeRoom: async (memberData: { uniqueId: string; email: string; fromRoom: string; toRoom: string }) => {
    return apiRequest('/rooms/change-room', {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  },
};

// Accommodation API functions
export const accommodationAPI = {
  // Register accommodation
  register: async (accommodationData: any) => {
    return apiRequest('/accommodation/register', {
      method: 'POST',
      body: JSON.stringify(accommodationData),
    });
  },

  // Get accommodation by unique ID
  getByUniqueId: async (uniqueId: string) => {
    return apiRequest(`/accommodation/uniqueId/${uniqueId}`);
  },

  // Get accommodation by email
  getByEmail: async (email: string) => {
    return apiRequest(`/accommodation/email/${email}`);
  },

  // Update payment status
  updatePayment: async (uniqueId: string, amount: number) => {
    return apiRequest(`/accommodation/payment/${uniqueId}`, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    });
  },

  // Get accommodation statistics
  getStats: async () => {
    return apiRequest('/accommodation/stats');
  },

  // Get all accommodations with room details
  getAll: async () => {
    return apiRequest('/accommodation/all');
  },
};

// Desk session API functions
export const deskAPI = {
  // Create a new desk session
  createSession: async () => {
    return apiRequest('/desk/create', {
      method: 'POST',
    });
  },

  // Refresh desk session
  refreshSession: async (deskId: string, signature: string) => {
    return apiRequest('/desk/refresh', {
      method: 'POST',
      body: JSON.stringify({ deskId, signature }),
    });
  },
};

// Export default API configuration
export default {
  roomAPI,
  accommodationAPI,
  deskAPI,
};