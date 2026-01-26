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
  /components      # Reusable UI components
    /artwork       # ArtworkCard, etc.
    /common        # Buttons, Inputs, Modals
    /layout        # Navbar, Footer
    /map           # Leaflet map components
  /context         # React Context (Auth, Cart, Theme)
  /hooks           # Custom hooks (useAuth, useCart)
  /pages           # Page views (Gallery, Profile, etc.)
  /services        # API service (Axios configuration)
```

## 📦 Key Dependencies

- **Routing**: `react-router-dom`
- **Maps**: `react-leaflet`, `leaflet-geosearch`
- **Calendar**: `@fullcalendar/react`
- **Notifications**: `react-hot-toast`
- **Payments**: `@stripe/react-stripe-js`

## 🎨 Features & UI

- **Responsive Design**: Mobile-first layouts.
- **Dark Mode**: Toggleable theme support.
- **Real-time Search**: Debounced search filters.
- **Interactive Maps**: Cluster maps for events.
