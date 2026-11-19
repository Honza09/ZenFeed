"""Evaluate the prototype test with users (ZF-33).

Reads the filled copy of ``docs/testing/test-uzivatelu/zaznam-uloh.csv`` and
checks the proposal's threshold: the median time to an overview with ZenFeed
(variant A) is at least 20 % lower than with the usual way (variant B, reading
without a tool), without worse answers. An unfinished task counts as a
failure: it ranks after every finished task, and when the median falls on it
the median is "unfinished" and the threshold is not met. Variant C (a plain
AI chat summary) is compared with A separately, without a threshold.

Usage from the repository root::

    PYTHONPATH=backend python backend/scripts/evaluate_user_test.py zaznam-uloh.csv
"""

from __future__ import annotations

import argparse
import csv
import math
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

TARGET_REDUCTION = 0.2
VARIANTS = ("A", "B", "C")
ANSWER_COLUMNS = ("tema", "info1", "info2", "zaver")
UNWANTED = ("ne", "zminka", "cetl")
UNFINISHED = math.inf


@dataclass
class Task:
    participant: str
    order: int
    variant: str
    page: str
    language: str
    seconds: float  # math.inf when unfinished
    answers: tuple[int, ...]
    unwanted: str

    @property
    def finished(self) -> bool:
        return self.seconds != UNFINISHED


def _int_flag(value: str, column: str, row_number: int) -> int:
    if value.strip() not in {"0", "1"}:
        raise ValueError(f"row {row_number}: {column} must be 0 or 1, got {value!r}")
    return int(value)


def load_tasks(path: Path) -> list[Task]:
    tasks = []
    with path.open(newline="", encoding="utf-8") as handle:
        for row_number, row in enumerate(csv.DictReader(handle), start=2):
            variant = row["varianta"].strip().upper()
            if variant not in VARIANTS:
                raise ValueError(f"row {row_number}: variant must be A, B or C, got {row['varianta']!r}")
            finished = row["dokonceno"].strip().lower()
            if finished not in {"ano", "ne"}:
                raise ValueError(f"row {row_number}: dokonceno must be ano or ne")
            if finished == "ano":
                try:
                    seconds = float(row["cas_s"])
                except ValueError as error:
                    raise ValueError(f"row {row_number}: a finished task needs cas_s in seconds") from error
                if not seconds > 0:
                    raise ValueError(f"row {row_number}: cas_s must be positive")
            else:
                seconds = UNFINISHED
            unwanted = row["nechteny_obsah"].strip().lower()
            if unwanted not in UNWANTED:
                raise ValueError(f"row {row_number}: nechteny_obsah must be one of {UNWANTED}")
            tasks.append(Task(
                participant=row["ucastnik"].strip(),
                order=int(row["poradi"]),
                variant=variant,
                page=row["stranka"].strip(),
                language=row["jazyk"].strip().lower(),
                seconds=seconds,
                answers=tuple(_int_flag(row[column], column, row_number) for column in ANSWER_COLUMNS),
                unwanted=unwanted,
            ))
    pairs = [(task.participant, task.page) for task in tasks]
    if len(pairs) != len(set(pairs)):
        raise ValueError("a participant saw the same page twice; the task cannot be evaluated")
    return tasks


def median_time(seconds: Iterable[float]) -> float | None:
    """Median where unfinished (inf) ranks last; inf if the median is unfinished; None if empty."""
    ordered = sorted(seconds)
    if not ordered:
        return None
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2  # inf when either is unfinished


def summarize_variant(tasks: list[Task]) -> dict:
    answers = [value for task in tasks for value in task.answers]
    return {
        "tasks": len(tasks),
        "finished": sum(task.finished for task in tasks),
        "median_seconds": median_time(task.seconds for task in tasks),
        "times": sorted(task.seconds for task in tasks),
        "correct_answers": sum(answers),
        "answers": len(answers),
        "correct_share": sum(answers) / len(answers) if answers else None,
        "met_unwanted": sum(task.unwanted != "ne" for task in tasks),
        "read_unwanted": sum(task.unwanted == "cetl" for task in tasks),
    }


