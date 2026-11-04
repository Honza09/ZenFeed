import logging

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.schemas import AnalysisRequest, ContentBlockInput
from app.services.classify import classify_block


def _block(text: str, title: str | None = None) -> ContentBlockInput:
    return ContentBlockInput(id="zf-0", text=text, kind="article", title=title)


def _analyze(text: str, preferences: dict[str, bool] | None = None) -> dict:
    application = create_app(Settings())
    with TestClient(application) as client:
        response = client.post(
            "/v1/analyze",
            json={
                "blocks": [{"id": "zf-0", "text": text, "kind": "article"}],
                "preferences": preferences or {},
            },
        )
    assert response.status_code == 200
    return response.json()["results"][0]


def test_war_hides_only_when_selected_and_confident() -> None:
    text = "The army reported an airstrike and troops crossed the front."
    hidden = _analyze(text, {"valka": True})
    shown = _analyze(text, {})

    assert hidden["topic"] == "valka"
    assert hidden["tone"] == "neutralni"
    assert hidden["recommended_action"] == "hide"
    assert shown["recommended_action"] == "show"


def test_war_deaths_stay_war() -> None:
    result = classify_block(
        _block("Soldiers were killed in the invasion after the airstrike."),
        {"umrti": True, "valka": False},
    )

    assert result.topic == "valka"
    assert result.recommended_action == "show"


def test_death_news_hides_when_selected() -> None:
    result = _analyze(
        "The obituary says the writer died at home.",
        {"umrti": True},
    )

    assert result["topic"] == "umrti"
    assert result["recommended_action"] == "hide"


def test_physics_violent_is_not_violence() -> None:
    result = _analyze(
        "Violent relaxation of the magnetic field was measured in the lab.",
        {"nasili": True},
    )

    assert result["topic"] == "jine"
    assert result["recommended_action"] == "show"


def test_insult_hides_only_for_tone_preference() -> None:
    text = "You idiots should die and nobody will miss you!!!"
    hidden = _analyze(text, {"toxicky": True})
    shown = _analyze(text, {"valka": True})

    assert hidden["tone"] == "toxicky"
    assert hidden["recommended_action"] == "hide"
    assert shown["tone"] == "toxicky"
    assert shown["recommended_action"] == "show"


def test_weak_topic_match_is_review_not_hide() -> None:
    result = _analyze(
        "People joined a protest in the square.",
        {"politicke_konflikty": True},
    )

    assert result["topic"] == "politicke_konflikty"
    assert result["confidence"] < 0.7
    assert result["recommended_action"] == "review"


def test_every_block_gets_one_result() -> None:
    payload = AnalysisRequest(
        blocks=[
            ContentBlockInput(id=f"zf-{index}", text=f"Note {index}.", kind="other")
            for index in range(25)
        ],
        preferences={"valka": True},
    )
    from app.services.analyze import analyze_blocks

    response = analyze_blocks(payload)

    assert response.model_version == "lexicon-1"
    assert [item.id for item in response.results] == [f"zf-{index}" for index in range(25)]
    assert all(item.recommended_action == "show" for item in response.results)


def test_classify_logs_omit_page_text(caplog) -> None:
    secret = "SECRET_PAGE_TEXT_WAR"
    application = create_app(Settings(log_level="INFO"))
    with (
        TestClient(application) as client,
        caplog.at_level(logging.DEBUG, logger="zenfeed"),
    ):
        response = client.post(
            "/v1/analyze",
            json={
                "blocks": [
                    {
                        "id": "zf-0",
                        "text": f"The airstrike report {secret}.",
                        "kind": "article",
                    }
                ],
                "preferences": {"valka": True},
            },
        )

    assert response.status_code == 200
    assert secret not in caplog.text
    assert secret not in response.text


def test_invalid_classifier_output_is_repaired_to_review(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.classify._topic",
        lambda _text: ("nope", 1.5),
    )

    result = classify_block(_block("The army reported an airstrike."), {"valka": True})

    assert result.topic == "jine"
    assert result.category == "jine"
    assert result.tone == "neutralni"
    assert result.confidence == 0.0
    assert result.toxicity_score == 0.0
    assert result.recommended_action == "review"
