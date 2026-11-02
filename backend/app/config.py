"""Runtime settings loaded from the environment.

API keys stay in the environment. They are never written into source files
and never included in ``repr`` or logs.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

_LOG_LEVELS = frozenset({"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"})
_MAX_BODY_BYTES = 1_048_576


@dataclass(frozen=True, repr=False)
class Settings:
    analyze_timeout_seconds: float = 10.0
    log_level: str = "INFO"
    ai_api_key: str | None = None
    max_body_bytes: int = _MAX_BODY_BYTES

    def __repr__(self) -> str:
        key_state = "set" if self.ai_api_key else "unset"
        return (
            "Settings("
            f"analyze_timeout_seconds={self.analyze_timeout_seconds}, "
            f"log_level={self.log_level!r}, "
            f"ai_api_key={key_state}, "
            f"max_body_bytes={self.max_body_bytes})"
        )

    @classmethod
    def from_env(cls) -> Settings:
        raw_timeout = os.environ.get("ZENFEED_ANALYZE_TIMEOUT_SECONDS", "10")
        try:
            timeout = float(raw_timeout)
        except ValueError as exc:
            raise ValueError(
                "ZENFEED_ANALYZE_TIMEOUT_SECONDS must be a number"
            ) from exc
        if not 0 < timeout <= 120:
            raise ValueError(
                "ZENFEED_ANALYZE_TIMEOUT_SECONDS must be greater than 0 and at most 120"
            )

        log_level = os.environ.get("ZENFEED_LOG_LEVEL", "INFO").upper()
        if log_level not in _LOG_LEVELS:
            raise ValueError(
                "ZENFEED_LOG_LEVEL must be DEBUG, INFO, WARNING, ERROR, or CRITICAL"
            )

        api_key = os.environ.get("ZENFEED_AI_API_KEY", "").strip() or None
        return cls(
            analyze_timeout_seconds=timeout,
            log_level=log_level,
            ai_api_key=api_key,
        )
