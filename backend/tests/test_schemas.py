import pytest
from pydantic import ValidationError

from app.schemas import SummaryRequest, SummaryResponse


def _summary(**overrides: object) -> dict:
    body: dict = {
        "summary": "The kept blocks describe a harvest.",
        "preferences": {"valka": True},
        "omitted_categories": ["valka"],
        "model_version": "unset",
    }
    body.update(overrides)
    return body


def test_summary_contract_accepts_a_kept_page() -> None:
    parsed = SummaryRequest(
        blocks=[{"id": "zf-0", "text": "A kept paragraph.", "kind": "article"}],
        preferences={"umrti": True},
        language="en",
    )
    result = SummaryResponse.model_validate(_summary())

    assert parsed.language == "en"
    assert parsed.preferences.umrti is True
    assert parsed.preferences.valka is False
    assert result.omitted_categories == ["valka"]
    assert result.insufficient_input is False


def test_summary_contract_rejects_unknown_preference_and_category() -> None:
    with pytest.raises(ValidationError):
        SummaryRequest(
            blocks=[{"id": "zf-0", "text": "A kept paragraph.", "kind": "article"}],
            preferences={"war": True},
        )
    with pytest.raises(ValidationError):
        SummaryResponse.model_validate(_summary(omitted_categories=["jine"]))
    with pytest.raises(ValidationError):
        SummaryResponse.model_validate(
            _summary(omitted_categories=["valka", "valka"])
        )


def test_blank_summary_needs_an_explicit_flag() -> None:
    with pytest.raises(ValidationError):
        SummaryResponse.model_validate(_summary(summary="   "))

    flagged = SummaryResponse.model_validate(
        _summary(summary="", no_relevant_content=True)
    )

    assert flagged.no_relevant_content is True
    assert flagged.summary == ""
