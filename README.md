# Nemesis Art Platform

A full-stack art marketplace and community platform for artists, collectors, and event organizers.

<img src="https://www.cercledart.com/wp-content/uploads/2025/06/7638588-scaled.jpg" alt="nemesis banner" width="500" height="334">

## Overview

Nemesis connects artists with collectors through a modern e-commerce platform, event management system, and internal messaging. Built with the MERN stack (MongoDB, Express, React, Node.js).

**Artists** manage portfolios, sell artworks and video content, host events, and track analytics.
**Collectors** discover art via advanced search, purchase securely via Stripe, and communicate directly with artists.
**Admins & SuperAdmins** oversee users, moderate content, configure platform settings, and manage themes.

## Features

- **E-Commerce** -- Shopping cart, Stripe checkout, specialized order/ticket confirmations, and pay-per-view video purchases
- **Gallery & Search** -- N-gram search, category/medium/price filters, pagination with configurable page sizes
- **Events** -- Calendar view, interactive maps, attendance with email confirmation flow, capacity tracking
- **Messaging** -- Real-time internal chat (Socket.io) between collectors and artists with offer negotiation
- **Video Library & Streaming** -- Dedicated video hub, secure streaming, access control, and immersive playback
- **Artist Tools** -- Portfolio management, video content upload, sales analytics, revenue tracking
- **Admin Dashboard** -- User management, platform statistics, artist application review
- **SuperAdmin** -- Platform settings, VideoHero customization (assets/text), theme editor, and appearance configuration
- **Security** -- JWT (HTTP-only cookies), CSRF protection (double-submit cookie), rate limiting, XSS/NoSQL sanitization, Helmet headers
- **UI/UX Refinements** -- High-contrast dark mode designs and optimized sticky navigation
- **Geolocation** -- Leaflet cluster maps, address geocoding, event location display

## Tech Stack

| Layer     | Technologies                                           |
| --------- | ------------------------------------------------------ |
| Frontend  | React 19, Vite, Tailwind CSS, Shadcn/UI, Framer Motion |
| Backend   | Node.js, Express 5, MongoDB (Mongoose 9)               |
| Auth      | JWT, HTTP-only cookies, CSRF double-submit cookie      |
| Payments  | Stripe (Elements, Webhooks)                            |
| Storage   | Cloudflare R2 (S3-compatible), Cloudinary              |
| Email     | Resend (Handlebars templates)                          |
| Real-time | Socket.io                                              |
| Maps      | Leaflet, FullCalendar                                  |
| Deploy    | Docker, Nginx, docker-compose                          |

## Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Cloudflare R2 or S3-compatible storage credentials

### Installation

```bash
git clone https://github.com/MassFuer/tistart.git
cd tistart

# Server
cd server
npm install

# Client
cd ../client
npm install
```

### Environment Setup

- Copy `server/.env.example` to `server/.env` and fill in values (see [Server README](server/README.md))
- Create `client/.env` with `VITE_API_URL` (see [Client README](client/README.md))

### Run Development

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

The API runs on `http://localhost:5005` and the client on `http://localhost:5173`.

### Seed Database (Optional)

```bash
cd server
npm run seed
```

### Docker

```bash
docker compose up --build
```

This starts the client (Nginx on port 80), server (port 5005), and MongoDB (port 27017).

## Project Structure

```
nemesis/
  client/             # React frontend (Vite)
  server/             # Express API backend
  docker-compose.yml  # Multi-service orchestration
```

See [Client README](client/README.md) and [Server README](server/README.md) for detailed docs.

## Documentation

- [Frontend Documentation](client/README.md)
- [Backend Documentation](server/README.md)
- [Environment Template](server/.env.example)

## Author

**MassFuer** -- Fullstack Developer

## License

MIT License

## Links

- [Frontend (Live)](https://tistart.netlify.app/)
- [Backend (API)](https://tistart.onrender.com/)
