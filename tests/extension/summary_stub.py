"""Test stub for the summary panel (ZF-30). NOT a summarizer.

The real backend has no ``/v1/summarize`` yet (ZF-15). This stub is the real
ZenFeed app (real ``/health`` and ``/v1/analyze``) plus a ``/v1/summarize``
route that uses the real ``SummaryRequest`` and ``SummaryResponse`` models, so
the contract is validated in both directions. Its "summary" is the first
sentence of the first visible blocks, marked as a stub. It records the last
request so a test can check that no hidden text was sent. Nothing leaves the
machine.

Run from the repository root (port 8000, where the extension calls):

    PYTHONPATH=backend uvicorn summary_stub:app --app-dir tests/extension --port 8000

Switch the answer with ``POST /__stub/mode`` and ``{"mode": ...}``:
``ok`` (default), ``insufficient``, ``no_relevant``, ``not_served`` (404),
``unavailable`` (503), ``rate_limited`` (429), ``timeout`` (504).
``GET /__stub/last`` returns the last summary request (cleared on every mode change).
"""

from __future__ import annotations

import re
from typing import Any, Literal

from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.main import create_app
from app.schemas import SummaryRequest, SummaryResponse

StubMode = Literal[
    "ok", "insufficient", "no_relevant", "not_served", "unavailable", "rate_limited", "timeout"
]

_ERRORS: dict[str, tuple[int, dict[str, str]]] = {
    "not_served": (404, {"detail": "Not Found"}),
    "unavailable": (503, {"error": "summary_unavailable"}),
    "rate_limited": (429, {"error": "rate_limited"}),
    "timeout": (504, {"error": "timeout"}),
}

app = create_app()
_state: dict[str, Any] = {"mode": "ok", "last": None}


class ModeRequest(BaseModel):
    mode: StubMode


def _first_sentence(text: str) -> str:
    match = re.match(r"(.+?[.!?])(\s|$)", text.strip())
    return (match.group(1) if match else text.strip())[:200]


@app.post("/v1/summarize", response_model=SummaryResponse)
def summarize(payload: SummaryRequest) -> SummaryResponse | JSONResponse:
    _state["last"] = payload.model_dump()
    mode = _state["mode"]
    if mode in _ERRORS:
        status, body = _ERRORS[mode]
        return JSONResponse(status_code=status, content=body)
    flags = {
        "insufficient_input": mode == "insufficient",
        "no_relevant_content": mode == "no_relevant",
    }
    text = ""
    if mode == "ok":
        sentences = [_first_sentence(block.text) for block in payload.blocks[:3]]
        text = f"[stub, {payload.language}] " + " ".join(sentences)
    return SummaryResponse(
        summary=text,
        preferences=payload.preferences,
        omitted_categories=payload.omitted_categories,
        model_version="stub-not-a-summary",
        **flags,
    )


@app.post("/__stub/mode")
def set_mode(request: ModeRequest) -> dict[str, str]:
    _state["mode"] = request.mode
    # A test reads /__stub/last after its own click, never an older request.
    _state["last"] = None
    return {"mode": request.mode}


@app.get("/__stub/last")
def last_request() -> dict[str, Any]:
    return {"last": _state["last"]}
