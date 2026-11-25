"""Gemini free-tier client (ZF-15, docs/rozhodnuti-zf-25.md).

Used for the summary and, only when ``ZENFEED_ANALYZE_PROVIDER=gemini``, for
classification (``services/model_classify.py``). Kept apart from the routes so
the logic can be tested without the provider. The API key is sent only in a
request header and is never logged. Page text is never logged either.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field

import httpx
from pydantic import BaseModel, ConfigDict, StrictBool, ValidationError

logger = logging.getLogger("zenfeed")

# Long enough for a summary of at most ~1500 characters (the prompt asks for
# that); the contract allows 4000.
MAX_OUTPUT_TOKENS = 800
# The free tier often answers 503 on the next call (a second language). Two
# short retries usually get a summary; other errors are not retried.
_BUSY_ATTEMPTS = 3
_BUSY_DELAYS_SECONDS = (0.4, 0.8)


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
    # repr=False: the key must not appear if the client is ever printed or logged.
    api_key: str = field(repr=False)
    model: str
    api_base: str
    timeout_seconds: float
    transport: httpx.BaseTransport | None = None

    def generate(self, system_instruction: str, user_content: str) -> ModelSummary:
        data = self.generate_json(system_instruction, user_content, RESPONSE_SCHEMA, MAX_OUTPUT_TOKENS)
        try:
            return ModelSummary.model_validate(data)
        except ValidationError as exc:
            logger.warning("provider returned an unusable answer error_type=%s", type(exc).__name__)
            raise ProviderError("unavailable") from exc

    def generate_json(
        self,
        system_instruction: str,
        user_content: str,
        response_schema: dict[str, object],
        max_output_tokens: int,
        *,
        timeout_seconds: float | None = None,
        busy_attempts: int = _BUSY_ATTEMPTS,
    ) -> object:
        """Structured output in ``response_schema``, parsed from JSON; the caller validates it."""
        body = {
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"role": "user", "parts": [{"text": user_content}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": max_output_tokens,
                "responseMimeType": "application/json",
                "responseSchema": response_schema,
            },
        }
        url = f"{self.api_base}/models/{self.model}:generateContent"
        timeout = self.timeout_seconds if timeout_seconds is None else timeout_seconds
        for attempt in range(busy_attempts):
            response = self._post(url, body, timeout)
            if response.status_code != 503:
                return _interpret(response)
            logger.warning("provider busy status=503 attempt=%s", attempt + 1)
            if attempt == busy_attempts - 1:
                raise ProviderError("unavailable")
            time.sleep(_BUSY_DELAYS_SECONDS[min(attempt, len(_BUSY_DELAYS_SECONDS) - 1)])
        raise ProviderError("unavailable")

    def _post(self, url: str, body: dict[str, object], timeout: float) -> httpx.Response:
        try:
            with httpx.Client(timeout=timeout, transport=self.transport) as client:
                return client.post(url, json=body, headers={"x-goog-api-key": self.api_key})
        except httpx.TimeoutException as exc:
            logger.warning("provider timed out")
            raise ProviderError("timeout") from exc
        except httpx.HTTPError as exc:
            logger.warning("provider unreachable error_type=%s", type(exc).__name__)
            raise ProviderError("unavailable") from exc


def _interpret(response: httpx.Response) -> object:
    if response.status_code == 429:
        logger.warning("provider rate limited")
        raise ProviderError("rate_limited")
    if response.status_code in (408, 504):
        raise ProviderError("timeout")
    if response.status_code != 200:
        # The body can echo the request; only the status is logged.
        logger.warning("provider error status=%s", response.status_code)
        raise ProviderError("unavailable")
    return _parse(response)


def _parse(response: httpx.Response) -> object:
    """Takes the JSON text of the first candidate; anything else is unavailable."""
    try:
        data = response.json()
        candidate = data["candidates"][0]
        text = candidate["content"]["parts"][0]["text"]
        return json.loads(text)
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        # Includes answers blocked by safety settings, which have no content.
        logger.warning("provider returned an unusable answer error_type=%s", type(exc).__name__)
        raise ProviderError("unavailable") from exc
