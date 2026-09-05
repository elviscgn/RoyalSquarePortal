from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.database.config import get_db
from src.database.models import Client, Case, WorkflowStep, Evidence, AuditEvent
from src.database.enums import CaseType, WorkflowStepOwner, EvidenceType

router = APIRouter(prefix="/api/accidents", tags=["Accident Mode Sync"])


class AccidentSyncPayload(BaseModel):
    client_id: int
    captured_timestamp: Optional[datetime] = None
    latitude: float
    longitude: float
    gps_accuracy: float = 5.0
    statement: Optional[str] = None
    other_driver_details: Optional[Dict[str, Any]] = None
    witnesses: Optional[List[Dict[str, Any]]] = None
    photo_urls: Optional[List[str]] = Field(default_factory=list)
    voice_note_url: Optional[str] = None


@router.post("/sync", status_code=status.HTTP_201_CREATED)
def sync_accident_mode(payload: AccidentSyncPayload, db: Session = Depends(get_db)):
    """Sync an offline Accident Mode packet:
    1. Create/populate motor-accident case
    2. Link telemetry, photos, and voice evidence
    3. Calculate evidence completeness checklist & score
    4. Create comprehensive audit events
    5. Expose case to adviser triage queue
    """
    client = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Client {payload.client_id} not found")

    now = datetime.now(timezone.utc)
    captured_at = payload.captured_timestamp or now

    # 1. Create motor-accident case
    case = Case(
        client_id=client.id,
        adviser_id=client.adviser_id,
        case_type=CaseType.MOTOR_ACCIDENT,
        status="in_progress",
        priority="urgent",
        current_step="evidence_collection",
        created_at=captured_at,
        updated_at=now,
    )
    db.add(case)
    db.flush()

    # Create Workflow Steps
    steps = [
        WorkflowStep(
            case_id=case.id,
            key="incident_captured",
            title="Accident Incident Telemetry Captured",
            owner=WorkflowStepOwner.CLIENT,
            status="completed",
            order=1,
            completion_timestamp=captured_at,
        ),
        WorkflowStep(
            case_id=case.id,
            key="evidence_collection",
            title="Evidence Completeness & Witness Follow-up",
            owner=WorkflowStepOwner.CLIENT,
            status="in_progress",
            order=2,
        ),
        WorkflowStep(
            case_id=case.id,
            key="adviser_review",
            title="Adviser Claim Triage",
            owner=WorkflowStepOwner.ADVISER,
            status="pending",
            order=3,
        ),
        WorkflowStep(
            case_id=case.id,
            key="claim_registration",
            title="Register Claim with Insurer",
            owner=WorkflowStepOwner.PROVIDER,
            status="pending",
            order=4,
        ),
    ]
    db.add_all(steps)

    # 2. Link Evidence
    evidence_items = []

    # GPS / Location evidence
    location_str = f"Lat: {payload.latitude}, Lng: {payload.longitude} (Accuracy: ±{payload.gps_accuracy}m)"
    loc_ev = Evidence(
        client_id=client.id,
        case_id=case.id,
        type=EvidenceType.LOCATION,
        file=f"gps://telemetry/{payload.latitude}/{payload.longitude}",
        extracted_data={
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "accuracy_meters": payload.gps_accuracy,
            "captured_offline": True,
        },
        validation_state="valid",
        timestamp=captured_at,
        location=location_str,
    )
    evidence_items.append(loc_ev)

    # Photos
    for photo_url in payload.photo_urls or []:
        photo_ev = Evidence(
            client_id=client.id,
            case_id=case.id,
            type=EvidenceType.SCENE_PHOTO,
            file=photo_url,
            extracted_data={"captured_offline": True},
            validation_state="valid",
            timestamp=captured_at,
            location=location_str,
        )
        evidence_items.append(photo_ev)

    # Voice Statement
    if payload.voice_note_url or payload.statement:
        voice_ev = Evidence(
            client_id=client.id,
            case_id=case.id,
            type=EvidenceType.VOICE_STATEMENT,
            file=payload.voice_note_url or "text://direct-input",
            extracted_data={"transcript": payload.statement or "", "entities": {"location": location_str}},
            validation_state="valid",
            timestamp=captured_at,
            location=location_str,
        )
        evidence_items.append(voice_ev)

    # Witnesses
    has_witnesses = bool(payload.witnesses and len(payload.witnesses) > 0)
    if has_witnesses:
        witness_ev = Evidence(
            client_id=client.id,
            case_id=case.id,
            type=EvidenceType.WITNESS_DETAILS,
            file="json://witness-details",
            extracted_data={"witnesses": payload.witnesses},
            validation_state="valid",
            timestamp=captured_at,
            location=location_str,
        )
        evidence_items.append(witness_ev)

    db.add_all(evidence_items)

    # 3. Calculate completeness
    has_location = True
    has_photos = bool(payload.photo_urls and len(payload.photo_urls) > 0)
    has_driver_details = bool(payload.other_driver_details)
    has_voice = bool(payload.voice_note_url or payload.statement)

    checklist = {
        "location": {"present": has_location, "label": "Location ✓"},
        "scene_photos": {"present": has_photos, "label": "Scene photos ✓" if has_photos else "Scene photos Missing"},
        "other_driver": {"present": has_driver_details, "label": "Other driver ✓" if has_driver_details else "Other driver Missing"},
        "voice_statement": {"present": has_voice, "label": "Voice statement ✓" if has_voice else "Voice statement Missing"},
        "witnesses": {"present": has_witnesses, "label": "Witnesses ✓" if has_witnesses else "Witness missing"},
    }

    present_count = sum(1 for item in checklist.values() if item["present"])
    total_items = len(checklist)
    score_percentage = int((present_count / total_items) * 100)

    # 4. Audit events
    db.add(
        AuditEvent(
            actor=f"client:{client.id}",
            action="accident_mode.synced",
            case_id=case.id,
            metadata={
                "network_restored": True,
                "items_synced": len(evidence_items),
                "completeness_score": f"{score_percentage}%",
            },
        )
    )

    db.commit()
    db.refresh(case)

    missing_notice = "1 item still missing before you leave the scene: witness details, if available." if not has_witnesses else None

    return {
        "case_id": case.id,
        "case_number": f"AC-{case.id + 2040}",
        "status": case.status,
        "priority": case.priority,
        "completeness_score": f"{score_percentage}%",
        "checklist": checklist,
        "guidance_prompt": missing_notice,
        "evidence_count": len(evidence_items),
    }
