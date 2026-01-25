import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";

// Layout
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResendEmailPage from "./pages/ResendEmailPage";
import GalleryPage from "./pages/GalleryPage";
import ArtworkDetailPage from "./pages/ArtworkDetailPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import ProfilePage from "./pages/ProfilePage";
import FavoritesPage from "./pages/FavoritesPage";
import ApplyArtistPage from "./pages/ApplyArtistPage";
import ArtistDashboard from "./pages/ArtistDashboard";
import MyArtworksPage from "./pages/MyArtworksPage";
import ArtworkFormPage from "./pages/ArtworkFormPage";
import EventFormPage from "./pages/EventFormPage";
import ArtistProfilePage from "./pages/ArtistProfilePage";
import AdminPage from "./pages/AdminPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import NotFoundPage from "./pages/NotFoundPage";

import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";

// Protected Route Components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ArtistRoute from "./components/auth/ArtistRoute";
import AdminRoute from "./components/auth/AdminRoute";
import SuperAdminRoute from "./components/auth/SuperAdminRoute";

// Error Boundary
import ErrorBoundary from "./components/common/ErrorBoundary";

import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <div className="app">
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route
                    path="/verify-email/:token"
                    element={<VerifyEmailPage />}
                  />
                  <Route path="/resend-email" element={<ResendEmailPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/:id" element={<EventDetailPage />} />
                  <Route path="/artists/:id" element={<ArtistProfilePage />} />

                  {/* Protected Routes (any logged-in user) */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/favorites"
                    element={
                      <ProtectedRoute>
                        <FavoritesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/apply-artist"
                    element={
                      <ProtectedRoute>
                        <ApplyArtistPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <CartPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-orders"
                    element={
                      <ProtectedRoute>
                        <MyOrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetailPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Artist Routes (verified artists only) */}
                  <Route
                    path="/dashboard"
                    element={
                      <ArtistRoute>
                        <ArtistDashboard />
                      </ArtistRoute>
                    }
                  />
                  <Route
                    path="/my-artworks"
                    element={
                      <ArtistRoute>
                        <MyArtworksPage />
                      </ArtistRoute>
                    }
                  />
                  <Route
                    path="/artworks/new"
                    element={
                      <ArtistRoute>
                        <ArtworkFormPage />
                      </ArtistRoute>
                    }
                  />
                  <Route
                    path="/artworks/:id/edit"
                    element={
                      <ArtistRoute>
                        <ArtworkFormPage />
                      </ArtistRoute>
                    }
                  />
                  <Route
                    path="/events/new"
                    element={
                      <ArtistRoute>
                        <EventFormPage />
                      </ArtistRoute>
                    }
                  />
                  <Route
                    path="/events/:id/edit"
                    element={
                      <ArtistRoute>
                        <EventFormPage />
                      </ArtistRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />

                  {/* SuperAdmin Routes */}
                  <Route
                    path="/superadmin"
                    element={
                      <SuperAdminRoute>
                        <SuperAdminPage />
                      </SuperAdminRoute>
                    }
                  />

                  {/* 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster position="top-right" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
