import { createContext, useState, useEffect, useContext } from "react";
import { authAPI, default as api } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verify token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initial verify call will also capture CSRF token via interceptor
        const response = await authAPI.verify();
        setUser(response.data.data);
        setIsAuthenticated(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        // If verify fails (not logged in), fetch a fresh CSRF token for signup/login
        try {
          await api.get("/auth/csrf-token");
        } catch (csrfError) {
          console.error("Failed to fetch initial CSRF token:", csrfError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    setUser(response.data.data);
    setIsAuthenticated(true);
    return response.data.data;
  };

  const signup = async (userData) => {
    const response = await authAPI.signup(userData);
    return response.data.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const applyAsArtist = async (artistData) => {
    const response = await authAPI.applyArtist(artistData);
    setUser(response.data.data);
    return response.data;
  };

  const updateArtistInfo = async (artistInfo) => {
    const response = await authAPI.updateArtistInfo(artistInfo);
    setUser(response.data.data);
    return response.data.data;
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await authAPI.verify();
      setUser(response.data.data);
      return response.data.data;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isArtist: user?.role === "artist",
    isVerifiedArtist: (user?.role === "artist" && user?.artistStatus === "verified") || user?.role === "admin" || user?.role === "superAdmin",
    isAdmin: user?.role === "admin" || user?.role === "superAdmin",
    isSuperAdmin: user?.role === "superAdmin",
    login,
    signup,
    logout,
    applyAsArtist,
    updateArtistInfo,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
