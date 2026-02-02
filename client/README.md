# Nemesis Client

React 19 frontend for the Nemesis art platform, built with Vite, Tailwind CSS, and Shadcn/UI.

## Getting Started

### Prerequisites

- Node.js v18+
- Backend server running on port 5005

### Installation

```bash
cd client
npm install
```

### Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5005
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5005` | Backend API URL (no trailing slash) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | -- | Stripe publishable key (for checkout) |

### Running

```bash
npm run dev      # Development server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
client/src/
  components/
    admin/          # Admin dashboard components
    artwork/        # ArtworkCard and artwork-related components
    auth/           # ProtectedRoute, ArtistRoute, AdminRoute, SuperAdminRoute
    common/         # Reusable: ErrorBoundary, RouteErrorBoundary, FilterSidebar,
                    #   StarRating, QuantityControl, PageSizeSelector, Loading
    dashboard/      # Dashboard tabs and widgets
    event/          # AttendeesModal, event components
    events/         # Event listing components
    layout/         # Navbar, Footer
    map/            # Leaflet map, LocationDisplay, LocationPicker
    messaging/      # Chat UI components
    payment/        # Stripe checkout components
    review/         # ReviewSection
    ui/             # Shadcn/UI primitives (Button, Card, Dialog, Select, etc.)
    video/          # VideoPlayer, VideoGallery, VideoHero, VideoLibraryCard, VideoFilters
  context/
    AuthContext     # Authentication state, login/logout, user data
    CartContext     # Shopping cart state and operations
    ThemeContext    # Light/dark theme toggle
    MessagingContext # Real-time messaging (Socket.io)
    NavigationContext # Route-level navigation state
  hooks/ & lib/
    useListing      # Generic paginated listing hook (filters, pagination, sorting)
    useScrollRestore # Restore scroll position on navigation
    use-mobile      # Mobile breakpoint detection
    formatters      # Shared formatters (formatPrice, formatDate, getArtistDisplayName)
    utils           # Tailwind class merging (cn)
  pages/
    HomePage        # Landing page with hero, featured artworks, FAQ
    GalleryPage     # Artwork gallery with filters, search, pagination
    ArtworkDetailPage # Artwork detail with reviews, related works
    EventsPage      # Event listing with filters, map/calendar views
    EventDetailPage # Event detail with registration, attendees modal
    ConfirmAttendancePage # Email confirmation landing page
    VideoLibraryPage # Dedicated video library with filters and categories
    VideoDetailPage # Video player with purchase gating and immersive view
    DashboardPage   # User/Artist dashboard (tabs: overview, orders, artworks, events, analytics)
    CartPage        # Shopping cart
    CheckoutPage    # Stripe checkout
    OrderDetailPage # Order receipt/status
    MessagesPage    # Conversations list and chat
    AdminPage       # Admin user/content management
    SuperAdminPage  # Platform settings, theme editor, appearance config
    ArtistProfilePage # Public artist profile
    PricingPage     # Subscription/pricing info
    Login/Signup/Verify/Reset pages # Auth flow
  services/
    api.js          # Axios instance with CSRF token, auth interceptor, all API methods
```

## Key Dependencies

| Category | Packages |
|----------|----------|
| Routing | `react-router-dom` |
| UI Framework | `tailwindcss`, Shadcn/UI (`@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`) |
| Animation | `framer-motion` |
| Maps | `react-leaflet`, `leaflet-geosearch` |
| Calendar | `@fullcalendar/react`, `react-datepicker` |
| Payments | `@stripe/react-stripe-js`, `@stripe/stripe-js` |
| Icons | `lucide-react`, `react-icons` |
| Notifications | `sonner` |
| Real-time | `socket.io-client` |
| Markdown | `react-markdown`, `react-simplemde-editor` |
| Fonts | `@fontsource/inter`, `@fontsource/geist-sans`, `@fontsource/manrope`, `@fontsource/poppins`, `@fontsource/roboto` |

## Features

- **Responsive Design** -- Mobile-first layouts with sticky action bars and adaptive grids
- **Dark Mode** -- Theme toggle with mode-specific CSS variables and high-contrast accessibility for critical checkout actions
- **Route Error Boundaries** -- Errors in individual pages don't crash the entire app
- **Dynamic Page Sizes** -- Configurable items-per-page via PageSizeSelector component
- **CSRF Protection** -- Automatic CSRF token injection via axios request interceptor
- **Real-time Chat** -- Socket.io-powered messaging with typing indicators
- **Interactive Maps** -- Leaflet cluster maps for events, geocoded locations
- **Secure Video** -- Preview mode for non-purchased videos, streaming access control
- **Advanced Filters** -- Responsive filter sidebar (sheet on mobile, aside on desktop)
- **Platform Config** -- Display settings (currency, page sizes, colors) driven by PlatformSettings API

## Docker

Multi-stage build with Nginx for production:

```dockerfile
# Build
FROM node:20-alpine AS build
COPY . .
RUN npm ci && npm run build

# Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

The Nginx config handles SPA routing, static asset caching, and proxies `/api/`, `/auth/`, and `/socket.io/` to the backend.
