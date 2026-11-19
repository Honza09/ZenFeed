"""ZF-33 user test evaluation: median with unfinished tasks, 20 % threshold."""

import math
from pathlib import Path

import pytest
from scripts.evaluate_user_test import (
    compare,
    evaluate,
    load_tasks,
    main,
    median_time,
    summarize_variant,
)

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "docs" / "testing" / "test-uzivatelu" / "zaznam-uloh.csv"
HEADER = TEMPLATE.read_text(encoding="utf-8").strip()


def _record(tmp_path: Path, rows: list[str]) -> Path:
    path = tmp_path / "zaznam.csv"
    path.write_text("\n".join([HEADER, *rows]) + "\n", encoding="utf-8")
    return path


def _row(user: str, order: int, variant: str, page: str, seconds: str, done: str = "ano",
         answers: str = "1,1,1,1", unwanted: str = "ne", language: str = "cs") -> str:
    return f"{user},{order},{variant},{page},{language},{seconds},{done},{answers},{unwanted},"


def test_template_header_is_what_the_script_reads(tmp_path: Path) -> None:
    assert load_tasks(_record(tmp_path, [])) == []


def test_median_ranks_unfinished_last() -> None:
    assert median_time([120, 60, 90]) == 90
    assert median_time([60, math.inf, 90]) == 90  # one failure of three: median still finished
    assert math.isinf(median_time([60, math.inf, math.inf]))  # median falls on a failure
    assert median_time([60, 100]) == 80
    assert math.isinf(median_time([60, math.inf]))
    assert median_time([]) is None


def test_threshold_needs_20_percent_and_answers_not_worse(tmp_path: Path) -> None:
    rows = [
        _row("U01", 1, "A", "T1", "160"), _row("U01", 2, "B", "T2", "200"),
        _row("U02", 1, "B", "T1", "220"), _row("U02", 2, "A", "T2", "150"),
        _row("U03", 1, "A", "T1", "170"), _row("U03", 2, "B", "T2", "210"),
    ]
    report = evaluate(load_tasks(_record(tmp_path, rows)))
    # Median A 160 s, B 210 s: reduction 23.8 %.
    assert report["variants"]["A"]["median_seconds"] == 160
    assert report["a_vs_b"]["reduction"] == pytest.approx(50 / 210)
    assert report["a_vs_b"]["meets_target"] is True
    assert report["a_vs_c"] is None


def test_worse_answers_fail_the_threshold() -> None:
    fast_but_wrong = {"median_seconds": 100.0, "correct_share": 0.5}
    baseline = {"median_seconds": 200.0, "correct_share": 0.75}
    result = compare(fast_but_wrong, baseline)
    assert result["reduction"] == 0.5 and result["answers_not_worse"] is False
    assert result["meets_target"] is False


def test_small_reduction_fails() -> None:
    result = compare({"median_seconds": 180.0, "correct_share": 1.0}, {"median_seconds": 200.0, "correct_share": 1.0})
    assert result["reduction"] == pytest.approx(0.1) and result["meets_target"] is False


def test_unfinished_tool_median_fails_and_counts(tmp_path: Path) -> None:
    rows = [
        _row("U01", 1, "A", "T1", "", done="ne", answers="0,0,0,0"),
        _row("U02", 1, "A", "T1", "", done="ne", answers="1,0,0,0"),
        _row("U03", 1, "A", "T1", "100"),
        _row("U01", 2, "B", "T2", "200"), _row("U02", 2, "B", "T2", "210"), _row("U03", 2, "B", "T2", "190"),
    ]
    report = evaluate(load_tasks(_record(tmp_path, rows)))
    assert report["variants"]["A"]["finished"] == 1
    assert math.isinf(report["variants"]["A"]["median_seconds"])
    assert report["a_vs_b"]["meets_target"] is False


def test_unwanted_content_and_languages(tmp_path: Path) -> None:
    rows = [
        _row("U01", 1, "A", "T1", "100", unwanted="ne"),
        _row("U01", 2, "B", "T2", "150", unwanted="cetl", language="en"),
        _row("U01", 3, "C", "T3", "130", unwanted="zminka"),
    ]
    report = evaluate(load_tasks(_record(tmp_path, rows)))
    assert report["variants"]["B"]["read_unwanted"] == 1
    assert report["variants"]["C"]["met_unwanted"] == 1 and report["variants"]["C"]["read_unwanted"] == 0
    assert set(report["languages"]) == {"cs", "en"}
    assert set(report["languages"]["en"]) == {"B"}


@pytest.mark.parametrize(
    "row, message",
    [
        (_row("U01", 1, "D", "T1", "100"), "variant"),
        (_row("U01", 1, "A", "T1", "100", done="mozna"), "dokonceno"),
        (_row("U01", 1, "A", "T1", "", done="ano"), "cas_s"),
        (_row("U01", 1, "A", "T1", "-5"), "positive"),
        (_row("U01", 1, "A", "T1", "100", answers="1,2,1,1"), "0 or 1"),
        (_row("U01", 1, "A", "T1", "100", unwanted="trochu"), "nechteny_obsah"),
    ],
)
def test_bad_rows_are_rejected(tmp_path: Path, row: str, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        load_tasks(_record(tmp_path, [row]))


def test_same_page_twice_is_rejected(tmp_path: Path) -> None:
    rows = [_row("U01", 1, "A", "T1", "100"), _row("U01", 2, "B", "T1", "120")]
    with pytest.raises(ValueError, match="same page twice"):
        load_tasks(_record(tmp_path, rows))


def test_summary_of_empty_answers() -> None:
    assert summarize_variant([])["correct_share"] is None


def test_cli(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    record = _record(tmp_path, [_row("U01", 1, "A", "T1", "100"), _row("U01", 2, "B", "T2", "200")])
    main([str(record)])
    output = capsys.readouterr().out
    assert "median reduction 50.0 %" in output and "threshold met: yes" in output
    with pytest.raises(SystemExit):
        main([str(_record(tmp_path, []))])
