# Deployment Guide: Docker & Nginx Proxy Manager

This guide explains how to deploy this application on your Ubuntu homelab.

## 1. Prerequisites
- Docker and Docker Compose installed.
- Nginx Proxy Manager (NPM) running in a container.
- A domain or local hostname (e.g., `art.local` or `art.yourdomain.com`).

## 2. Configuration

### A. Environment Variables
I've implemented a "Smart Environment Switcher" that allows you to use a single `.env` file for all environments. 

1.  **Open `server/.env`**: You can now define all your environments in one place.
2.  **Set the Mode**: Simply change `NODE_ENV` to switch configurations:
    -   `NODE_ENV=development`: Uses `MONGODB_URI` (local).
    -   `NODE_ENV=server`: Uses `SERVER_MONGODB_URI` (Ubuntu Docker).
    -   `NODE_ENV=production`: Uses `PROD_MONGODB_URI` (Cloud).

3.  **Docker Setup**: In your Ubuntu server, just ensure `NODE_ENV=server` is set in your `.env` and it will automatically use the `mongo` container name for the database connection.

### B. Port Management
I've added a `docker-compose.env` file in the root. If ports `8080` (frontend) or `5005` (backend) are already used by your other containers, change them there:
```env
CLIENT_PORT=8080
SERVER_PORT=5005
```

## 3. Deployment Steps

Run the following commands in the project root:

```bash
# Build and start the containers in the background
docker-compose up -d --build
```

### Initial Data Seed
Once the containers are running, you need to seed the database with initial data (admin user, categories, etc.):
```bash
docker-compose exec server npm run seed
```

## 4. Nginx Proxy Manager Setup

Go to your NPM dashboard and add a new **Proxy Host**:

1.  **Domain Names**: `art.yourdomain.com` (or your chosen domain).
2.  **Scheme**: `http`
3.  **Forward Hostname / IP**: The IP of your Ubuntu server (or `host.docker.internal`).
4.  **Forward Port**: `8080` (or whatever you set in `docker-compose.env`).
5.  **Websockets Support**: **ON** (Required for Socket.io messaging).
6.  **SSL**: (Optional but recommended) Select your SSL certificate or get a new one via Let's Encrypt.

> [!NOTE]
> Since the frontend container handles all API proxying internally, you only need to expose the **Client** port (`8080`) in NPM. It will automatically handle requests to `/api`, `/auth`, and `/socket.io`.

## 5. Maintenance
- **View Logs**: `docker-compose logs -f`
- **Stop App**: `docker-compose down`
- **Update App**: `git pull` followed by `docker-compose up -d --build`
