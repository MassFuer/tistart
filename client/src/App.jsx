import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { MessagingProvider } from "./context/MessagingContext";

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
import DashboardPage from "./pages/DashboardPage";
import FavoritesPage from "./pages/FavoritesPage";
import ApplyArtistPage from "./pages/ApplyArtistPage";

import ArtworkFormPage from "./pages/ArtworkFormPage";
import EventFormPage from "./pages/EventFormPage";
import ArtistProfilePage from "./pages/ArtistProfilePage";
import AdminPage from "./pages/AdminPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import NotFoundPage from "./pages/NotFoundPage";

import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import MessagesPage from "./pages/MessagesPage";

// Protected Route Components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ArtistRoute from "./components/auth/ArtistRoute";
import AdminRoute from "./components/auth/AdminRoute";
import SuperAdminRoute from "./components/auth/SuperAdminRoute";

// Error Boundary
import ErrorBoundary from "./components/common/ErrorBoundary";

// App css removed


function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <MessagingProvider>
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
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
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
                        <DashboardPage />
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
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>
                        <MessagesPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Artist Routes (verified artists only) */}

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
            <Toaster position="top-center" />
            </CartProvider>
            </MessagingProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
