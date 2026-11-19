"""ZF-20 metrics from an annotation CSV, by the frozen method (ZF-27).

A case is one page under one setting (S1-S4). The main number is the case
definition B of ``docs/testing/metodika-hodnoceni.md`` §b.2: a case is right
when no block is hidden by mistake and no wanted hide is missed. It is
compared with the 80 % target and reported for all cases, for cases with at
least one block to hide ("with target") and without, and per language with a
95 % Wilson interval. Block level numbers (accuracy, precision, recall, F1)
are secondary. ``review`` leaves a block visible, so it counts as not hidden;
how many wanted hides ended as ``review`` is reported apart (§b.4).

With two raters' files it also gives agreement and Cohen's kappa per field:
topic, tone and the hide decision per setting derived from them (§e).

The classifier input is the identification excerpt in the CSV, not the full
block on the page, as in ``measure_lexicon.py``. Usage from the repository
root::

    PYTHONPATH=backend python backend/scripts/evaluate_metrics.py docs/testing/pilot/anotace.csv
    PYTHONPATH=backend python backend/scripts/evaluate_metrics.py gold.csv \\
        --lang P01=en --lang P06=cs --rater-a a.csv --rater-b b.csv --json out.json

Run it on the final set (ZF-19) once, after the split is fixed; the final part
must not be used for tuning (§f).
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from collections.abc import Callable, Iterable
from dataclasses import asdict, dataclass, field
from pathlib import Path

from scripts.measure_lexicon import SETTINGS, TONE_TO_ID, TOPIC_TO_ID

from app.schemas import ContentBlockInput
from app.services.classify import MODEL_VERSION, classify_block

TARGET = 0.8
TONE_COLUMNS = ("tón_vyhrocený", "tón")
LANGUAGE_COLUMN = "jazyk"
UNKNOWN_LANGUAGE = "neuvedeno"


@dataclass
class GoldBlock:
    page_id: str
    block_id: str
    text: str
    topic: str
    tone: str
    expected: dict[str, bool]
    language: str = UNKNOWN_LANGUAGE


@dataclass
class Case:
    page_id: str
    setting: str
    language: str
    tp: int = 0
    fp: int = 0
    fn: int = 0
    tn: int = 0
    review_missed: int = 0
    false_hide_ids: list[str] = field(default_factory=list)
    missed_ids: list[str] = field(default_factory=list)

    @property
    def has_target(self) -> bool:
        return self.tp + self.fn > 0

    @property
    def correct(self) -> bool:
        return self.fp == 0 and self.fn == 0


def wilson(successes: int, total: int, z: float = 1.959964) -> tuple[float, float] | None:
    """95 % Wilson score interval for a proportion; None for no cases."""
    if total == 0:
        return None
    share = successes / total
    denominator = 1 + z * z / total
    centre = (share + z * z / (2 * total)) / denominator
    margin = z * math.sqrt(share * (1 - share) / total + z * z / (4 * total * total)) / denominator
    return max(0.0, centre - margin), min(1.0, centre + margin)


def cohen_kappa(first: list[str], second: list[str]) -> float | None:
    """Cohen's kappa; None when the expected agreement is 1 (one class only)."""
    if len(first) != len(second):
        raise ValueError("both raters need the same number of labels")
    total = len(first)
    if total == 0:
        return None
    observed = sum(a == b for a, b in zip(first, second, strict=True)) / total
    labels = set(first) | set(second)
    expected = sum((first.count(label) / total) * (second.count(label) / total) for label in labels)
    if expected >= 1:
        return None
    return (observed - expected) / (1 - expected)


def derived_hide(topic: str, tone: str, setting: str) -> bool:
    """Hide decision that follows from topic and tone (docs/kategorie-mvp.md)."""
    preferences = SETTINGS[setting]
    return bool(preferences.get(topic)) or (tone == "toxicky" and bool(preferences.get("toxicky")))


def _setting_columns(header: list[str]) -> dict[str, str]:
    columns = {}
    for key in SETTINGS:
        matches = [name for name in header if name.startswith(key + "_")]
        if len(matches) != 1:
            raise ValueError(f"expected one column for {key}, found {matches}")
        columns[key] = matches[0]
    return columns


def _tone(row: dict[str, str]) -> str:
    for column in TONE_COLUMNS:
        if row.get(column):
            return TONE_TO_ID[row[column]]
    raise ValueError(f"row {row.get('block_id')} has no tone")


