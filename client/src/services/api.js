import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;

    // Skip redirect for auth verification calls (initial app load)
    const isVerifyCall = error.config?.url === "/auth/verify";

    // Handle 401 errors (unauthorized/session expired)
    if (status === 401 && !isVerifyCall) {
      // Only redirect if not already on login/signup pages
      if (
        !["/login", "/signup", "/verify-email", "/resend-email"].some((p) =>
          currentPath.startsWith(p),
        )
      ) {
        console.warn("Session expired - redirecting to login");
        window.location.href = "/login";
      }
    }

    // Handle 403 errors (forbidden)
    if (status === 403) {
      console.warn("Access denied:", error.response?.data?.error);
    }

    // Handle 429 errors (rate limited)
    if (status === 429) {
      console.warn("Rate limited:", error.response?.data?.error);
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  signup: (userData) => api.post("/auth/signup", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  verify: () => api.get("/auth/verify"),
  verifyEmail: (data) => api.post("/auth/verify-email", data),
  resendVerificationEmail: (data) =>
    api.post("/auth/resend-verification-email", data),
  applyArtist: (artistData) => api.post("/auth/apply-artist", artistData),
  updateArtistInfo: (artistInfo) =>
    api.patch("/auth/update-artist-info", artistInfo),
};

// Artworks API
export const artworksAPI = {
  getAll: (params) => api.get("/api/artworks", { params }),
  getOne: (id) => api.get(`/api/artworks/${id}`),
  create: (artworkData) => api.post("/api/artworks", artworkData),
  update: (id, artworkData) => api.patch(`/api/artworks/${id}`, artworkData),
  delete: (id) => api.delete(`/api/artworks/${id}`),
  uploadImages: (id, formData) =>
    api.post(`/api/artworks/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadVideo: (id, formData) =>
    api.post(`/api/artworks/${id}/video`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadVideoThumbnail: (id, formData) =>
    api.post(`/api/artworks/${id}/video/thumbnail`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Events API
export const eventsAPI = {
  getAll: (params) => api.get("/api/events", { params }),
  getCalendar: (params) => api.get("/api/events/calendar", { params }),
  getOne: (id) => api.get(`/api/events/${id}`),
  create: (eventData) => api.post("/api/events", eventData),
  update: (id, eventData) => api.patch(`/api/events/${id}`, eventData),
  delete: (id) => api.delete(`/api/events/${id}`),
  uploadImage: (id, formData) =>
    api.post(`/api/events/${id}/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  join: (id) => api.post(`/api/events/${id}/attend`),
  leave: (id) => api.delete(`/api/events/${id}/attend`),
  getAttendees: (id) => api.get(`/api/events/${id}/attendees`),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get("/api/users/profile"),
  updateProfile: (userData) => api.patch("/api/users/profile", userData),
  uploadProfilePicture: (formData) =>
    api.post("/api/users/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadLogo: (formData) =>
    api.post("/api/users/profile/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getFavorites: () => api.get("/api/users/favorites"),
  addFavorite: (artworkId) => api.post(`/api/users/favorites/${artworkId}`),
  removeFavorite: (artworkId) =>
    api.delete(`/api/users/favorites/${artworkId}`),
  getAllArtists: () => api.get("/api/users/artists/all"),
  getArtistProfile: (id) => api.get(`/api/users/artist/${id}`),
};

// Admin API
export const adminAPI = {
  getAllUsers: (params) => api.get("/api/users", { params }),
  getUser: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, userData) => api.patch(`/api/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
  updateArtistStatus: (id, status) =>
    api.patch(`/api/users/${id}/artist-status`, { status }),
  updateUserRole: (id, role) => api.patch(`/api/users/${id}/role`, { role }),
};

export const reviewsAPI = {
  getByArtwork: (artworkId) => api.get(`/api/artworks/${artworkId}/reviews`),
  create: (artworkId, reviewData) =>
    api.post(`/api/artworks/${artworkId}/reviews`, reviewData),
  update: (reviewId, reviewData) =>
    api.patch(`/api/reviews/${reviewId}`, reviewData),
  delete: (reviewId) => api.delete(`/api/reviews/${reviewId}`),
};

// Cart API
export const apiCart = {
  get: () => api.get("/api/cart"),
  add: (artworkId, quantity) =>
    api.post("/api/cart/add", { artworkId, quantity }),
  update: (artworkId, quantity) =>
    api.patch("/api/cart/update", { artworkId, quantity }),
  remove: (artworkId) => api.delete(`/api/cart/remove/${artworkId}`),
  clear: () => api.delete("/api/cart/clear"),
};

// Orders API
export const apiOrders = {
  create: (orderData) => api.post("/api/orders", orderData),
  getMine: () => api.get("/api/orders/mine"),
  getAll: (params) => api.get("/api/orders/all", { params }),
  getOne: (id) => api.get(`/api/orders/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/api/orders/${id}/status`, { status }),
  confirmPayment: (id) => api.post(`/api/orders/${id}/confirm-payment`),
};

// Videos API (streaming & purchases)
export const videosAPI = {
  // Check if user has access to a video
  checkAccess: (artworkId) => api.get(`/api/videos/${artworkId}/access`),
  // Get signed URL for streaming (requires access)
  getStreamUrl: (artworkId) => api.get(`/api/videos/${artworkId}/stream`),
  // Instant purchase a video
  purchase: (artworkId) => api.post(`/api/videos/${artworkId}/purchase`),
  // Get user's purchased videos
  getPurchased: (params) => api.get("/api/videos/purchased", { params }),
};

// Platform API (SuperAdmin)
export const platformAPI = {
  // Settings (SuperAdmin only)
  getSettings: () => api.get("/api/platform/settings"),
  updateSettings: (settings) => api.patch("/api/platform/settings", settings),
  // Statistics (Admin & SuperAdmin)
  getStats: (period) => api.get("/api/platform/stats", { params: { period } }),
  // Storage management (SuperAdmin only)
  getStorageUsage: (params) => api.get("/api/platform/storage", { params }),
  updateUserStorage: (userId, data) =>
    api.patch(`/api/platform/storage/${userId}`, data),
  // Maintenance mode (SuperAdmin only)
  toggleMaintenance: (data) => api.post("/api/platform/maintenance", data),
};

// Payments API (Stripe)
export const paymentsAPI = {
  // Create PaymentIntent for an order
  createIntent: (orderId) =>
    api.post("/api/payments/create-intent", { orderId }),
  // Get payment status for an order
  getStatus: (orderId) => api.get(`/api/payments/${orderId}`),
};

// Geocode API
export const geocodeAPI = {
  // Geocode address to coordinates
  geocode: (address) => api.post("/api/geocode", address),
  // Reverse geocode coordinates to address
  reverse: (lat, lng) => api.post("/api/geocode/reverse", { lat, lng }),
};

// Assign to main object for default export users
api.cart = apiCart;
api.orders = apiOrders;
api.platform = platformAPI;
api.videos = videosAPI;

export default api;
