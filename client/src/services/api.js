import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
});

// In-memory CSRF token storage as fallback
let memoryCsrfToken = null;

// Helper to read a cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// Request interceptor - attach CSRF token
api.interceptors.request.use(
  (config) => {
    // 1. Try to get the token from the cookie
    const cookieToken = getCookie("csrf_token");

    // 2. Fallback to memory if cookie is inaccessible
    const csrfToken = cookieToken || memoryCsrfToken;

    if (csrfToken) {
      config.headers["x-csrf-token"] = csrfToken;
    }

    // Ensure withCredentials is set for every request to allow cross-site cookies
    config.withCredentials = true;

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // If response contains a CSRF token (our custom addition), store it in memory
    if (response.data?.csrfToken) {
      memoryCsrfToken = response.data.csrfToken;
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;

    // Handle 403 errors (forbidden / CSRF)
    if (status === 403) {
      const msg = error.response?.data?.error;
      if (msg === "Invalid CSRF token") {
        console.warn("CSRF token mismatch - cleaning memory token");
        memoryCsrfToken = null;
        return Promise.reject(error);
      }
    }

    const isVerifyCall = error.config?.url === "/auth/verify";
    if (status === 401 && !isVerifyCall) {
      if (
        !["/login", "/signup", "/verify-email", "/resend-email"].some((p) =>
          currentPath.startsWith(p),
        )
      ) {
        console.warn("Session expired - redirecting to login");
        window.location.href = "/login";
      }
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
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  applyArtist: (artistData) => api.post("/auth/apply-artist", artistData),
  updateArtistInfo: (artistInfo) =>
    api.patch("/auth/update-artist-info", artistInfo),
};

// Artworks API
export const artworksAPI = {
  getAll: (params) => api.get("/api/artworks", { params }),
  getOne: (id) => api.get(`/api/artworks/${id}`),
  getArtistStats: () => api.get("/api/artworks/artist/stats"),
  create: (artworkData) => api.post("/api/artworks", artworkData),
  update: (id, artworkData) => api.patch(`/api/artworks/${id}`, artworkData),
  delete: (id) => api.delete(`/api/artworks/${id}`),
  uploadImages: (id, formData) =>
    api.post(`/api/artworks/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadVideo: (id, formData, onProgress) =>
    api.post(`/api/artworks/${id}/video`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
    }),
  uploadVideoThumbnail: (id, formData) =>
    api.post(`/api/artworks/${id}/video/thumbnail`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  incrementView: (id) => api.post(`/api/artworks/${id}/view`),
};

// Events API
export const eventsAPI = {
  getAll: (params) => api.get("/api/events", { params }),
  getFiltersMeta: () => api.get("/api/events/filters-meta"),
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
  getAttendees: (id, params) =>
    api.get(`/api/events/${id}/attendees`, { params }),
  confirmAttendance: (id, token) =>
    api.get(`/api/events/${id}/confirm-attendance/${token}`),
  resendConfirmation: (id) => api.post(`/api/events/${id}/resend-confirmation`),
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
  getStats: () => api.get("/api/users/stats"),
  getFavorites: () => api.get("/api/users/favorites"),
  addFavorite: (artworkId) => api.post(`/api/users/favorites/${artworkId}`),
  removeFavorite: (artworkId) =>
    api.delete(`/api/users/favorites/${artworkId}`),
  getAllArtists: () => api.get("/api/users/artists/all"),
  getArtistProfile: (id) => api.get(`/api/users/artist/${id}`),
  getMyFiles: () => api.get("/api/users/storage/files"),
  syncStorage: (userId) => api.post("/api/users/storage/sync", { userId }),
};

// Admin API
export const adminAPI = {
  getAllUsers: (params) => api.get("/api/users", { params }),
  createUser: (userData) => api.post("/api/users", userData),
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
  // Support both old signature (id, qty) and new (object) for backward compat slightly, or just update callers
  add: (dataOrId, quantity) => {
    if (typeof dataOrId === "object")
      return api.post("/api/cart/add", dataOrId);
    return api.post("/api/cart/add", { artworkId: dataOrId, quantity });
  },
  update: (dataOrId, quantity) => {
    if (typeof dataOrId === "object")
      return api.patch("/api/cart/update", { ...dataOrId, quantity });
    return api.patch("/api/cart/update", { artworkId: dataOrId, quantity });
  },
  remove: (itemId) => api.delete(`/api/cart/remove/${itemId}`),
  clear: () => api.delete("/api/cart/clear"),
};

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post("/api/orders", orderData),
  getMine: () => api.get("/api/orders/mine"),
  getSales: () => api.get("/api/orders/sales"),
  getAll: (params) => api.get("/api/orders/all", { params }),
  getOne: (id) => api.get(`/api/orders/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/api/orders/${id}/status`, { status }),
  updateAddress: (id, shippingAddress) =>
    api.patch(`/api/orders/${id}/address`, { shippingAddress }),
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
  // Public Config
  getConfig: () => api.get("/api/platform/config"),
  // Settings (SuperAdmin only)
  getSettings: () => api.get("/api/platform/settings"),
  updateSettings: (settings) => api.patch("/api/platform/settings", settings),
  // Statistics (Admin & SuperAdmin)
  getStats: (period) => api.get("/api/platform/stats", { params: { period } }),
  // Storage (SuperAdmin)
  getStorageUsage: (params) => api.get("/api/platform/storage", { params }),
  updateStorageQuota: (userId, data) =>
    api.patch(`/api/platform/storage/${userId}`, data),
  getUserFiles: (userId) => api.get(`/api/platform/storage/${userId}/files`),
  // Maintenance mode (SuperAdmin only)
  toggleMaintenance: (data) => api.post("/api/platform/maintenance", data),
  // Asset Management (SuperAdmin only)
  uploadAsset: (formData) =>
    api.post("/api/platform/assets", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  listAssets: (folder) =>
    api.get("/api/platform/assets", { params: { folder } }),
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

// Messaging API
export const messagingAPI = {
  // Conversations
  getConversations: (params) => api.get("/api/conversations", { params }),
  getConversation: (id) => api.get(`/api/conversations/${id}`),
  createConversation: (data) => api.post("/api/conversations", data),
  archiveConversation: (id) => api.delete(`/api/conversations/${id}`),
  // Messages
  getMessages: (conversationId, params) =>
    api.get(`/api/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, data) =>
    api.post(`/api/conversations/${conversationId}/messages`, data),
  markAsRead: (conversationId) =>
    api.patch(`/api/conversations/${conversationId}/read`),
  // Offers
  makeOffer: (conversationId, amount, artworkId) =>
    api.post(`/api/conversations/${conversationId}/offer`, {
      amount,
      artworkId,
    }),
  respondToOffer: (conversationId, offerId, status) =>
    api.patch(`/api/conversations/${conversationId}/offer/${offerId}`, {
      status,
    }),
  // Unread count
  getUnreadCount: () => api.get("/api/conversations/unread/count"),
};

// Assign to main object for default export users
api.cart = apiCart;
api.orders = ordersAPI;
api.platform = platformAPI;
api.videos = videosAPI;

export default api;
