# Nemesis Client (Frontend)

The frontend application for Nemesis, built with **React 19** and **Vite**.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
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
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Optional (for payments)
```

### Running Locally

```bash
npm run dev
```
Access the app at `http://localhost:5173`.


## 📂 Project Structure

```
/src
  /components
    /ui            # Shadcn UI components (Button, Card, etc.)
    /artwork       # ArtworkCard, etc.
    /common        # Reusable custom components
    /layout        # Navbar, Footer
    /map           # Leaflet map components
  /context         # React Context (Auth, Cart, Theme)
  /hooks           # Custom hooks (useAuth, useCart)
  /pages           # Page views (Gallery, Profile, etc.)
  /services        # API service (Axios configuration)
```

## 📦 Key Dependencies

- **Routing**: `react-router-dom`
- **UI Framework**: `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`
- **Components**: Radix UI Primitives (via Shadcn)
- **Maps**: `react-leaflet`, `leaflet-geosearch`
- **Calendar**: `@fullcalendar/react`, `react-datepicker`
- **Notifications**: `sonner`
- **Icons**: `lucide-react`, `react-icons`
- **Animations**: `framer-motion`
- **Payments**: `@stripe/react-stripe-js`

## 🎨 Features & UI

- **Modern UI**: Built with Shadcn UI & Tailwind CSS.
- **Responsive Design**: Mobile-first layouts.
- **Dark Mode**: Toggleable theme support.
- **Real-time Search**: Debounced search filters.
- **Interactive Maps**: Cluster maps for events.
- **Toast Notifications**: Stackable, theme-aware notifications via Sonner.
- **Admin Dashboard**: Comprehensive stats, data tables, and management tools.
- **Artist Onboarding**: Dedicated application flow with status tracking.
- **Event Discovery**: Advanced filtering and map integration.
- **Direct Messaging**: Internal chat system between collectors and artists.
- **Custom Video Player**: Simplified, elegant video playback experience.
- **Unified Dashboards**: Dedicated views for Artists (Sales, Analytics) and Collectors (Purchases, Favorites).
    - *New*: Streamlined **EventManagement** interface.
    - *New*: Enhanced mobile responsiveness for dashboard tabs.