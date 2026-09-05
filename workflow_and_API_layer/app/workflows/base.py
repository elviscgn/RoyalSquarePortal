from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set
from app.schemas.enums import StepOwnerEnum, CaseStatusEnum


class WorkflowException(Exception):
    """Base exception for workflow validation and transition errors."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class InvalidTransitionError(WorkflowException):
    """Raised when an illegal or out-of-order state transition is attempted."""
    pass


class PreconditionNotMetError(WorkflowException):
    """Raised when a transition's business rules (e.g. valid statement, signature) are unsatisfied."""
    pass


class UnauthorizedActionError(WorkflowException):
    """Raised when an actor (e.g. client) attempts an action reserved for another (e.g. adviser)."""
    pass


@dataclass
class StepDefinition:
    key: str
    title: str
    owner: StepOwnerEnum
    order: int
    case_status: CaseStatusEnum
    required_evidence: Optional[str] = None
    is_auto_advance: bool = False
    next_state: Optional[str] = None
    permitted_actors: Set[StepOwnerEnum] = field(default_factory=set)

    def __post_init__(self):
        if not self.permitted_actors:
            self.permitted_actors = {self.owner, StepOwnerEnum.SYSTEM}


class BaseWorkflowDefinition:
    case_type: str
    initial_state: str
    steps: List[StepDefinition]

    @classmethod
    def get_step(cls, key: str) -> Optional[StepDefinition]:
        for step in cls.steps:
            if step.key == key:
                return step
        return None

    @classmethod
    def get_initial_step(cls) -> StepDefinition:
        step = cls.get_step(cls.initial_state)
        if not step:
            raise ValueError(f"Initial state {cls.initial_state} not found in {cls.case_type}")
        return step

    @classmethod
    def get_all_steps(cls) -> List[StepDefinition]:
        return sorted(cls.steps, key=lambda s: s.order)

    @classmethod
    def validate_transition(
        cls,
        current_state: str,
        target_state: str,
        actor: StepOwnerEnum,
        input_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """Enforces state transition rules and actor permissions."""
        current_def = cls.get_step(current_state)
        if not current_def:
            raise InvalidTransitionError(f"Current state '{current_state}' is unknown in {cls.case_type}.")

        target_def = cls.get_step(target_state)
        if not target_def:
            raise InvalidTransitionError(f"Target state '{target_state}' is unknown in {cls.case_type}.")

        if current_def.next_state != target_state:
            raise InvalidTransitionError(
                f"Invalid state transition from '{current_state}' to '{target_state}'. "
                f"Expected next state is '{current_def.next_state}'."
            )

        if actor not in current_def.permitted_actors:
            raise UnauthorizedActionError(
                f"Actor '{actor.value}' is not authorized to advance step '{current_state}'. "
                f"Permitted actors: {[a.value for a in current_def.permitted_actors]}"
            )
