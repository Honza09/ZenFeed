"""Run classification for an analyze request, in batches of 20 blocks."""

from __future__ import annotations

import logging

from app.schemas import AnalysisRequest, AnalysisResponse
from app.services.classify import BATCH_SIZE, MODEL_VERSION, classify_block

logger = logging.getLogger("zenfeed")


def analyze_blocks(payload: AnalysisRequest) -> AnalysisResponse:
    results = []
    batch_count = 0
    for start in range(0, len(payload.blocks), BATCH_SIZE):
        batch_count += 1
        for block in payload.blocks[start : start + BATCH_SIZE]:
            results.append(classify_block(block, payload.preferences.model_dump()))
    logger.info(
        "analyze classified block_count=%s batch_count=%s",
        len(results),
        batch_count,
    )
    return AnalysisResponse(results=results, model_version=MODEL_VERSION)
