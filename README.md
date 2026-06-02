# Ethara — Inventory & Order Management System

A production-ready, fully containerized Inventory & Order Management System built with **React**, **FastAPI**, and **PostgreSQL**, orchestrated with **Docker Compose**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Backend | Python 3.12 + FastAPI + SQLAlchemy |
| Database | PostgreSQL 16 |
| Containerization | Docker + Docker Compose |
| Frontend Serving | Nginx (Alpine) |

---

## Features

### Product Management
- Create, view, update, delete products
- Unique SKU enforcement
- Stock level tracking with low-stock alerts

### Customer Management
- Register, view, delete customers
- Unique email enforcement

### Order Management
- Create orders with multiple products
- Automatic stock deduction on order creation
- Stock restoration on order cancellation
- Automatic total calculation by the backend

### Dashboard
- Live summary: total products, customers, orders
- Low stock products list

---

## Getting Started (Docker Compose)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd "project Ethara"
cp .env.example .env
# Edit .env and set a strong POSTGRES_PASSWORD
```

### 2. Run with Docker Compose

```bash
docker compose up --build -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

### 3. Stop

```bash
docker compose down          # keep data
docker compose down -v       # remove volumes (wipes DB)
```

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Set DATABASE_URL to a local Postgres instance
set DATABASE_URL=postgresql://user:pass@localhost:5432/ethara_db

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
# Set VITE_API_URL to your backend
echo VITE_API_URL=http://localhost:8000 > .env
npm run dev
```

---

## API Reference

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | /products | List all products |
| POST | /products | Create a product |
| GET | /products/{id} | Get product by ID |
| PUT | /products/{id} | Update product |
| DELETE | /products/{id} | Delete product |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| GET | /customers | List all customers |
| POST | /customers | Create a customer |
| GET | /customers/{id} | Get customer by ID |
| DELETE | /customers/{id} | Delete customer |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| GET | /orders | List all orders |
| POST | /orders | Create an order |
| GET | /orders/{id} | Get order details |
| DELETE | /orders/{id} | Cancel order (restores stock) |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | /dashboard | Summary stats + low stock |

---

## Deployment

### Backend → Render / Railway / Fly.io

1. Push to GitHub
2. Connect the `backend/` directory as the root
3. Set environment variables:
   - `DATABASE_URL` — your managed PostgreSQL connection string
   - `ALLOWED_ORIGINS` — your frontend URL

### Frontend → Vercel / Netlify

1. Set build directory: `frontend/`
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variable:
   - `VITE_API_URL` — your deployed backend URL

---

## Project Structure

```
project Ethara/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, startup
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models/          # ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── crud/            # DB operations & business logic
│   │   └── routers/         # API route handlers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Products, Customers, Orders
│   │   ├── components/      # Sidebar, Topbar, Modal, Alert
│   │   ├── services/api.js  # Axios API client
│   │   └── index.css        # Global styles
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Business Logic

- Product SKU must be unique across all products
- Customer email must be unique across all customers
- Product quantity can never go below zero
- Orders are rejected if any item has insufficient stock
- Creating an order deducts stock atomically
- Cancelling an order restores stock for all items
- Order total is always calculated server-side (never trusted from client)
