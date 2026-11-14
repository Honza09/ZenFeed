"""ZenFeed FastAPI application."""

from __future__ import annotations

import asyncio
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.config import Settings
from app.middleware import LimitBodySize
from app.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    HealthResponse,
    SummaryRequest,
    SummaryResponse,
)
from app.services.analyze import analyze_blocks
from app.services.gemini import GeminiClient
from app.services.summarize import SummaryError, SummaryModel, summarize

logger = logging.getLogger("zenfeed")


# Extra time on top of the provider's own timeout before the route gives up.
_SUMMARY_HANG_MARGIN_SECONDS = 5.0

# HTTP status and body for each summary failure (docs/API.md).
_SUMMARY_ERRORS = {
    "unavailable": (503, "summary_unavailable"),
    "rate_limited": (429, "rate_limited"),
    "timeout": (504, "timeout"),
}


def _default_summary_model(settings: Settings) -> SummaryModel | None:
    """Gemini when a key is set, otherwise none (the route then answers 503)."""
    if not settings.ai_api_key:
        return None
    return GeminiClient(
        api_key=settings.ai_api_key,
        model=settings.summary_model,
        api_base=settings.summary_api_base,
        timeout_seconds=settings.summary_timeout_seconds,
    )


def create_app(
    settings: Settings | None = None, summary_model: SummaryModel | None = None
) -> FastAPI:
    """``summary_model`` replaces Gemini in tests; by default it comes from settings."""
    resolved = settings if settings is not None else Settings.from_env()
    application = FastAPI(title="ZenFeed", version="0.1.0")
    application.state.settings = resolved
    application.state.summary_model = (
        summary_model if summary_model is not None else _default_summary_model(resolved)
    )
    logger.setLevel(resolved.log_level)
    application.add_middleware(LimitBodySize, max_bytes=resolved.max_body_bytes)

    @application.exception_handler(RequestValidationError)
    async def request_validation_failed(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Log the fact of the failure only. The default body includes the raw input.
        logger.info("request validation failed")
        details = [
            {"loc": list(error["loc"]), "msg": error["msg"]} for error in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={"error": "validation_error", "details": details},
        )

    @application.exception_handler(ResponseValidationError)
    async def response_validation_failed(
        _request: Request, exc: ResponseValidationError
    ) -> JSONResponse:
        logger.error("response validation failed")
        return JSONResponse(status_code=500, content={"error": "internal_error"})

    @application.exception_handler(Exception)
    async def unhandled_error(_request: Request, exc: Exception) -> JSONResponse:
        logger.error("unhandled error type=%s", type(exc).__name__)
        return JSONResponse(status_code=500, content={"error": "internal_error"})

    @application.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(status="ok")

    @application.post("/v1/analyze", response_model=AnalysisResponse)
    async def analyze(
        payload: AnalysisRequest, request: Request
    ) -> AnalysisResponse | JSONResponse:
        current: Settings = request.app.state.settings
        logger.info("analyze request accepted block_count=%s", len(payload.blocks))
        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(analyze_blocks, payload),
                timeout=current.analyze_timeout_seconds,
            )
        except TimeoutError:
            logger.warning("analyze timed out block_count=%s", len(payload.blocks))
            return JSONResponse(status_code=504, content={"error": "timeout"})
        try:
            validated = AnalysisResponse.model_validate(result.model_dump())
        except ValidationError:
            logger.error("response validation failed")
            return JSONResponse(status_code=500, content={"error": "internal_error"})
        logger.info(
            "analyze response block_count=%s model_version=%s",
            len(validated.results),
            validated.model_version,
        )
        return validated

    @application.post("/v1/summarize", response_model=SummaryResponse)
    async def summarize_kept_blocks(
        payload: SummaryRequest, request: Request
    ) -> SummaryResponse | JSONResponse:
        current: Settings = request.app.state.settings
        model_version = f"gemini/{current.summary_model}"[:64]
        try:
            # The client has its own timeout; this one only guards against a hang.
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    summarize, payload, request.app.state.summary_model, model_version
                ),
                timeout=current.summary_timeout_seconds + _SUMMARY_HANG_MARGIN_SECONDS,
            )
        except TimeoutError:
            logger.warning("summarize timed out block_count=%s", len(payload.blocks))
            return JSONResponse(status_code=504, content={"error": "timeout"})
        except SummaryError as exc:
            status, error = _SUMMARY_ERRORS[exc.kind]
            return JSONResponse(status_code=status, content={"error": error})
        try:
            validated = SummaryResponse.model_validate(result.model_dump())
        except ValidationError:
            logger.error("summary response validation failed")
            return JSONResponse(status_code=500, content={"error": "internal_error"})
        logger.info(
            "summarize response flags insufficient=%s irrelevant=%s summary_chars=%s",
            validated.insufficient_input,
            validated.no_relevant_content,
            len(validated.summary),
        )
        return validated

    return application


app = create_app()
