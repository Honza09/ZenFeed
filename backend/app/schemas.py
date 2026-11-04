"""Request and response models for the ZenFeed API.

The analyze contract follows the draft in ``zenfeed_implementacni_plan.md``.
``section`` is included because the content script already emits that kind.
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
MAX_PREFERENCES = 32
MAX_PREFERENCE_KEY_CHARS = 64

BlockKind = Literal["article", "section", "comment", "post", "other"]
RecommendedAction = Literal["show", "hide", "review"]
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


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    blocks: list[ContentBlockInput] = Field(min_length=1, max_length=MAX_BLOCKS)
    preferences: dict[str, StrictBool]

    @field_validator("preferences")
    @classmethod
    def limit_preferences(cls, value: dict[str, bool]) -> dict[str, bool]:
        if len(value) > MAX_PREFERENCES:
            raise ValueError(f"at most {MAX_PREFERENCES} preferences are allowed")
        for key in value:
            if not key.strip() or len(key) > MAX_PREFERENCE_KEY_CHARS:
                raise ValueError("preference keys must be 1 to 64 characters")
        return value

    @model_validator(mode="after")
    def reject_duplicate_ids(self) -> AnalysisRequest:
        ids = [block.id for block in self.blocks]
        if len(ids) != len(set(ids)):
            raise ValueError("block ids must be unique")
        return self


class BlockAnalysis(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=64)
    category: str = Field(min_length=1, max_length=64)
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
