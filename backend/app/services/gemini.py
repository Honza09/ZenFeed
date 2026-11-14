"""Gemini free-tier client for the summary (ZF-15, docs/rozhodnuti-zf-25.md).

Kept apart from the routes so the summary logic can be tested without the
provider. The API key is sent only in a request header and is never logged.
Page text is never logged either.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass

import httpx
from pydantic import BaseModel, ConfigDict, StrictBool, ValidationError

logger = logging.getLogger("zenfeed")

# Long enough for a summary of at most ~1500 characters (the prompt asks for
# that); the contract allows 4000.
MAX_OUTPUT_TOKENS = 800


class ProviderError(Exception):
    """A provider failure. ``kind`` is rate_limited, timeout or unavailable."""

    def __init__(self, kind: str) -> None:
        super().__init__(kind)
        self.kind = kind


class ModelSummary(BaseModel):
    """What the model must return, checked before it reaches the extension."""

    model_config = ConfigDict(extra="ignore")

    summary: str
    insufficient_input: StrictBool
    no_relevant_content: StrictBool


# Structured output, so the answer is JSON in this shape and not free text.
RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "summary": {"type": "STRING"},
        "insufficient_input": {"type": "BOOLEAN"},
        "no_relevant_content": {"type": "BOOLEAN"},
    },
    "required": ["summary", "insufficient_input", "no_relevant_content"],
}


@dataclass(frozen=True)
class GeminiClient:
    api_key: str
    model: str
    api_base: str
    timeout_seconds: float
    transport: httpx.BaseTransport | None = None

    def generate(self, system_instruction: str, user_content: str) -> ModelSummary:
        body = {
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"role": "user", "parts": [{"text": user_content}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": MAX_OUTPUT_TOKENS,
                "responseMimeType": "application/json",
                "responseSchema": RESPONSE_SCHEMA,
            },
        }
        url = f"{self.api_base}/models/{self.model}:generateContent"
        try:
            with httpx.Client(timeout=self.timeout_seconds, transport=self.transport) as client:
                response = client.post(url, json=body, headers={"x-goog-api-key": self.api_key})
        except httpx.TimeoutException as exc:
            logger.warning("summary provider timed out")
            raise ProviderError("timeout") from exc
        except httpx.HTTPError as exc:
            logger.warning("summary provider unreachable error_type=%s", type(exc).__name__)
            raise ProviderError("unavailable") from exc

        if response.status_code == 429:
            logger.warning("summary provider rate limited")
            raise ProviderError("rate_limited")
        if response.status_code in (408, 504):
            raise ProviderError("timeout")
        if response.status_code != 200:
            # The body can echo the request; only the status is logged.
            logger.warning("summary provider error status=%s", response.status_code)
            raise ProviderError("unavailable")
        return _parse(response)


def _parse(response: httpx.Response) -> ModelSummary:
    """Takes the JSON text of the first candidate; anything else is unavailable."""
    try:
        data = response.json()
        candidate = data["candidates"][0]
        text = candidate["content"]["parts"][0]["text"]
        return ModelSummary.model_validate(json.loads(text))
    except (ValueError, KeyError, IndexError, TypeError, ValidationError) as exc:
        # Includes answers blocked by safety settings, which have no content.
        logger.warning("summary provider returned an unusable answer error_type=%s", type(exc).__name__)
        raise ProviderError("unavailable") from exc
