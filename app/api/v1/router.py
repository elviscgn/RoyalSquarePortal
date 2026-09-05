from fastapi import APIRouter
from app.api.v1.endpoints.clients import router as clients_router
from app.api.v1.endpoints.cases import router as cases_router
from app.api.v1.endpoints.advisers import router as advisers_router
from app.api.v1.endpoints.audit import router as audit_router

api_router = APIRouter()

api_router.include_router(clients_router)
api_router.include_router(cases_router)
api_router.include_router(advisers_router)
api_router.include_router(audit_router)
