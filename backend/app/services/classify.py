"""Topic and tone classification for one block.

This is a local lexicon over the frozen categories in ``docs/kategorie-mvp.md``.
It is not a zero-shot model. Topic and tone are scored separately. A block is
hidden only when a selected preference matches and the score is high enough.
A weak match is ``review``. Uncertain output never hides.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from pydantic import ValidationError

from app.schemas import BlockAnalysis, ContentBlockInput, ToneLabel, TopicId

MODEL_VERSION = "lexicon-1"
HIDE_MIN_CONFIDENCE = 0.7
BATCH_SIZE = 20
MAX_REPAIR_ATTEMPTS = 1
TONE_PREFERENCE = "toxicky"

# When several topics match, the earlier one wins (ZF-24 priority).
_TOPIC_PRIORITY: tuple[TopicId, ...] = (
    "valka",
    "nasili",
    "katastrofy",
    "umrti",
    "politicke_konflikty",
)


@dataclass(frozen=True)
class _Cues:
    strong: tuple[re.Pattern[str], ...]
    weak: tuple[re.Pattern[str], ...] = ()


def _patterns(*parts: str) -> tuple[re.Pattern[str], ...]:
    return tuple(re.compile(part) for part in parts)


_TOPICS: dict[TopicId, _Cues] = {
    "valka": _Cues(
        strong=_patterns(
            r"\bválk",
            r"\bváleč",
            r"\bwar\b",
            r"\bwarfare\b",
            r"\bairstrike",
            r"\bmissile",
            r"\btroops\b",
            r"\bceasefire",
            r"\binvasion\b",
            r"\bshelling\b",
            r"\bnálet",
            r"\bostřel",
            r"\bpříměř",
            r"\buprchlí",
            r"\bozbrojen",
            r"\binvaz",
            r"\bvoják",
            r"\barmed conflict",
            r"\bartillery",
        ),
    ),
    "nasili": _Cues(
        strong=_patterns(
            r"\bmurder",
            r"\bstabbed\b",
            r"\bassault",
            r"\briot\b",
            r"\brape\b",
            r"\bterrorist",
            r"\bvražd",
            r"\bpobod",
            r"\bznásil",
            r"\bterorist",
            r"\brabován",
            r"\bnapaden",
            r"\bnásilí",
            r"\bnásiln",
        ),
    ),
    "katastrofy": _Cues(
        strong=_patterns(
            r"\bearthquake",
            r"\bfloods?\b",
            r"\bwildfire",
            r"\btsunami",
            r"\bhurricane",
            r"\bmeltdown",
            r"\bzemětřes",
            r"\bzáplav",
            r"\bpovodn",
            r"\bhurikán",
            r"\bsopeč",
            r"\bvolcan",
        ),
    ),
    "umrti": _Cues(
        strong=_patterns(
            r"\bdied\b",
            r"\bdeaths?\b",
            r"\bobituary",
            r"\bkilled\b",
            r"\bfatalit",
            r"\bzahyn",
            r"\bzemřel",
            r"\búmrt",
            r"\bnekrolog",
            r"\bsmrteln",
        ),
    ),
    "politicke_konflikty": _Cues(
        strong=_patterns(
            r"\bsanctions?\b",
            r"\bcoalition",
            r"\bdiplomatic",
            r"\bimpeach",
            r"\bsankc",
            r"\bkoalic",
            r"\bdiplomatick",
            r"\bvolební spor",
        ),
        weak=_patterns(r"\bprotest"),
    ),
}

_TONE_STRONG = _patterns(
    r"\bidiots?\b",
    r"\bscum\b",
    r"\bmorons?\b",
    r"\bzrůd",
    r"\bdegenerát",
    r"\bhavěť",
    r"\bvermin\b",
    r"\bkill them\b",
    r"\bshould die\b",
    r"!{3,}",
)
_TONE_WEAK = _patterns(
    r"\bshocking\b",
    r"\bunbelievable\b",
    r"\bšokující",
    r"\bneuvěřiteln",
)


def _hits(text: str, patterns: tuple[re.Pattern[str], ...]) -> int:
    return sum(len(pattern.findall(text)) for pattern in patterns)


def _cue_confidence(cues: _Cues, text: str) -> float:
    strong = _hits(text, cues.strong)
    if strong >= 2:
        return 0.92
    if strong == 1:
        return 0.8
    if _hits(text, cues.weak) >= 1:
        return 0.5
    return 0.0


def _tone(text: str, original: str) -> tuple[ToneLabel, float]:
    if _hits(text, _TONE_STRONG) >= 1:
        return "toxicky", 0.9
    letters = [char for char in original if char.isalpha()]
    upper_ratio = (
        sum(char.isupper() for char in letters) / len(letters) if len(letters) >= 40 else 0
    )
    if _hits(text, _TONE_WEAK) >= 1 or upper_ratio > 0.6:
        return "toxicky", 0.5
    return "neutralni", 0.8


def _topic(text: str) -> tuple[TopicId, float]:
    scored = {
        topic: _cue_confidence(_TOPICS[topic], text)
        for topic in _TOPIC_PRIORITY
    }
    for topic in _TOPIC_PRIORITY:
        if scored[topic] >= HIDE_MIN_CONFIDENCE:
            return topic, scored[topic]
    best = max(_TOPIC_PRIORITY, key=lambda topic: scored[topic])
    if scored[best] > 0:
        return best, scored[best]
    return "jine", 0.8


def _action(
    topic: TopicId,
    topic_confidence: float,
    tone: ToneLabel,
    tone_confidence: float,
    preferences: dict[str, bool],
) -> str:
    topic_selected = topic != "jine" and preferences.get(topic) is True
    tone_selected = tone == "toxicky" and preferences.get(TONE_PREFERENCE) is True
    if (topic_selected and topic_confidence >= HIDE_MIN_CONFIDENCE) or (
        tone_selected and tone_confidence >= HIDE_MIN_CONFIDENCE
    ):
        return "hide"
    if topic_selected or tone_selected:
        return "review"
    return "show"


def _fallback(block_id: str) -> dict[str, object]:
    return {
        "id": block_id,
        "category": "jine",
        "topic": "jine",
        "tone": "neutralni",
        "toxicity_score": 0.0,
        "confidence": 0.0,
        "recommended_action": "review",
    }


def _haystack(block: ContentBlockInput) -> tuple[str, str]:
    original = block.text if not block.title else f"{block.title}\n{block.text}"
    return original, original.casefold()


def classify_block(
    block: ContentBlockInput, preferences: dict[str, bool]
) -> BlockAnalysis:
    original, folded = _haystack(block)
    topic, topic_confidence = _topic(folded)
    tone, tone_confidence = _tone(folded, original)
    candidate: dict[str, object] = {
        "id": block.id,
        "category": topic,
        "topic": topic,
        "tone": tone,
        "toxicity_score": tone_confidence if tone == "toxicky" else 0.0,
        "confidence": topic_confidence,
        "recommended_action": _action(
            topic, topic_confidence, tone, tone_confidence, preferences
        ),
    }
    last_error: ValidationError | None = None
    for _attempt in range(MAX_REPAIR_ATTEMPTS + 1):
        try:
            return BlockAnalysis.model_validate(candidate)
        except ValidationError as exc:
            last_error = exc
            candidate = _fallback(block.id)
    if last_error is None:
        raise RuntimeError("classification failed")
    raise last_error