def load_gold(path: Path, languages: dict[str, str] | None = None) -> list[GoldBlock]:
    """Resolved annotations with S1-S4 columns (H = hide, K = keep)."""
    languages = languages or {}
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError(f"{path} has no header")
        columns = _setting_columns(list(reader.fieldnames))
        blocks = []
        for row in reader:
            marks = {key: row[column].strip() for key, column in columns.items()}
            unknown = {mark for mark in marks.values() if mark not in {"H", "K"}}
            if unknown:
                raise ValueError(f"{row['block_id']}: setting marks must be H or K, got {sorted(unknown)}")
            page_id = row["page_id"]
            blocks.append(GoldBlock(
                page_id=page_id,
                block_id=row["block_id"],
                text=row["úryvek_pro_identifikaci"],
                topic=TOPIC_TO_ID[row["téma"]],
                tone=_tone(row),
                expected={key: mark == "H" for key, mark in marks.items()},
                language=languages.get(page_id) or row.get(LANGUAGE_COLUMN) or UNKNOWN_LANGUAGE,
            ))
    return blocks


def load_rater(path: Path) -> dict[str, tuple[str, str]]:
    """One rater's labels: block_id -> (topic, tone)."""
    with path.open(newline="", encoding="utf-8") as handle:
        return {row["block_id"]: (TOPIC_TO_ID[row["téma"]], _tone(row)) for row in csv.DictReader(handle)}


Predict = Callable[[GoldBlock, dict[str, bool]], str]


def lexicon_action(block: GoldBlock, preferences: dict[str, bool]) -> str:
    judged = classify_block(ContentBlockInput(id="zf-0", text=block.text, kind="article"), preferences)
    return judged.recommended_action


def build_cases(blocks: Iterable[GoldBlock], predict: Predict = lexicon_action) -> list[Case]:
    cases: dict[tuple[str, str], Case] = {}
    for block in blocks:
        for setting, preferences in SETTINGS.items():
            case = cases.setdefault(
                (block.page_id, setting), Case(page_id=block.page_id, setting=setting, language=block.language)
            )
            action = predict(block, preferences)
            hidden = action == "hide"
            wanted = block.expected[setting]
            if wanted and hidden:
                case.tp += 1
            elif wanted:
                case.fn += 1
                case.missed_ids.append(block.block_id)
                case.review_missed += int(action == "review")
            elif hidden:
                case.fp += 1
                case.false_hide_ids.append(block.block_id)
            else:
                case.tn += 1
    return list(cases.values())


def _ratio(numerator: int, denominator: int) -> float | None:
    return numerator / denominator if denominator else None


def summarize(cases: list[Case]) -> dict:
    tp = sum(case.tp for case in cases)
    fp = sum(case.fp for case in cases)
    fn = sum(case.fn for case in cases)
    tn = sum(case.tn for case in cases)
    correct = sum(case.correct for case in cases)
    precision = _ratio(tp, tp + fp)
    recall = _ratio(tp, tp + fn)
    f1 = None
    if precision is not None and recall is not None and precision + recall > 0:
        f1 = 2 * precision * recall / (precision + recall)
    rate = _ratio(correct, len(cases))
    return {
        "cases": len(cases),
        "correct_cases": correct,
        "preference_respect": rate,
        "wilson_95": wilson(correct, len(cases)),
        "meets_target": None if rate is None else rate >= TARGET,
        "block_accuracy": _ratio(tp + tn, tp + tn + fp + fn),
        "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "false_hides": fp,
        "missed_hides": fn,
        "missed_as_review": sum(case.review_missed for case in cases),
        "cases_with_false_hide": sum(case.fp > 0 for case in cases),
    }


def evaluate(blocks: list[GoldBlock], predict: Predict = lexicon_action) -> dict:
    cases = build_cases(blocks, predict)
    groups = {
        "all": cases,
        "with_target": [case for case in cases if case.has_target],
        "without_target": [case for case in cases if not case.has_target],
    }
    for language in sorted({case.language for case in cases}):
        groups[f"language:{language}"] = [case for case in cases if case.language == language]
    for setting in SETTINGS:
        groups[f"setting:{setting}"] = [case for case in cases if case.setting == setting]
    inconsistent = [
        f"{block.block_id}:{setting}"
        for block in blocks
        for setting in SETTINGS
        if block.expected[setting] != derived_hide(block.topic, block.tone, setting)
    ]
    return {
        "model_version": MODEL_VERSION,
        "pages": len({block.page_id for block in blocks}),
        "blocks": len(blocks),
        "groups": {name: summarize(group) for name, group in groups.items()},
        "wrong_cases": [
            {**asdict(case), "correct": case.correct} for case in cases if not case.correct
        ],
        "marks_not_matching_labels": inconsistent,
    }


