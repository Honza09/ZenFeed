import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


@pytest.fixture
def settings() -> Settings:
    return Settings(analyze_timeout_seconds=10, log_level="INFO", ai_api_key=None)


@pytest.fixture
def client(settings: Settings) -> TestClient:
    application = create_app(settings)
    with TestClient(application) as test_client:
        yield test_client
