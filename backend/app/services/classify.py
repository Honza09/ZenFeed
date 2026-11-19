"""Topic and tone classification for one block.

This is a local lexicon over the frozen categories in ``docs/kategorie-mvp.md``.
It is not a zero-shot model. Topic and tone are scored separately. A block is
hidden only when a selected preference matches and the score is high enough.
A weak match is ``review``. Uncertain output never hides.
One bare ``war`` or ``wars`` is only a mention (``review``). Two or more,
or any stronger war cue, can hide. Figurative wars ("trade war", "price war")
are not counted.

lexicon-2 adds common inflected forms and phrases for every topic (written
from general language knowledge, not fitted to the annotated sets; see
docs/testing/pilot/lexicon-2.md). Ambiguous words (attack, shooting,
protest, opposition, military) are weak cues: they lead to ``review``, never
to hiding on their own.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from pydantic import ValidationError

from app.schemas import BlockAnalysis, ContentBlockInput, ToneLabel, TopicId

MODEL_VERSION = "lexicon-2"
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
            # lexicon-2
            r"\bdrone strikes?\b",
            r"\bwar crimes?\b",
            r"\bbombard",
            r"\boccupied territor",
            r"\bcounteroffensive",
            r"\bbelligerents?\b",
            r"\bokupa(?:c|č|nt)",
            r"\bbombardov",
            r"\bvojsk",
        ),
        # Ambiguous: "front line workers", "Armáda spásy", "ofenzivní hra".
        weak=_patterns(
            r"\bmilitary\b", r"\boffensive\b", r"\bsoldiers?\b", r"\bfront ?lines?\b", r"\bconflicts?\b",
            r"\bdrones?\b", r"\bvojensk", r"\barmád", r"\bofenziv",
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
            # lexicon-2
            r"\bshot dead\b",
            r"\bshot and killed\b",
            r"\bgunm(?:an|en)\b",
            r"\bmass shooting",
            r"\bstabbing",
            r"\bhostages?\b",
            r"\bkidnapp",
            r"\babduct",
            r"\bmassacre",
            r"\bhomicide",
            r"\bmanslaughter",
            r"\blynch(?:ing|ed)\b|\blynch mob",
            r"\bbomb(?:ing|ings|ed)\b",
            r"\bterror(?:ist)? attack",
            r"\bzastřel",
            r"\bstřelb",
            r"\bútočník",
            r"\brukojm",
            r"\bunesl",
            r"\búnos(?:u|em|ce|ci)?\b",
            r"\bmasakr",
            r"\bzbil",
            r"\bubodal",
            r"\bubit",
            r"\bzabil",
        ),
        weak=_patterns(r"\battack(?:ed|er|ers)?\b", r"\bshooting\b", r"\bútok", r"\bbrutál"),
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
            # lexicon-2
            r"\blandslides?\b",
            r"\bavalanche",
            r"\btyphoon",
            r"\bcyclone",
            r"\btornado",
            r"\bfamine",
            r"\berupt(?:ion|ed|s)\b",
            r"\bnatural disaster",
            r"\bchemical (?:spill|leak|disaster)",
            # The noun only; "katastrofální výkon" is figurative.
            r"\bkatastrof(?:a|y|ě|u|ou|ám|ách)\b",
            r"\bsesuv",
            r"\blavin",
            r"\btajfun",
            r"\btornád",
            r"\bhladomor",
            r"\berupc",
            r"\blesní požár",
        ),
        # "since the pandemic" is a mention, not a catastrophe report; a drought
        # is often a slow trend ("dlouhodobý trend bez varování = jiné").
        weak=_patterns(
            r"\bdrought", r"\bsuch(?:o|a)\b",
            r"\bdisaster", r"\boutbreak", r"\bevacuat", r"\bevakua",
            r"\bepidemic", r"\bpandemic", r"\bepidemi", r"\bpandemi",
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
            # lexicon-2
            r"\bdies\b",
            r"\bdead\b",
            r"\bdeath toll",
            r"\bpassed away",
            r"\blost their lives",
            r"\bfuneral",
            r"\bzemře",
            r"\bzesnul",
            r"\bpohřb|\bpohřeb",
            r"\bmrtv",
            r"\bpřišl[aio]? o život",
            r"\bpočet obětí",
            # Death statistics and trends belong here (docs/kategorie-mvp.md, decision D).
            r"\bmortality\b",
            r"\búmrtnost",
            r"\bsmrt(?:i|í)?\b",
        ),
        weak=_patterns(r"\bvictims?\b", r"\boběti?\b", r"\bfatal\b"),
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
            # lexicon-2
            r"\bno-confidence\b|\bno confidence vote",
            r"\bpolitical crisis",
            r"\bexpell?ed (?:the )?(?:ambassador|diplomats?)",
            r"\bgovernment collapse",
            r"\bcoup\b",
            r"\bnedůvě[rř]",  # nedůvěra, o nedůvěře
            r"\bpolitick(?:á|é|ou) kriz",
            r"\bvyhoštěn",
            r"\bpuč",
            r"\bvládní kriz",
        ),
        weak=_patterns(r"\bprotest", r"\bopposition\b", r"\bopozic", r"\bresign", r"\bdemis"),
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


# One "war" or "wars" is a mention, not proof the block is about war.
# Two or more reach the hide threshold. Stronger war cues are unchanged.
_BARE_WAR = _patterns(r"\bwars?\b")
# Figurative uses are removed before counting (lexicon-2).
_FIGURATIVE_WAR = re.compile(
    r"\b(?:trade|price|culture|tariff|bidding|talent|format|console|browser|flame|star) wars?\b"
    r"|\bwar on (?:drugs|poverty|terror)\b"
    r"|\bobchodní válk|\bcenov(?:á|é|ou) válk|\bkulturní válk"
)


def _topic(text: str) -> tuple[TopicId, float]:
    text = _FIGURATIVE_WAR.sub(" ", text)
    scored = {
        topic: _cue_confidence(_TOPICS[topic], text)
        for topic in _TOPIC_PRIORITY
    }
    bare_war = _hits(text, _BARE_WAR)
    if bare_war and scored["valka"] < HIDE_MIN_CONFIDENCE:
        scored["valka"] = 0.8 if bare_war >= 2 else 0.5
    # Válka has priority even when the only cue is one "war"/"wars". That
    # mention is below the hide threshold, so the block stays visible
    # (review) instead of being taken over by a stronger cue such as "death".
    war_named = bare_war > 0 or _hits(text, _TOPICS["valka"].strong) > 0
    if scored["valka"] > 0 and war_named:
        return "valka", scored["valka"]
    # The weak war cues of lexicon-2 (conflict, military, soldiers, …) alone
    # do not take over another topic. Deaths in a conflict are war deaths
    # (docs/kategorie-mvp.md: cause before consequence), so a strong death
    # cue next to a weak war cue makes a war block as sure as the death cue:
    # hidden when war is selected, not when only death news is. Violence and
    # catastrophes come before death in the priority, so they keep their block.
    if (
        scored["valka"] > 0
        and scored["umrti"] >= HIDE_MIN_CONFIDENCE
        and scored["nasili"] < HIDE_MIN_CONFIDENCE
        and scored["katastrofy"] < HIDE_MIN_CONFIDENCE
    ):
        return "valka", scored["umrti"]
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
