from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database.config import get_db
from src.database.models import Client, Case
from src.schemas.entities import (
    ClientResponse,
    ClientOverviewResponse,
    ClientUpdate,
    ClientCreate,
)

router = APIRouter(prefix="/api/clients", tags=["Clients"])


@router.get("", response_model=List[ClientResponse])
def list_clients(db: Session = Depends(get_db)):
    """List all registered clients."""
    return db.query(Client).all()


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db)):
    """Retrieve full canonical record for a specific client."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Client {client_id} not found")
    return client


@router.get("/{client_id}/overview", response_model=ClientOverviewResponse)
def get_client_overview(client_id: int, db: Session = Depends(get_db)):
    """Retrieve client overview including compliance state, goals preview, and active cases count."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Client {client_id} not found")

    active_cases = (
        db.query(Case)
        .filter(Case.client_id == client_id, Case.status.notin_(["completed", "archived", "closed"]))
        .count()
    )

    return ClientOverviewResponse(
        id=client.id,
        name=client.name,
        id_number=client.id_number,
        address=client.address,
        mobile=client.mobile,
        email=client.email,
        adviser_id=client.adviser_id,
        financial_position=client.financial_position,
        consent_state=client.consent_state,
        consent_version=client.consent_version,
        consent_timestamp=client.consent_timestamp,
        consent_revoked=client.consent_revoked,
        retention_status=client.retention_status,
        deletion_request_state=client.deletion_request_state,
        created_at=client.created_at,
        updated_at=client.updated_at,
        compliance_state=client.compliance_state,
        goals=client.goals,
        active_cases_count=active_cases,
    )


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, payload: ClientUpdate, db: Session = Depends(get_db)):
    """Update editable fields on a client's profile."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Client {client_id} not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return client