def agreement(first: dict[str, tuple[str, str]], second: dict[str, tuple[str, str]]) -> dict:
    shared = sorted(set(first) & set(second))
    fields: dict[str, tuple[list[str], list[str]]] = {
        "topic": ([first[block][0] for block in shared], [second[block][0] for block in shared]),
        "tone": ([first[block][1] for block in shared], [second[block][1] for block in shared]),
    }
    for setting in SETTINGS:
        fields[f"hide:{setting}"] = (
            [str(derived_hide(*first[block], setting)) for block in shared],
            [str(derived_hide(*second[block], setting)) for block in shared],
        )
    result: dict = {
        "blocks": len(shared),
        "only_in_first": sorted(set(first) - set(second)),
        "only_in_second": sorted(set(second) - set(first)),
        "fields": {},
    }
    for name, (labels_a, labels_b) in fields.items():
        same = sum(a == b for a, b in zip(labels_a, labels_b, strict=True))
        result["fields"][name] = {
            "agreement": _ratio(same, len(shared)),
            "kappa": cohen_kappa(labels_a, labels_b),
            "classes": sorted(set(labels_a) | set(labels_b)),
        }
    return result


def _pct(value: float | None) -> str:
    return "–" if value is None else f"{100 * value:.1f} %"


def render(report: dict, agreed: dict | None = None) -> str:
    lines = [
        (
            f"ZF-20 metrics, {report['model_version']}: {report['pages']} pages, {report['blocks']} blocks, "
            f"{report['groups']['all']['cases']} cases (page x setting)"
        ),
        "",
        (
            "| Group | Cases | Right (B) | 95 % Wilson | >= 80 % | Block acc. | Precision | Recall | F1 "
            "| False hides | Missed (review) |"
        ),
        "|---|---:|---:|---|---|---:|---:|---:|---:|---:|---:|",
    ]
    for name, group in report["groups"].items():
        interval = group["wilson_95"]
        interval_text = "–" if interval is None else f"{_pct(interval[0])} – {_pct(interval[1])}"
        meets = {None: "–", True: "yes", False: "no"}[group["meets_target"]]
        lines.append(
            f"| {name} | {group['cases']} | {group['correct_cases']} ({_pct(group['preference_respect'])}) "
            f"| {interval_text} | {meets} | {_pct(group['block_accuracy'])} | {_pct(group['precision'])} "
            f"| {_pct(group['recall'])} | {_pct(group['f1'])} | {group['false_hides']} "
            f"| {group['missed_hides']} ({group['missed_as_review']}) |"
        )
    if report["wrong_cases"]:
        lines += ["", "Wrong cases:"]
        for case in report["wrong_cases"]:
            lines.append(
                f"- {case['page_id']} {case['setting']}: TP {case['tp']} FP {case['fp']} FN {case['fn']}"
                + (f"; false hide {', '.join(case['false_hide_ids'])}" if case["false_hide_ids"] else "")
                + (f"; missed {', '.join(case['missed_ids'])}" if case["missed_ids"] else "")
            )
    if report["marks_not_matching_labels"]:
        lines += ["", "S1-S4 marks that do not follow from topic and tone (check the annotation): "
                  + ", ".join(report["marks_not_matching_labels"])]
    if agreed is not None:
        lines += [
            "",
            (
                f"Rater agreement on {agreed['blocks']} shared blocks"
                f" (only in A: {len(agreed['only_in_first'])}, only in B: {len(agreed['only_in_second'])}):"
            ),
            "",
            "| Field | Agreement | Cohen's kappa |",
            "|---|---:|---:|",
        ]
        for name, values in agreed["fields"].items():
            kappa = "undefined (one class)" if values["kappa"] is None else f"{values['kappa']:.2f}"
            lines.append(f"| {name} | {_pct(values['agreement'])} | {kappa} |")
    return "\n".join(lines)


def _languages(pairs: list[str]) -> dict[str, str]:
    languages = {}
    for pair in pairs:
        page, separator, language = pair.partition("=")
        if not separator or not page or language not in {"cs", "en"}:
            raise argparse.ArgumentTypeError(f"--lang needs PAGE=cs or PAGE=en, got {pair!r}")
        languages[page] = language
    return languages


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("gold", type=Path, help="resolved annotation CSV with S1-S4 columns")
    parser.add_argument("--lang", action="append", default=[], help="page language, e.g. P01=en (repeat)")
    parser.add_argument("--rater-a", type=Path, help="first rater's CSV (block_id, téma, tón)")
    parser.add_argument("--rater-b", type=Path, help="second rater's CSV")
    parser.add_argument("--json", type=Path, help="also save the full report as JSON")
    args = parser.parse_args(argv)
    if (args.rater_a is None) != (args.rater_b is None):
        parser.error("--rater-a and --rater-b go together")
    try:
        languages = _languages(args.lang)
    except argparse.ArgumentTypeError as error:
        parser.error(str(error))
    report = evaluate(load_gold(args.gold, languages))
    agreed = agreement(load_rater(args.rater_a), load_rater(args.rater_b)) if args.rater_a else None
    print(render(report, agreed))
    if args.json:
        args.json.write_text(
            json.dumps({"report": report, "agreement": agreed}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
