from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_health_ok(client) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "analyze_provider": "lexicon"}


def test_health_says_when_the_model_classifies() -> None:
    # The popup reads this before the click to say that text goes on to Google.
    class AnyModel:
        def generate_json(self, *args, **kwargs):
            raise AssertionError("health must not call the model")

    with TestClient(create_app(Settings(), analyze_model=AnyModel())) as client:
        response = client.get("/health")

    assert response.json() == {"status": "ok", "analyze_provider": "gemini"}
