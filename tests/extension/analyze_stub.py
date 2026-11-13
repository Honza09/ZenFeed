"""Test stub for backend errors in the popup (ZF-13). NOT a classifier.

It replaces the real backend on port 8000 so that a tester can produce the
responses the real backend rarely gives: a 4xx, a 5xx, a timeout, or a failure
of only one request of a long page. Stop the real backend first. The valid
answer is built with the real ``AnalysisRequest`` and ``AnalysisResponse``
models, so the contract (``docs/API.md``) is checked in both directions. Every
block is answered as ``show`` with a neutral tone, so nothing is ever hidden by
this stub.

It never reads or keeps block text. Only the number of blocks and the block IDs
of each request are recorded. Nothing leaves the machine.

Run from the repository root (port 8000, where the extension calls):

    PYTHONPATH=backend uvicorn analyze_stub:app --app-dir tests/extension --port 8000

Switch the answer with ``POST /__stub/mode`` and ``{"mode": ...}``:
``ok`` (default), ``status_422``, ``status_500``, ``timeout_504`` (504 with
``{"error":"timeout"}``), ``fail_second_request`` and ``reset_counter``.

``fail_second_request``: the first batch is answered normally, and the second
batch (the first request whose first block ID differs from the first batch)
gets a 500 on every attempt, including the popup's retry and the button
"Zkusit znovu nevyhodnocené". Other batches are answered normally. Switch back
to ``ok`` and the failed batch succeeds. It needs a page with more than 100
blocks, because the popup sends at most 100 blocks per request.

``reset_counter`` clears the counter and the request list and keeps the current
mode. Every mode change also clears them.

``GET /__stub/last`` returns the counter and the recorded requests (at most the
last 50): the request number, the number of blocks, the first and last block ID
and the status the stub returned. No text.
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    BlockAnalysis,
    HealthResponse,
)

StubMode = Literal[
    "ok",
    "status_422",
    "status_500",
    "timeout_504",
    "fail_second_request",
    "reset_counter",
]

MODEL_VERSION = "stub-analyze-not-a-classifier"
MAX_RECORDED_REQUESTS = 50

# Error bodies as in docs/API.md.
_ERRORS: dict[str, tuple[int, dict[str, Any]]] = {
    "status_422": (
        422,
        {
            "error": "validation_error",
            "details": [{"loc": ["body"], "msg": "stub: forced 422"}],
        },
    ),
    "status_500": (500, {"error": "internal_error"}),
    "timeout_504": (504, {"error": "timeout"}),
}

app = FastAPI(title="ZenFeed analyze stub")
_state: dict[str, Any] = {}


def _clear() -> None:
    _state["counter"] = 0
    _state["requests"] = []
    _state["first_batch_id"] = None
    _state["failing_batch_id"] = None


_state["mode"] = "ok"
_clear()


class ModeRequest(BaseModel):
    mode: StubMode


@app.exception_handler(RequestValidationError)
async def request_validation_failed(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    # Same shape as the real backend, and no echo of the submitted input.
    details = [
        {"loc": list(error["loc"]), "msg": error["msg"]} for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422, content={"error": "validation_error", "details": details}
    )


def _fails_this_batch(mode: str, first_id: str) -> bool:
    if mode in _ERRORS:
        return True
    if mode != "fail_second_request":
        return False
    if _state["first_batch_id"] is None:
        _state["first_batch_id"] = first_id
        return False
    if _state["failing_batch_id"] is None and first_id != _state["first_batch_id"]:
        _state["failing_batch_id"] = first_id
    return first_id == _state["failing_batch_id"]


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/v1/analyze", response_model=AnalysisResponse)
def analyze(payload: AnalysisRequest) -> AnalysisResponse | JSONResponse:
    ids = [block.id for block in payload.blocks]
    mode = _state["mode"]
    failed = _fails_this_batch(mode, ids[0])
    if failed:
        status, body = _ERRORS.get(mode, _ERRORS["status_500"])
    else:
        status = 200
    _state["counter"] += 1
    _state["requests"].append(
        {
            "number": _state["counter"],
            "block_count": len(ids),
            "first_id": ids[0],
            "last_id": ids[-1],
            "status": status,
        }
    )
    del _state["requests"][:-MAX_RECORDED_REQUESTS]
    if failed:
        return JSONResponse(status_code=status, content=body)
    return AnalysisResponse(
        results=[
            BlockAnalysis(
                id=block_id,
                category="jine",
                topic="jine",
                tone="neutralni",
                toxicity_score=0.0,
                confidence=0.0,
                recommended_action="show",
            )
            for block_id in ids
        ],
        model_version=MODEL_VERSION,
    )


@app.post("/__stub/mode")
def set_mode(request: ModeRequest) -> dict[str, Any]:
    if request.mode != "reset_counter":
        _state["mode"] = request.mode
    _clear()
    return {"mode": _state["mode"], "counter": _state["counter"]}


@app.get("/__stub/last")
def last_requests() -> dict[str, Any]:
    return {
        "mode": _state["mode"],
        "counter": _state["counter"],
        "requests": _state["requests"],
    }
