import logging
import time

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings
from app.main import create_app
from app.schemas import AnalysisResponse, BlockAnalysis
from app.services.analyze import build_unclassified_response


def _payload(blocks: list[dict] | None = None, preferences: dict | None = None) -> dict:
    return {
        "blocks": blocks
        if blocks is not None
        else [
            {
                "id": "zf-0",
                "kind": "section",
                "title": "Heading",
                "text": "A readable block from the page.",
            }
        ],
        "preferences": {} if preferences is None else preferences,
    }


def test_analyze_returns_review_for_each_block(client) -> None:
    response = client.post(
        "/v1/analyze",
        json=_payload(
            [
                {"id": "zf-0", "kind": "article", "text": "First block."},
                {"id": "zf-1", "kind": "comment", "text": "Second block."},
            ],
            {"war": True, "harsh_tone": False},
        ),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["model_version"] == "none"
    assert [item["id"] for item in body["results"]] == ["zf-0", "zf-1"]
    assert body["results"] == [
        {
            "id": "zf-0",
            "category": "unclassified",
            "toxicity_score": 0.0,
            "confidence": 0.0,
            "recommended_action": "review",
        },
        {
            "id": "zf-1",
            "category": "unclassified",
            "toxicity_score": 0.0,
            "confidence": 0.0,
            "recommended_action": "review",
        },
    ]
    AnalysisResponse.model_validate(body)


def test_analyze_accepts_extension_block_shape(client) -> None:
    response = client.post("/v1/analyze", json=_payload())

    assert response.status_code == 200
    assert response.json()["results"][0]["id"] == "zf-0"
    assert response.json()["results"][0]["recommended_action"] == "review"


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"blocks": [], "preferences": {}},
        {"preferences": {}},
        _payload([{"id": "zf-0", "text": "   ", "kind": "article"}]),
        _payload([{"id": "zf-0", "text": "", "kind": "article"}]),
        _payload([{"id": "zf-0", "text": "Hello.", "kind": "nav"}]),
        _payload([{"id": "bad id", "text": "Hello.", "kind": "article"}]),
        _payload(
            [
                {"id": "zf-0", "text": "Hello.", "kind": "article"},
                {"id": "zf-0", "text": "Again.", "kind": "article"},
            ]
        ),
        _payload([{"id": "zf-0", "text": "x" * 8001, "kind": "article"}]),
        _payload(
            [
                {"id": f"zf-{index}", "text": "Block.", "kind": "other"}
                for index in range(101)
            ]
        ),
        _payload(preferences={"war": "yes"}),
        _payload(preferences={"": True}),
        _payload(preferences={"k" * 65: True}),
        _payload(preferences={f"topic-{index}": True for index in range(33)}),
    ],
)
def test_analyze_rejects_invalid_input(client, body: dict) -> None:
    response = client.post("/v1/analyze", json=body)

    assert response.status_code == 422
    payload = response.json()
    assert payload["error"] == "validation_error"
    assert payload["details"]
    assert all(set(item) == {"loc", "msg"} for item in payload["details"])


def test_validation_error_does_not_echo_page_text(client, caplog) -> None:
    secret = "SECRET_PAGE_TEXT"
    text = secret + ("q" * (8001 - len(secret)))
    with caplog.at_level(logging.DEBUG, logger="zenfeed"):
        response = client.post(
            "/v1/analyze",
            json=_payload([{"id": "zf-0", "text": text, "kind": "article"}]),
        )

    assert response.status_code == 422
    assert secret not in response.text
    assert secret not in caplog.text


def test_success_logs_omit_page_text_and_api_key(caplog) -> None:
    secret_text = "SECRET_PAGE_TEXT_OK"
    secret_key = "SECRET_API_KEY_OK"
    application = create_app(
        Settings(analyze_timeout_seconds=10, log_level="INFO", ai_api_key=secret_key)
    )
    with (
        TestClient(application) as test_client,
        caplog.at_level(logging.DEBUG, logger="zenfeed"),
    ):
        response = test_client.post(
            "/v1/analyze",
            json=_payload([{"id": "zf-0", "text": secret_text, "kind": "post"}]),
        )

    assert response.status_code == 200
    assert secret_text not in response.text
    assert secret_key not in response.text
    assert secret_text not in caplog.text
    assert secret_key not in caplog.text
    assert "super-secret" not in repr(application.state.settings)


def test_request_body_over_limit_is_rejected() -> None:
    application = create_app(Settings(max_body_bytes=1024))
    with TestClient(application) as test_client:
        response = test_client.post(
            "/v1/analyze",
            content=b'{"pad":"' + (b"a" * 2048) + b'"}',
            headers={"content-type": "application/json"},
        )

    assert response.status_code == 413
    assert response.json() == {"error": "request_too_large"}


def test_analyze_timeout(monkeypatch) -> None:
    def too_slow(payload):
        time.sleep(0.2)
        return build_unclassified_response(payload)

    monkeypatch.setattr("app.main.build_unclassified_response", too_slow)
    application = create_app(Settings(analyze_timeout_seconds=0.05))
    with TestClient(application) as test_client:
        response = test_client.post("/v1/analyze", json=_payload())

    assert response.status_code == 504
    assert response.json() == {"error": "timeout"}


def test_invalid_analysis_output_is_a_safe_error(monkeypatch) -> None:
    def invalid_output(payload):
        return AnalysisResponse.model_construct(
            results=[
                BlockAnalysis.model_construct(
                    id="zf-0",
                    category="unclassified",
                    toxicity_score=0.0,
                    confidence=2.0,
                    recommended_action="review",
                )
            ],
            model_version="none",
        )

    monkeypatch.setattr("app.main.build_unclassified_response", invalid_output)
    application = create_app(Settings())
    with TestClient(application) as test_client:
        response = test_client.post("/v1/analyze", json=_payload())

    assert response.status_code == 500
    assert response.json() == {"error": "internal_error"}
    assert "Traceback" not in response.text
    assert "confidence" not in response.text


def test_output_schema_rejects_out_of_range_score() -> None:
    with pytest.raises(ValidationError):
        BlockAnalysis(
            id="zf-0",
            category="unclassified",
            toxicity_score=0.0,
            confidence=1.5,
            recommended_action="review",
        )


def test_settings_from_env_hides_api_key(monkeypatch) -> None:
    monkeypatch.setenv("ZENFEED_AI_API_KEY", "env-secret-key")
    monkeypatch.setenv("ZENFEED_ANALYZE_TIMEOUT_SECONDS", "3")
    monkeypatch.setenv("ZENFEED_LOG_LEVEL", "warning")

    settings = Settings.from_env()

    assert settings.ai_api_key == "env-secret-key"
    assert settings.analyze_timeout_seconds == 3
    assert settings.log_level == "WARNING"
    assert "env-secret-key" not in repr(settings)


def test_settings_from_env_rejects_bad_timeout(monkeypatch) -> None:
    monkeypatch.setenv("ZENFEED_ANALYZE_TIMEOUT_SECONDS", "0")

    with pytest.raises(ValueError):
        Settings.from_env()
