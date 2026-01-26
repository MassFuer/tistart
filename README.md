# Nemesis Art Platform

A comprehensive platform for artists to showcase and sell their work, manage events, and connect with art lovers.

<img src="https://www.cercledart.com/wp-content/uploads/2025/06/7638588-scaled.jpg" alt="nemesis banner" width="500" height="334">

## 🎨 Overview

Nemesis is a full-stack art marketplace and community platform where:
- **Art Lovers** can browse, favorite, and purchase artworks (paintings, sculpture, digital, music, video).
- **Artists** can manage their portfolio, sell products, host events, and track sales.
- **Admins** oversee the platform, manage users, and monitor performance.

## ✨ Key Features

- **E-Commerce**: Full shopping cart, checkout, payments (Stripe), and order management.
- **Artist Portfolio**: Artists upload images/videos (stored on Cloudflare R2), manage pricing, and view analytics.
- **Events Calendar**: Interactive map and calendar for art exhibitions, concerts, and workshops.
- **Video Streaming**: Pay-per-view video content with secure streaming.
- **Geolocation**: Find events and artists near you.
- **Advanced Search**: N-gram search by title, artist, or company name.
- **Role-Based Access**: User, Artist (verified), Admin, and SuperAdmin roles.

## 🛠️ Tech Stack

**Frontend:**
- React 19 (Vite)
- React Router DOM
- FullCalendar & React Leaflet (Maps)
- Stripe Elements
- Tailwind CSS & Shadcn UI
- Sonner (Notifications)

**Backend:**
- Node.js & Express
- MongoDB (Mongoose)
- JWT Authentication (HTTP-only cookies)
- Cloudflare R2 (Object Storage)
- Nodemailer (Email)

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or Atlas URI
- Cloudflare R2 credentials (or AWS S3 compatible)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/MassFuer/tistart.git
    cd tistart
    ```

2.  **Install Dependencies**
    ```bash
    # Root (optional if you have scripts)
    npm install

    # Server
    cd server
    npm install

    # Client
    cd ../client
    npm install
    ```

3.  **Environment Setup**
    - Create `server/.env` (see [Server Docs](server/README.md))
    - Create `client/.env` (see [Client Docs](client/README.md))

4.  **Run Application**

    *Terminal 1 (Backend):*
    ```bash
    cd server
    npm run dev
    ```

    *Terminal 2 (Frontend):*
    ```bash
    cd client
    npm run dev
    ```

5.  **Seed Data (Optional)**
    ```bash
    cd server
    npm run seed
    ```

## 📚 Documentation

- [Frontend Documentation](client/README.md)
- [Backend Documentation](server/README.md)

## 📝 Project Summary

**Nemesis** represents a complete solution for the modern art market. It bridges the gap between digital and physical art sales by offering:

1.  **For Artists**: A professional suite of tools to manage inventory, track sales, and reach a global audience without the overhead of building their own website. Features like "Quitzon and Sons" company branding (as seen in our extensive search optimization) support professional identities.
2.  **For Collectors**: A secure, transparent platform to discover art via advanced search (including n-gram partial matching), view high-quality media (images/video), and purchase with confidence via Stripe.
3.  **For Community**: An event-driven architecture that brings people together through physical and digital events, fostering a vibrant art ecosystem.

The project demonstrates a robust implementation of the MERN stack (MongoDB, Express, React, Node) with enterprise-grade features like Authentication (JWT), Role-Based Access Control (RBAC), secure file storage (Cloudflare R2), and geolocation services.

## 👥 Authors

- **MassFuer** - *Fullstack Developer*

## 📄 License

This project is licensed under the MIT License.

## Links

> [!CAUTION]
> project not deployed yet  

- [Frontend](https://tistart.netlify.app/)
- [Backend](https://tistart.onrender.com/)
- [Database](https://www.mongodb.com/cloud/atlas)   