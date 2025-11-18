from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from app.database import engine, init_db
from app.routers import (
    programs, plos, courses, clos, assessments, questions,
    students, scores, prerequisites, calculations, export, auth,
    clo_plo_mapping, rubrics, references
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown

app = FastAPI(
    title="LOES API",
    description="API cho module quản lý CLO/PLO/Prerequisite",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
default_origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://loes-peach.vercel.app",
]
extra_origins = os.getenv("FRONTEND_ORIGINS", "")
if extra_origins:
    default_origins.extend(
        [origin.strip() for origin in extra_origins.split(",") if origin.strip()]
    )

logger.info("CORS allow_origins: %s", default_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(programs.router, prefix="/api/programs", tags=["Programs"])
app.include_router(plos.router, prefix="/api/plos", tags=["PLOs"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(clos.router, prefix="/api/clos", tags=["CLOs"])
app.include_router(assessments.router, prefix="/api/assessments", tags=["Assessments"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(scores.router, prefix="/api/scores", tags=["Scores"])
app.include_router(prerequisites.router, prefix="/api/courses", tags=["Prerequisites"])
app.include_router(calculations.router, prefix="/api/calculate", tags=["Calculations"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
app.include_router(clo_plo_mapping.router, prefix="/api", tags=["CLO-PLO Mapping"])
app.include_router(rubrics.router, prefix="/api", tags=["Rubrics"])
app.include_router(references.router, prefix="/api", tags=["References"])

@app.get("/")
async def root():
    return {"message": "LOES API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

