"""Placeholder analysis until classification exists (ZF-06).

Every block is returned as unclassified with ``recommended_action="review"``.
Uncertain results must not hide content. Block text is not logged.
"""

from __future__ import annotations

from app.schemas import AnalysisRequest, AnalysisResponse, BlockAnalysis

UNCLASSIFIED_MODEL_VERSION = "none"


def build_unclassified_response(payload: AnalysisRequest) -> AnalysisResponse:
    results = [
        BlockAnalysis(
            id=block.id,
            category="unclassified",
            toxicity_score=0.0,
            confidence=0.0,
            recommended_action="review",
        )
        for block in payload.blocks
    ]
    return AnalysisResponse(results=results, model_version=UNCLASSIFIED_MODEL_VERSION)
