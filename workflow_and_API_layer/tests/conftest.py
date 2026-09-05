import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.case_service import case_service
from app.services.audit_service import audit_service


@pytest.fixture(autouse=True)
def reset_state():
    """Resets in-memory stores before each test execution."""
    case_service.clear()
    audit_service.clear()
    yield
    case_service.clear()
    audit_service.clear()


@pytest.fixture
def client():
    """FastAPI TestClient instance."""
    with TestClient(app) as test_client:
        yield test_client
