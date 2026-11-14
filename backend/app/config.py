"""Runtime settings loaded from the environment.

API keys stay in the environment. They are never written into source files
and never included in ``repr`` or logs.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass

_LOG_LEVELS = frozenset({"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"})
_MAX_BODY_BYTES = 1_048_576
# docs/rozhodnuti-zf-25.md: Gemini free tier, no billing account.
DEFAULT_SUMMARY_MODEL = "gemini-3.5-flash-lite"
DEFAULT_SUMMARY_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _timeout_from_env(name: str, default: str) -> float:
    raw = os.environ.get(name, default)
    try:
        value = float(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be a number") from exc
    if not 0 < value <= 120:
        raise ValueError(f"{name} must be greater than 0 and at most 120")
    return value


@dataclass(frozen=True, repr=False)
class Settings:
    analyze_timeout_seconds: float = 10.0
    log_level: str = "INFO"
    ai_api_key: str | None = None
    max_body_bytes: int = _MAX_BODY_BYTES
    # /v1/summarize (ZF-15). The API base can point to a local fake in tests.
    summary_model: str = DEFAULT_SUMMARY_MODEL
    summary_api_base: str = DEFAULT_SUMMARY_API_BASE
    summary_timeout_seconds: float = 30.0

    def __repr__(self) -> str:
        key_state = "set" if self.ai_api_key else "unset"
        return (
            "Settings("
            f"analyze_timeout_seconds={self.analyze_timeout_seconds}, "
            f"log_level={self.log_level!r}, "
            f"ai_api_key={key_state}, "
            f"max_body_bytes={self.max_body_bytes}, "
            f"summary_model={self.summary_model!r}, "
            f"summary_timeout_seconds={self.summary_timeout_seconds})"
        )

    @classmethod
    def from_env(cls) -> Settings:
        timeout = _timeout_from_env("ZENFEED_ANALYZE_TIMEOUT_SECONDS", "10")
        summary_timeout = _timeout_from_env("ZENFEED_SUMMARY_TIMEOUT_SECONDS", "30")

        log_level = os.environ.get("ZENFEED_LOG_LEVEL", "INFO").upper()
        if log_level not in _LOG_LEVELS:
            raise ValueError(
                "ZENFEED_LOG_LEVEL must be DEBUG, INFO, WARNING, ERROR, or CRITICAL"
            )

        api_key = os.environ.get("ZENFEED_AI_API_KEY", "").strip() or None
        summary_model = os.environ.get("ZENFEED_SUMMARY_MODEL", "").strip() or DEFAULT_SUMMARY_MODEL
        if not _is_safe_model_name(summary_model):
            raise ValueError("ZENFEED_SUMMARY_MODEL must be a model name such as gemini-3.5-flash-lite")
        api_base = (
            os.environ.get("ZENFEED_SUMMARY_API_BASE", "").strip().rstrip("/")
            or DEFAULT_SUMMARY_API_BASE
        )
        if not api_base.startswith(("https://", "http://127.0.0.1", "http://localhost")):
            raise ValueError("ZENFEED_SUMMARY_API_BASE must be https, or http on localhost")
        return cls(
            analyze_timeout_seconds=timeout,
            log_level=log_level,
            ai_api_key=api_key,
            summary_model=summary_model,
            summary_api_base=api_base,
            summary_timeout_seconds=summary_timeout,
        )


def _is_safe_model_name(value: str) -> bool:
    """A model name goes into the request path, so only safe characters."""
    return bool(re.fullmatch(r"[A-Za-z0-9._-]{1,64}", value))
