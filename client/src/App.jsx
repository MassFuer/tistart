import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { MessagingProvider } from "./context/MessagingContext";
import { NavigationProvider } from "./context/NavigationContext";
import { LanguageProvider } from "./context/LanguageContext";

// Layout
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResendEmailPage from "./pages/ResendEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import GalleryPage from "./pages/GalleryPage";
import ArtworkDetailPage from "./pages/ArtworkDetailPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import DashboardPage from "./pages/DashboardPage";
import FavoritesPage from "./pages/FavoritesPage";
import ApplyArtistPage from "./pages/ApplyArtistPage";
import PricingPage from "./pages/PricingPage";
import VideoPage from "./pages/VideoPage";
import VideoDetailPage from "./pages/VideoDetailPage";
import ConfirmAttendancePage from "./pages/ConfirmAttendancePage";

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

// Error Boundaries
import ErrorBoundary from "./components/common/ErrorBoundary";
import RouteErrorBoundary from "./components/common/RouteErrorBoundary";

// App css removed


// Helper to wrap a page element with route-level error boundary
const withEB = (element) => <RouteErrorBoundary>{element}</RouteErrorBoundary>;

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <NavigationProvider>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
            <MessagingProvider>
            <CartProvider>
              <div className="app min-h-screen flex flex-col">
              <Navbar />
              <main className="main-content flex-1 flex flex-col">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={withEB(<HomePage />)} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                  <Route path="/resend-email" element={<ResendEmailPage />} />
                  <Route path="/gallery" element={withEB(<GalleryPage />)} />
                  <Route path="/artworks/:id" element={withEB(<ArtworkDetailPage />)} />
                  <Route path="/videos" element={withEB(<VideoPage />)} />
                  <Route path="/videos/:id" element={withEB(<VideoDetailPage />)} />
                  <Route path="/events" element={withEB(<EventsPage />)} />
                  <Route path="/events/:id" element={withEB(<EventDetailPage />)} />
                  <Route path="/events/:id/confirm-attendance/:token" element={withEB(<ConfirmAttendancePage />)} />
                  <Route path="/artists/:id" element={withEB(<ArtistProfilePage />)} />

                  {/* Protected Routes (any logged-in user) */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>{withEB(<DashboardPage />)}</ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>{withEB(<DashboardPage />)}</ProtectedRoute>
                    }
                  />
                  <Route
                    path="/favorites"
                    element={
                      <ProtectedRoute>{withEB(<FavoritesPage />)}</ProtectedRoute>
                    }
                  />
                  <Route
                    path="/apply-artist"
                    element={
                      <ProtectedRoute>{withEB(<ApplyArtistPage />)}</ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>{withEB(<CartPage />)}</ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>{withEB(<CheckoutPage />)}</ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-orders"
                    element={
                      <ProtectedRoute>{withEB(<DashboardPage />)}</ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>{withEB(<OrderDetailPage />)}</ProtectedRoute>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>{withEB(<MessagesPage />)}</ProtectedRoute>
                    }
                  />

                  {/* Artist Routes (verified artists only) */}

                  <Route
                    path="/artworks/new"
                    element={
                      <ArtistRoute>{withEB(<ArtworkFormPage />)}</ArtistRoute>
                    }
                  />
                  <Route
                    path="/artworks/:id/edit"
                    element={
                      <ArtistRoute>{withEB(<ArtworkFormPage />)}</ArtistRoute>
                    }
                  />
                  <Route
                    path="/events/new"
                    element={
                      <ArtistRoute>{withEB(<EventFormPage />)}</ArtistRoute>
                    }
                  />
                  <Route
                    path="/events/:id/edit"
                    element={
                      <ArtistRoute>{withEB(<EventFormPage />)}</ArtistRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>{withEB(<AdminPage />)}</AdminRoute>
                    }
                  />

                  {/* SuperAdmin Routes */}
                  <Route
                    path="/superadmin"
                    element={
                      <SuperAdminRoute>{withEB(<SuperAdminPage />)}</SuperAdminRoute>
                    }
                  />

                  <Route path="/pricing" element={withEB(<PricingPage />)} />

                  {/* 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster position="top-center" closeButton />
            </CartProvider>
            </MessagingProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
        </NavigationProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
