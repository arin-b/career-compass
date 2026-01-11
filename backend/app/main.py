from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.models import models
from app.api.v1.endpoints import chat, roadmaps, auth
from app.core.logger import get_logger
from dotenv import load_dotenv

load_dotenv()

logger = get_logger()

app = FastAPI(title="Student Career Counselor AI")

import os

# ...

origins = os.getenv("ALLOWED_ORIGINS", "https://career-compass-frontend-6cv7.onrender.com").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down...")


app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/v1")
app.include_router(roadmaps.router, prefix="/api/v1/roadmaps")

@app.get("/")
def read_root():
    return {"message": "Welcome to Career Compass API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
