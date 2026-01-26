# Nemesis Server (Backend)

The backend API for Nemesis, built with **Express.js** and **MongoDB**.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudflare R2 Bucket (for image/video storage)
- Stripe Account (for payments)

### Installation

```bash
cd server
npm install
```

### Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5005
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/nemesis
TOKEN_SECRET=your-secret-key-at-least-32-chars
JWT_EXPIRES_IN=6h

# Cloudflare R2 (Storage)
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=nemesis
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NODE_ENV=development
```

### Running Locally

```bash
# Start with Nodemon (restarts on changes)
npm run dev

# Start standard
npm start
```

### Database Seeding

To populate the database with test data (users, artworks, reviews, events):

```bash
npm run seed
```

## 🏗️ Architecture

- **Models**: Mongoose schemas for User, Artwork, Order, Event, Review.
- **Auth**: JWT-based authentication using HTTP-only cookies.
- **Search**: N-gram based search optimization for titles and artist names.
- **Storage**: Direct upload to R2/S3 using AWS SDK.
- **Security**: Helmet, Rate Limiting, XSS Sanitzation, CORS.

## 🔌 API Endpoints

| Resource | Base Path | Description |
|----------|-----------|-------------|
| **Auth** | `/auth` | Login, Signup (Role support), Verify, Artist Application |
| **Artworks** | `/api/artworks` | CRUD Artworks, Uploads, Search |
| **Events** | `/api/events` | Calendar, Maps, Attendance, Filtering |
| **Orders** | `/api/orders` | Checkout, User History, Admin Overview |
| **Users** | `/api/users` | Profile, Favorites, Artists List |
| **Cart** | `/api/cart` | Persistent Shopping Cart |
| **Videos** | `/api/videos` | Secure Streaming, Purchases |
| **Payments** | `/api/payments` | Stripe Intents & Webhooks |
| **Admin** | `/api/admin` | Dashboard Stats, User Management |
| **Platform** | `/api/platform` | Settings, Stats, Storage |
| **Reviews** | `/api/reviews` | CRUD Reviews |
| **Conversations** | `/api/conversations` | Internal messaging & chat |
| **Geocode** | `/api/geocode` | Address to Coordinates, Reverse Geocoding |

## 🧪 Scripts

- `npm run seed`: Reset database with dummy data.
- `node scripts/migrate-ngrams.js`: Re-index artworks for search.
