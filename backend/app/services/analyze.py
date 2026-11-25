"""Run classification for an analyze request.

By default every block goes through the local lexicon, in batches of 20.
When the team switches the model on (``ZENFEED_ANALYZE_PROVIDER=gemini``), the
whole request goes to the model in one call and the lexicon is the fallback:
for the whole request when the model fails, or for the blocks it did not
answer. ``model_version`` says which one produced the results.
"""

from __future__ import annotations

import logging

from app.schemas import AnalysisRequest, AnalysisResponse
from app.services.classify import BATCH_SIZE, MODEL_VERSION, classify_block
from app.services.gemini import ProviderError
from app.services.model_classify import ClassifyModel, classify_with_model

logger = logging.getLogger("zenfeed")

# Below this much time left for the model, the lexicon answers at once.
MIN_MODEL_SECONDS = 1.0


def _lexicon(payload: AnalysisRequest) -> AnalysisResponse:
    results = []
    batch_count = 0
    preferences = payload.preferences.model_dump()
    for start in range(0, len(payload.blocks), BATCH_SIZE):
        batch_count += 1
        for block in payload.blocks[start : start + BATCH_SIZE]:
            results.append(classify_block(block, preferences))
    logger.info("analyze classified block_count=%s batch_count=%s", len(results), batch_count)
    return AnalysisResponse(results=results, model_version=MODEL_VERSION)


def analyze_blocks(
    payload: AnalysisRequest,
    model: ClassifyModel | None = None,
    model_name: str = "",
    model_seconds: float = 0.0,
) -> AnalysisResponse:
    if model is None or model_seconds < MIN_MODEL_SECONDS:
        return _lexicon(payload)
    try:
        results, fallback = classify_with_model(
            list(payload.blocks), payload.preferences.model_dump(), model, model_seconds
        )
    except ProviderError as exc:
        logger.warning("analyze model unavailable kind=%s, using the lexicon", exc.kind)
        return _lexicon(payload)
    if fallback == len(results):
        version = MODEL_VERSION  # the model answered nothing usable
    elif fallback:
        version = f"gemini/{model_name}+{MODEL_VERSION}"
    else:
        version = f"gemini/{model_name}"
    logger.info("analyze classified by model block_count=%s fallback_count=%s", len(results), fallback)
    return AnalysisResponse(results=results, model_version=version[:64])
