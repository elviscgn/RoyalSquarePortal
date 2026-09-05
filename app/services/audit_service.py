import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.schemas.enums import AuditActorEnum, AuditActionEnum
from app.schemas.audit import AuditEventOut, AuditTimelineOut


class AuditService:
    """Service for recording immutable workflow audit events and building timeline histories."""

    def __init__(self):
        # In-memory store for isolation/testing when DB session is mock/absent
        self._in_memory_events: List[AuditEventOut] = []

    def record_event(
        self,
        case_id: str,
        actor: AuditActorEnum,
        action: AuditActionEnum,
        metadata: Optional[Dict[str, Any]] = None,
        db_session: Any = None
    ) -> AuditEventOut:
        """Records a structured audit event."""
        event_id = f"aud-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        meta = metadata or {}

        event = AuditEventOut(
            id=event_id,
            case_id=case_id,
            actor=actor,
            action=action,
            metadata_json=meta,
            timestamp=now,
        )

        # If an active SQLAlchemy session with AuditEvent model is passed, persist it
        if db_session is not None:
            try:
                # Dynamically check if AuditEvent ORM model exists in session
                from app.models.audit import AuditEvent
                db_record = AuditEvent(
                    id=event.id,
                    case_id=event.case_id,
                    actor=event.actor.value,
                    action=event.action.value,
                    metadata_json=event.metadata_json,
                    timestamp=event.timestamp,
                )
                db_session.add(db_record)
            except Exception:
                # Fallback to local memory if ORM model is not yet bound
                pass

        self._in_memory_events.append(event)
        return event

    def get_case_timeline(self, case_id: str, db_session: Any = None) -> AuditTimelineOut:
        """Retrieves the chronological audit timeline for a specific case."""
        if db_session is not None:
            try:
                from app.models.audit import AuditEvent
                records = (
                    db_session.query(AuditEvent)
                    .filter(AuditEvent.case_id == case_id)
                    .order_by(AuditEvent.timestamp.asc())
                    .all()
                )
                events = [
                    AuditEventOut(
                        id=r.id,
                        case_id=r.case_id,
                        actor=AuditActorEnum(r.actor),
                        action=AuditActionEnum(r.action),
                        metadata_json=r.metadata_json or {},
                        timestamp=r.timestamp,
                    )
                    for r in records
                ]
                return AuditTimelineOut(case_id=case_id, total_events=len(events), events=events)
            except Exception:
                pass

        # Fallback to in-memory events filtered by case_id
        events = [e for e in self._in_memory_events if e.case_id == case_id]
        events.sort(key=lambda x: x.timestamp)
        return AuditTimelineOut(case_id=case_id, total_events=len(events), events=events)

    def clear(self):
        """Clears in-memory audit store for testing."""
        self._in_memory_events.clear()


audit_service = AuditService()
