"""Measure lexicon-1 against pilot annotation excerpts.

The text is the identification snippet in the CSV, not the full block on the
page. Numbers from this script are a baseline for that input only.
"""

from __future__ import annotations

import csv
import time
from dataclasses import dataclass, field
from pathlib import Path

from app.schemas import ContentBlockInput
from app.services.classify import MODEL_VERSION, classify_block

TOPIC_TO_ID = {
    "válka": "valka",
    "politické konflikty": "politicke_konflikty",
    "zprávy o úmrtí": "umrti",
    "katastrofické scénáře": "katastrofy",
    "násilí": "nasili",
    "jiné": "jine",
}
TONE_TO_ID = {
    "neutrální": "neutralni",
    "toxický/vyhrocený": "toxicky",
}
SETTINGS = {
    "S1": {"valka": True, "politicke_konflikty": True},
    "S2": {"umrti": True, "katastrofy": True},
    "S3": {"toxicky": True},
    "S4": {"nasili": True},
}


@dataclass
class SettingScore:
    expected_hide: int = 0
    hidden: int = 0
    true_hide: int = 0
    false_hide: int = 0
    missed_hide: int = 0
    review_instead_of_hide: int = 0


@dataclass
class Baseline:
    name: str
    model_version: str
    rows: int = 0
    topic_correct: int = 0
    tone_correct: int = 0
    certain_rows: int = 0
    certain_topic_correct: int = 0
    duration_ms: float = 0.0
    topic_counts: dict[str, list[int]] = field(default_factory=dict)
    settings: dict[str, SettingScore] = field(default_factory=dict)
    false_hide_ids: list[str] = field(default_factory=list)

    @property
    def per_row_ms(self) -> float:
        if self.rows == 0:
            return 0.0
        return self.duration_ms / self.rows


def _setting_column(header: list[str], prefix: str) -> str:
    matches = [name for name in header if name.startswith(prefix + "_")]
    if len(matches) != 1:
        raise ValueError(f"expected one column for {prefix}, found {matches}")
    return matches[0]


def evaluate(path: Path) -> Baseline:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError(f"{path} has no header")
        columns = {key: _setting_column(list(reader.fieldnames), key) for key in SETTINGS}
        rows = list(reader)

    result = Baseline(name=path.name, model_version=MODEL_VERSION)
    for key in SETTINGS:
        result.settings[key] = SettingScore()
    started = time.perf_counter()
    for index, row in enumerate(rows):
        gold_topic = TOPIC_TO_ID[row["téma"]]
        gold_tone = TONE_TO_ID[row["tón_vyhrocený"]]
        block = ContentBlockInput(
            id=f"b{index}",
            text=row["úryvek_pro_identifikaci"],
            kind="article",
        )
        plain = classify_block(block, {})
        result.rows += 1
        topic_hit = plain.topic == gold_topic
        result.topic_correct += int(topic_hit)
        result.tone_correct += int(plain.tone == gold_tone)
        bucket = result.topic_counts.setdefault(gold_topic, [0, 0])
        bucket[0] += 1
        bucket[1] += int(topic_hit)
        if row["jistota"] == "J":
            result.certain_rows += 1
            result.certain_topic_correct += int(topic_hit)
        for key, preferences in SETTINGS.items():
            judged = classify_block(block, preferences)
            expected_hide = row[columns[key]] == "H"
            score = result.settings[key]
            score.expected_hide += int(expected_hide)
            score.hidden += int(judged.recommended_action == "hide")
            if expected_hide and judged.recommended_action == "hide":
                score.true_hide += 1
            elif expected_hide:
                score.missed_hide += 1
                if judged.recommended_action == "review":
                    score.review_instead_of_hide += 1
            elif judged.recommended_action == "hide":
                score.false_hide += 1
                result.false_hide_ids.append(f"{row['block_id']}:{key}")
    result.duration_ms = (time.perf_counter() - started) * 1000
    return result


def _pct(hit: int, total: int) -> str:
    if total == 0:
        return "n/a"
    return f"{100 * hit / total:.1f} %"


def render(measured: Baseline) -> str:
    lines = [
        f"{measured.name}: {measured.rows} excerpts, {measured.model_version}",
        (
            f"topic {_pct(measured.topic_correct, measured.rows)} "
            f"({measured.topic_correct}/{measured.rows})"
        ),
        (
            f"topic on certain rows {_pct(measured.certain_topic_correct, measured.certain_rows)} "
            f"({measured.certain_topic_correct}/{measured.certain_rows})"
        ),
        (
            f"tone {_pct(measured.tone_correct, measured.rows)} "
            f"({measured.tone_correct}/{measured.rows})"
        ),
        f"time {measured.duration_ms:.1f} ms ({measured.per_row_ms:.3f} ms/row)",
        "topics:",
    ]
    for topic, (total, hit) in sorted(measured.topic_counts.items()):
        lines.append(f"  {topic} {_pct(hit, total)} ({hit}/{total})")
    for key, score in measured.settings.items():
        lines.append(
            f"{key}: expected_hide={score.expected_hide} hidden={score.hidden}"
            f" true_hide={score.true_hide} missed={score.missed_hide}"
            f" review_instead={score.review_instead_of_hide}"
            f" false_hide={score.false_hide}"
        )
    if measured.false_hide_ids:
        lines.append("false hides: " + ", ".join(measured.false_hide_ids))
    return "\n".join(lines)


def main() -> None:
    root = Path(__file__).resolve().parents[2] / "docs" / "testing" / "pilot"
    for name in ("anotace.csv", "anotace-rozsireni.csv"):
        print(render(evaluate(root / name)))
        print()


if __name__ == "__main__":
    main()
