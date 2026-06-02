import os
import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base
from app.models import Product, Customer, Order, OrderItem
from app.routers import products, customers, orders, dashboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Retry DB connection on startup (container boot race)
for attempt in range(10):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        break
    except Exception as e:
        logger.warning(f"DB not ready (attempt {attempt + 1}/10): {e}")
        time.sleep(3)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ethara Inventory & Order Management API",
    description="Production-ready API for managing products, customers, and orders.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Ethara API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