def compare(tool: dict, baseline: dict) -> dict:
    """Median reduction of `tool` against `baseline` and the answer condition."""
    reduction = None
    tool_median, base_median = tool["median_seconds"], baseline["median_seconds"]
    if tool_median is not None and base_median is not None:
        if math.isinf(tool_median):
            reduction = -math.inf
        elif math.isinf(base_median):
            reduction = math.inf  # the baseline median is a failure, the tool's is not
        else:
            reduction = (base_median - tool_median) / base_median
    not_worse = None
    if tool["correct_share"] is not None and baseline["correct_share"] is not None:
        not_worse = tool["correct_share"] >= baseline["correct_share"]
    meets = None if reduction is None or not_worse is None else reduction >= TARGET_REDUCTION and not_worse
    return {"reduction": reduction, "answers_not_worse": not_worse, "meets_target": meets}


def evaluate(tasks: list[Task]) -> dict:
    by_variant = {variant: [task for task in tasks if task.variant == variant] for variant in VARIANTS}
    variants = {variant: summarize_variant(group) for variant, group in by_variant.items() if group}
    languages = {}
    for language in sorted({task.language for task in tasks}):
        languages[language] = {
            variant: summarize_variant([task for task in group if task.language == language])
            for variant, group in by_variant.items()
            if any(task.language == language for task in group)
        }
    report = {
        "participants": len({task.participant for task in tasks}),
        "tasks": len(tasks),
        "variants": variants,
        "languages": languages,
        "a_vs_b": compare(variants["A"], variants["B"]) if {"A", "B"} <= variants.keys() else None,
        "a_vs_c": compare(variants["A"], variants["C"]) if {"A", "C"} <= variants.keys() else None,
    }
    return report


def _seconds(value: float | None) -> str:
    if value is None:
        return "–"
    return "unfinished" if math.isinf(value) else f"{value:.0f} s"


def _share(value: float | None) -> str:
    if value is None:
        return "–"
    if math.isinf(value):
        return "+inf" if value > 0 else "-inf"
    return f"{100 * value:.1f} %"


def render(report: dict) -> str:
    lines = [
        f"ZF-33 user test: {report['participants']} participants, {report['tasks']} tasks",
        "",
        "| Variant | Tasks | Finished | Median time | Times | Correct answers | Met unwanted (read) |",
        "|---|---:|---:|---:|---|---:|---:|",
    ]
    for variant, data in report["variants"].items():
        times = ", ".join(_seconds(value) for value in data["times"])
        lines.append(
            f"| {variant} | {data['tasks']} | {data['finished']} | {_seconds(data['median_seconds'])} | {times} "
            f"| {data['correct_answers']}/{data['answers']} ({_share(data['correct_share'])}) "
            f"| {data['met_unwanted']} ({data['read_unwanted']}) |"
        )
    for name, label in (("a_vs_b", "A (ZenFeed) vs B (reading, threshold 20 %)"), ("a_vs_c", "A vs C (AI chat)")):
        result = report[name]
        if result is None:
            continue
        meets = {None: "–", True: "yes", False: "no"}[result["meets_target"]]
        lines += [
            "",
            f"{label}: median reduction {_share(result['reduction'])}, "
            f"answers not worse: {result['answers_not_worse']}"
            + (f", threshold met: {meets}" if name == "a_vs_b" else ""),
        ]
    for language, variants in report["languages"].items():
        medians = ", ".join(f"{variant} {_seconds(data['median_seconds'])}" for variant, data in variants.items())
        lines.append(f"language {language}: median {medians}")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("record", type=Path, help="filled copy of zaznam-uloh.csv")
    args = parser.parse_args(argv)
    try:
        tasks = load_tasks(args.record)
    except ValueError as error:
        parser.error(str(error))
    if not tasks:
        parser.error("the record has no tasks")
    print(render(evaluate(tasks)))


if __name__ == "__main__":
    main()
