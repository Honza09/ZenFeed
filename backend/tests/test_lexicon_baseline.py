"""Lexicon-1 on the annotation excerpts shipped in the repo.

Input is the identification snippet, not the full block text from the page.
Overall accuracy is dominated by rows labelled ``jiné``. The useful number is
accuracy on the other topics, and how often a block is hidden by mistake.
"""

from pathlib import Path

from scripts.measure_lexicon import evaluate

ROOT = Path(__file__).resolve().parents[2]
PILOT = ROOT / "docs" / "testing" / "pilot" / "anotace.csv"
EXTRA = ROOT / "docs" / "testing" / "pilot" / "anotace-rozsireni.csv"


def _other_topic_hits(measured) -> tuple[int, int]:
    total = 0
    hit = 0
    for topic, (count, correct) in measured.topic_counts.items():
        if topic == "jine":
            continue
        total += count
        hit += correct
    return hit, total


def test_pilot_baseline_counts() -> None:
    measured = evaluate(PILOT)

    assert measured.rows == 89
    assert measured.model_version == "lexicon-1"
    assert measured.topic_correct == 82
    assert measured.certain_rows == 76
    assert measured.certain_topic_correct == 73
    assert measured.tone_correct == 89
    assert _other_topic_hits(measured) == (4, 11)
    assert measured.settings["S1"].false_hide == 0
    assert measured.settings["S1"].true_hide == 3
    assert measured.settings["S1"].missed_hide == 5
    assert measured.settings["S2"].false_hide == 2
    assert measured.settings["S2"].true_hide == 1
    assert measured.false_hide_ids == ["P01-B001:S2", "P01-B004:S2"]
    assert measured.duration_ms < 2000


def test_extended_baseline_counts() -> None:
    measured = evaluate(EXTRA)

    assert measured.rows == 143
    assert measured.topic_correct == 79
    assert measured.certain_rows == 93
    assert measured.certain_topic_correct == 58
    assert measured.tone_correct == 135
    assert _other_topic_hits(measured) == (24, 88)
    assert measured.topic_counts["nasili"] == [13, 0]
    assert measured.settings["S1"].false_hide == 0
    assert measured.settings["S2"].false_hide == 4
    assert measured.settings["S4"].false_hide == 1
    assert measured.settings["S3"].true_hide == 6
    assert measured.duration_ms < 2000
