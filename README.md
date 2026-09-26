# 🐧 Penguin Cal

**Penguin Cal** is a lightweight, multi-calendar suite built with a FastAPI backend and a React (Vite & FullCalendar) frontend. It supports advanced event management, recurring schedules (RRULE), calendar sharing, .ics file imports/exports, theme customizations, and built-in user administration.

---

## 🚀 Features

* **Multi-Calendar Support**: Create, customize, and organize events across multiple personal or shared calendars.
* **Recurring Events**: Advanced recurrence builder supporting daily, weekly, monthly, and yearly repeats with customizable intervals and end conditions.
* **Calendar Sharing**: Securely share custom calendars with other registered users on the platform.
* **Import & Export**: Seamlessly export individual calendars to `.ics` format or import external `.ics` files.
* **Theme Customization**: Choose from multiple built-in themes (Light, Dark, Dracula, Nord, Solarized, Forest, Sunset) or stick with System Auto mode.
* **User Roles & Admin Panel**: Role-based access control with an integrated administration panel for managing users, resetting passwords, and toggling admin permissions.
* **Responsive Dashboard**: Fully responsive design tailored for both desktop and mobile views.

---

## 🛠️ Project Architecture

```text
penguin-cal/
├── backend/                    # FastAPI Python backend
│   ├── routers/                # API routes (Auth, Calendars, Events, Admin)
│   ├── models.py               # SQLModel database models
│   ├── schemas.py              # Pydantic validation schemas
│   ├── database.py             # SQLite connection setup
│   └── Dockerfile              # Backend container definition
├── frontend/                   # React & Vite frontend
│   ├── src/                    # Components, hooks, and UI views
│   ├── public/                 # Logo assets and static files
│   ├── nginx.conf              # Nginx routing configuration
│   └── Dockerfile              # Frontend container definition
├── docker-compose.dev.yaml     # Local development compose file
├── docker-compose.yaml         # Simple compose file
├── docker-compose.prod.yaml    # Production deployment compose file
└── .env                        # Environment variables configuration
```

---

## 🐳 Running with Docker

### 1. Local Development

To spin up the services locally with live builds, use the development compose file:

```bash
docker compose -f docker-compose.dev.yaml up --build

```

* **Frontend:** `http://localhost` (or port 80)
* **Backend API Docs:** `http://localhost:8000/docs`

### 2. Production Deployment 

To run a simple setup (no Traefik or Homepage integration):

```bash
docker compose -f docker-compose.yaml pull
docker compose -f docker-compose.yaml up -d

```

### 3. Production Deployment (Using Pre-built Docker Hub Images)

To run the production setup configured with Traefik and Homepage label integration:

Create a `.env` file in the root directory based on the following template:

```env
DOMAIN=yourdomain.com
SERVICE=cal
SERVICE_NAME=Penguin Cal
GROUP=Applications
DESCRIPTION=Lightweight multi-calendar suite
JWT_SECRET=super-secret-key-change-this-for-production

```
Spin up the container:


```bash
docker compose -f docker-compose.prod.yaml pull
docker compose -f docker-compose.prod.yaml up -d

```

---

## 📄 License

This project is open-source and available under the MIT License.


