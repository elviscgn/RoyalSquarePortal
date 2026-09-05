from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.client import ClientOut, ClientOverview, ClientUpdate
from app.schemas.case import CaseOut, CaseFilterParams
from app.services.client_service import client_service
from app.services.case_service import case_service

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("/{client_id}", response_model=ClientOut)
def get_client_profile(client_id: str):
    """Retrieves verified client profile."""
    client = client_service.get_client(client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID '{client_id}' not found."
        )
    return client


@router.get("/{client_id}/overview", response_model=ClientOverview)
def get_client_overview(client_id: str):
    """Retrieves client summary with financial position, goals, and active case counts."""
    overview = client_service.get_client_overview(client_id)
    if not overview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID '{client_id}' not found."
        )
    return overview


@router.patch("/{client_id}", response_model=ClientOut)
def update_client_profile(client_id: str, update_in: ClientUpdate):
    """Updates client profile attributes."""
    updated = client_service.update_client(client_id, update_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID '{client_id}' not found."
        )
    return updated


@router.get("/{client_id}/cases", response_model=List[CaseOut])
def get_client_cases(client_id: str):
    """Retrieves all cases associated with a client."""
    client = client_service.get_client(client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID '{client_id}' not found."
        )
    return case_service.list_cases(CaseFilterParams(client_id=client_id))
