"""
IELTS Speaking AI Practice App - Backend Server
FastAPI application with CORS middleware.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database.db import init_db, seed_sample_data
from .routers import questions, practice, exam


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - runs on startup/shutdown."""
    # Startup: Initialize database
    await init_db()
    await seed_sample_data()
    print("✅ Database initialized and seeded")
    yield
    # Shutdown: cleanup if needed
    print("👋 Server shutting down")


app = FastAPI(
    title="IELTS Speaking AI Practice",
    description="An AI-powered IELTS speaking practice application with custom question banks, practice mode, and mock exams.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(questions.router)
app.include_router(practice.router)
app.include_router(exam.router)


@app.get("/")
async def root():
    return {
        "message": "IELTS Speaking AI Practice API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
