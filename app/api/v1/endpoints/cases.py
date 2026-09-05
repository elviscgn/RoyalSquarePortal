from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.schemas.case import (
    CaseCreate,
    CaseOut,
    CaseDetailOut,
    CaseFilterParams,
    CaseTypeEnum,
    CaseStatusEnum,
    PriorityEnum,
)
from app.schemas.workflow import StepCompleteRequest, StateTransitionResult
from app.services.case_service import case_service
from app.workflows.base import WorkflowException

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.post("", response_model=CaseDetailOut, status_code=status.HTTP_201_CREATED)
def create_case(case_in: CaseCreate):
    """Creates a new case and initializes its workflow steps."""
    try:
        return case_service.create_case(case_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create case: {str(e)}"
        )


@router.get("/{case_id}", response_model=CaseDetailOut)
def get_case(case_id: str):
    """Retrieves full case details, steps, active state, and compliance checklist."""
    case_detail = case_service.get_case(case_id)
    if not case_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID '{case_id}' not found."
        )
    return case_detail


@router.get("", response_model=List[CaseOut])
def list_cases(
    client_id: Optional[str] = Query(None),
    adviser_id: Optional[str] = Query(None),
    case_type: Optional[CaseTypeEnum] = Query(None),
    status: Optional[CaseStatusEnum] = Query(None),
    priority: Optional[PriorityEnum] = Query(None),
):
    """Lists and filters cases by status, priority, type, client, or adviser."""
    filters = CaseFilterParams(
        client_id=client_id,
        adviser_id=adviser_id,
        case_type=case_type,
        status=status,
        priority=priority,
    )
    return case_service.list_cases(filters)


@router.post("/{case_id}/steps/{step_id}/complete", response_model=StateTransitionResult)
def complete_step(
    case_id: str,
    step_id: str,
    request: StepCompleteRequest,
):
    """Validates preconditions, completes a workflow step, and advances case state."""
    try:
        return case_service.complete_step(case_id, step_id, request)
    except WorkflowException as we:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": we.message, "details": we.details}
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error processing workflow transition: {str(e)}"
        )
