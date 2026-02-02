# Nemesis Server

Express.js + MongoDB backend API for the Nemesis art platform.

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Cloudflare R2 bucket (image/video storage)
- Stripe account (payments)
- Resend account (transactional emails)

### Installation

```bash
cd server
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

**Required:**

| Variable       | Description                       |
| -------------- | --------------------------------- |
| `MONGODB_URI`  | MongoDB connection string         |
| `TOKEN_SECRET` | JWT signing secret (min 32 chars) |

**Server:**

| Variable         | Default                 | Description                                |
| ---------------- | ----------------------- | ------------------------------------------ |
| `PORT`           | `5005`                  | Server port                                |
| `NODE_ENV`       | `development`           | Environment (`development` / `production`) |
| `CLIENT_URL`     | `http://localhost:5173` | Frontend URL for CORS and email links      |
| `JWT_EXPIRES_IN` | `6h`                    | JWT token expiry                           |

**Services:**

| Variable                | Description                             |
| ----------------------- | --------------------------------------- |
| `RESEND_API_KEY`        | Resend API key for transactional emails |
| `EMAIL_FROM`            | Sender email address                    |
| `STRIPE_SECRET_KEY`     | Stripe secret key                       |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret           |
| `R2_ENDPOINT`           | Cloudflare R2 endpoint URL              |
| `R2_ACCESS_KEY_ID`      | R2 access key                           |
| `R2_SECRET_ACCESS_KEY`  | R2 secret key                           |
| `R2_BUCKET_NAME`        | R2 bucket name                          |
| `R2_PUBLIC_URL`         | R2 public URL for serving files         |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                   |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                      |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                   |

Environment variables are validated on startup via `utils/validateEnv.js`. Missing required variables will prevent the server from starting.

### Running

```bash
npm run dev     # Development (nodemon)
npm start       # Production
npm run seed    # Seed database with test data
npm run swagger # Generate API docs
```

## Architecture

```
server/
  config/           # Express middleware setup (CORS, Helmet, CSRF, sanitization)
  db/               # MongoDB connection
  middleware/       # Auth (JWT), RBAC, CSRF, rate limiting, validation
  models/           # Mongoose schemas
  routes/           # Express route handlers
  socket/           # Socket.io initialization and event handlers
  templates/        # Handlebars email templates
  utils/            # Helpers (email, pagination, response, R2, sanitize, etc.)
  seeds/            # Database seeder
  server.js         # HTTP server entry point + graceful shutdown
  app.js            # Express app setup + route mounting
```

### Models

| Model | Description |
|-------|-------------|
| `User` | Users with roles (user, artist, admin, superAdmin), artist info, favorites, storage quota |
| `Artwork` | Art pieces with images, pricing, categories, n-gram search fields |
| `Event` | Events with location (GeoJSON), calendar, attendees with email confirmation |
| `Order` | Orders with items, Stripe payment tracking, status workflow |
| `Review` | Artwork reviews with ratings |
| `Conversation` | Messaging threads between users with offer negotiation history |
| `Message` | Individual messages within conversations |
| `PlatformSettings` | Singleton config for theme, hero, display preferences, SEO |
| `PlatformStats` | Cached platform-wide statistics |
| `VideoPurchase` | Pay-per-view video purchase records |

### Middleware

| Middleware | Purpose |
|------------|---------|
| `jwt.middleware` | JWT token verification from HTTP-only cookies |
| `role.middleware` | Role-based access control (isArtist, isAdmin, isSuperAdmin, isOwnerOrAdmin) |
| `csrf.middleware` | Double-submit cookie CSRF protection with Origin validation |
| `rateLimit.middleware` | Rate limiters (auth, API, sensitive ops, cart, orders, purchases) |
| `validation.middleware` | express-validator input validation |

### Security

- **Authentication**: JWT tokens stored in HTTP-only, Secure, SameSite cookies
- **CSRF**: Double-submit cookie pattern + Origin header validation (skips webhooks)
- **Rate Limiting**: Tiered limits -- 10/5min for auth, 60/min for API, 3/hr for sensitive ops
- **Input Sanitization**: Custom NoSQL injection prevention + XSS sanitization via `xss` library
- **Headers**: Helmet security headers
- **CORS**: Whitelist-based origin validation with credentials support

## API Endpoints

| Resource | Base Path | Key Operations |
|----------|-----------|----------------|
| **Auth** | `/auth` | Signup, login, logout, email verification, password reset, artist application |
| **Artworks** | `/api/artworks` | CRUD, image upload, search, artist stats, favorites |
| **Events** | `/api/events` | CRUD, calendar, attendance (with email confirmation), filters, map data |
| **Orders** | `/api/orders` | Checkout, user history, artist sales, admin overview |
| **Users** | `/api/users` | Profile, favorites, artist directory, admin user management |
| **Cart** | `/api/cart` | Add/update/remove items, persistent cart |
| **Videos** | `/api/videos` | CRUD, secure streaming, purchases |
| **Payments** | `/api/payments` | Stripe payment intents |
| **Webhooks** | `/api/payments/webhook` | Stripe webhook handler (raw body) |
| **Platform** | `/api/platform` | Settings, stats, storage management, public config |
| **Reviews** | `/api` | Artwork reviews CRUD |
| **Conversations** | `/api/conversations` | Messaging threads, offers |
| **Geocode** | `/api/geocode` | Forward/reverse geocoding |

API documentation available at `/api-docs` (Swagger UI) after running `npm run swagger`.

## Email Templates

Handlebars templates in `templates/emails/` with shared partials (header, footer):

- `verification` -- Email address verification
- `welcome` -- Post-verification welcome
- `password-reset` -- Password reset link
- `order-confirmation` -- Order receipt for artworks
- `ticket-confirmation` -- Specialized receipt for event registrations
- `artist-application` -- Application received
- `artist-status` -- Application approved/suspended
- `event-attendance` -- Event attendance confirmation

## Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5005
CMD ["node", "server.js"]
```

The server supports graceful shutdown (SIGTERM/SIGINT) -- closes HTTP connections and MongoDB before exiting.

## Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start with nodemon (auto-restart) |
| `npm start`       | Production start                  |
| `npm run seed`    | Seed database with test data      |
| `npm run swagger` | Generate Swagger API docs         |
| `npm run lint`    | Run ESLint                        |
| `npm run format`  | Run Prettier                      |
