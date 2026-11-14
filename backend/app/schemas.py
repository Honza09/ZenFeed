"""Request and response models for the ZenFeed API.

The analyze contract follows the draft in ``zenfeed_implementacni_plan.md``.
``section`` is included because the content script already emits that kind.
Preference keys and summary fields are the ZF-14 contract; ``/v1/summarize``
serves them since ZF-15.
"""

from __future__ import annotations

from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    field_validator,
    model_validator,
)

MAX_BLOCKS = 100
MAX_BLOCK_CHARS = 8000
MAX_SUMMARY_CHARS = 4000

BlockKind = Literal["article", "section", "comment", "post", "other"]
RecommendedAction = Literal["show", "hide", "review"]
SummaryLanguage = Literal["cs", "en"]
HideableTopic = Literal[
    "valka",
    "politicke_konflikty",
    "umrti",
    "katastrofy",
    "nasili",
]
TopicId = Literal[
    "valka",
    "politicke_konflikty",
    "umrti",
    "katastrofy",
    "nasili",
    "jine",
]
ToneLabel = Literal["neutralni", "toxicky"]


class ContentBlockInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    text: str = Field(min_length=1, max_length=MAX_BLOCK_CHARS)
    kind: BlockKind = "other"
    title: str | None = Field(default=None, max_length=300)

    @field_validator("text")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("text must not be blank")
        return stripped


class Preferences(BaseModel):
    """Hide switches. Missing keys stay off. ``jine`` is not a switch."""

    model_config = ConfigDict(extra="forbid")

    valka: StrictBool = False
    politicke_konflikty: StrictBool = False
    umrti: StrictBool = False
    katastrofy: StrictBool = False
    nasili: StrictBool = False
    toxicky: StrictBool = False


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    blocks: list[ContentBlockInput] = Field(min_length=1, max_length=MAX_BLOCKS)
    preferences: Preferences

    @model_validator(mode="after")
    def reject_duplicate_ids(self) -> AnalysisRequest:
        ids = [block.id for block in self.blocks]
        if len(ids) != len(set(ids)):
            raise ValueError("block ids must be unique")
        return self


class BlockAnalysis(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=64)
    category: TopicId
    topic: TopicId = "jine"
    tone: ToneLabel = "neutralni"
    toxicity_score: float = Field(ge=0, le=1)
    confidence: float = Field(ge=0, le=1)
    recommended_action: RecommendedAction


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    results: list[BlockAnalysis]
    model_version: str = Field(min_length=1, max_length=64)


class HealthResponse(BaseModel):
    status: Literal["ok"]


def _reject_duplicate_categories(value: list[str]) -> list[str]:
    if len(value) != len(set(value)):
        raise ValueError("omitted categories must be unique")
    return value


class SummaryRequest(BaseModel):
    """Blocks the extension kept, for ``/v1/summarize`` (ZF-15).

    The extension sends only the blocks it kept, so it also sends which topics
    it hid. Hidden text never reaches the backend.
    """

    model_config = ConfigDict(extra="ignore")

    blocks: list[ContentBlockInput] = Field(min_length=1, max_length=MAX_BLOCKS)
    preferences: Preferences
    omitted_categories: list[HideableTopic] = Field(default_factory=list, max_length=5)
    language: SummaryLanguage = "cs"

    @field_validator("omitted_categories")
    @classmethod
    def reject_duplicate_categories(cls, value: list[str]) -> list[str]:
        return _reject_duplicate_categories(value)

    @model_validator(mode="after")
    def reject_duplicate_ids(self) -> SummaryRequest:
        ids = [block.id for block in self.blocks]
        if len(ids) != len(set(ids)):
            raise ValueError("block ids must be unique")
        return self

    @model_validator(mode="after")
    def require_switch_for_omitted(self) -> SummaryRequest:
        # A topic can only be hidden when its switch is on.
        switched_off = [
            topic
            for topic in self.omitted_categories
            if not getattr(self.preferences, topic)
        ]
        if switched_off:
            raise ValueError("omitted categories must be switched on in preferences")
        return self


class SummaryResponse(BaseModel):
    """Contract for ZF-15. A blank summary is allowed only with a flag."""

    model_config = ConfigDict(extra="forbid")

    summary: str = Field(max_length=MAX_SUMMARY_CHARS)
    preferences: Preferences
    omitted_categories: list[HideableTopic] = Field(max_length=5)
    insufficient_input: bool = False
    no_relevant_content: bool = False
    model_version: str = Field(min_length=1, max_length=64)

    @field_validator("omitted_categories")
    @classmethod
    def reject_duplicate_categories(cls, value: list[str]) -> list[str]:
        return _reject_duplicate_categories(value)

    @model_validator(mode="after")
    def require_summary_when_content_remains(self) -> SummaryResponse:
        if self.insufficient_input or self.no_relevant_content:
            return self
        if not self.summary.strip():
            raise ValueError("summary is required when content remains")
        return self
