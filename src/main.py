from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import (
    clients,
    cases,
    advisers,
    forms,
    evidence,
    accidents,
    providers,
)

app = FastAPI(
    title="Royal Square Portal API",
    description="Operational workflow & trust layer API for South African financial advisers.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend integrations (Elvis / Vite / Next.js / React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all modular routers
app.include_router(clients.router)
app.include_router(cases.router)
app.include_router(advisers.router)
app.include_router(forms.router)
app.include_router(evidence.router)
app.include_router(accidents.router)
app.include_router(providers.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": "Royal Square Portal API",
        "status": "online",
        "docs": "/docs",
        "adviser_demo_id": 1,
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "database": "connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
