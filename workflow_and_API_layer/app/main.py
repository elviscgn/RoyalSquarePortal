from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.workflows.base import WorkflowException

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Royal Square Financial - Adviser Operations Platform (Orchestration & Workflow Engine)",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(WorkflowException)
async def workflow_exception_handler(request: Request, exc: WorkflowException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"message": exc.message, "details": exc.details},
    )


# Mount routers (both /api/v1 and /api for compatibility)
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "Backend A - Workflow & API Orchestrator",
        "version": settings.VERSION,
    }


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to Royal Square Financial Adviser Operations Platform API",
        "docs_url": "/docs",
        "health_check": "/health",
    }
