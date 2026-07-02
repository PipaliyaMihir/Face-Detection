"""
main.py — FastAPI application entry point.

Connects to MongoDB on startup, loads known faces, and serves the API.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from database import init_db, close_db
from face_engine import load_known_faces
from routes.people import router as people_router
from routes.attendance import router as attendance_router
from routes.auth import router as auth_router
from routes.departments import router as departments_router

# Load environment variables
load_dotenv()

# Directory for face images
KNOWN_FACES_DIR = os.path.join(os.path.dirname(__file__), "known_faces")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # --- Startup ---
    load_dotenv()
    os.makedirs(KNOWN_FACES_DIR, exist_ok=True)
    await init_db()
    await load_known_faces()
    print("🚀 Attendance System API is ready!")
    yield
    # --- Shutdown ---
    await close_db()


app = FastAPI(
    title="Attendance System API",
    description="Face recognition-based attendance system powered by FastAPI & MongoDB.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the React dev server and any origin
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static files — serve face images
# ---------------------------------------------------------------------------
app.mount("/known_faces", StaticFiles(directory=KNOWN_FACES_DIR), name="known_faces")

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(people_router)
app.include_router(attendance_router)
app.include_router(auth_router)
app.include_router(departments_router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "message": "Attendance System API",
        "status": "running",
        "database": "MongoDB",
        "docs": "/docs",
    }
