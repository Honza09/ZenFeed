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
from app.schemas import AnalysisRequest, AnalysisResponse, HealthResponse
from app.services.analyze import analyze_blocks

logger = logging.getLogger("zenfeed")


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved = settings if settings is not None else Settings.from_env()
    application = FastAPI(title="ZenFeed", version="0.1.0")
    application.state.settings = resolved
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

    return application


app = create_app()
