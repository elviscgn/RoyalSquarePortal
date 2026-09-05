from typing import Dict, Type
from app.schemas.enums import CaseTypeEnum
from app.workflows.base import (
    BaseWorkflowDefinition,
    StepDefinition,
    WorkflowException,
    InvalidTransitionError,
    PreconditionNotMetError,
    UnauthorizedActionError,
)
from app.workflows.banking_details import BankingDetailsWorkflow
from app.workflows.motor_accident import MotorAccidentWorkflow

WORKFLOW_REGISTRY: Dict[str, Type[BaseWorkflowDefinition]] = {
    CaseTypeEnum.BANK_DETAILS_CHANGE.value: BankingDetailsWorkflow,
    CaseTypeEnum.MOTOR_ACCIDENT.value: MotorAccidentWorkflow,
}


def get_workflow_definition(case_type: str) -> Type[BaseWorkflowDefinition]:
    workflow_cls = WORKFLOW_REGISTRY.get(case_type)
    if not workflow_cls:
        raise ValueError(f"No workflow definition registered for case type '{case_type}'")
    return workflow_cls


__all__ = [
    "BaseWorkflowDefinition",
    "StepDefinition",
    "WorkflowException",
    "InvalidTransitionError",
    "PreconditionNotMetError",
    "UnauthorizedActionError",
    "BankingDetailsWorkflow",
    "MotorAccidentWorkflow",
    "WORKFLOW_REGISTRY",
    "get_workflow_definition",
]
