"""ZF-20 metrics script: definitions from docs/testing/metodika-hodnoceni.md."""

import json
from pathlib import Path

import pytest
from scripts.evaluate_metrics import (
    GoldBlock,
    agreement,
    build_cases,
    cohen_kappa,
    derived_hide,
    evaluate,
    load_gold,
    load_rater,
    main,
    model_predictor,
    summarize,
    wilson,
)
from scripts.measure_lexicon import evaluate as measure_lexicon

ROOT = Path(__file__).resolve().parents[2]
PILOT = ROOT / "docs" / "testing" / "pilot"
HEADER = (
    "page_id,block_id,typ_bloku,locator,úryvek_pro_identifikaci,téma,tón_vyhrocený,jistota,"
    "S1_skrýt_válka+pol.konflikty,S2_skrýt_úmrtí+katastrofa,S3_skrýt_vyhrocený_tón,S4_skrýt_násilí,poznámka"
)


def _block(block_id: str, page: str = "X01", hide: str = "", language: str = "en") -> GoldBlock:
    return GoldBlock(
        page_id=page, block_id=block_id, text="", topic="jine", tone="neutralni",
        expected={key: key in hide.split(",") for key in ("S1", "S2", "S3", "S4")}, language=language,
    )


def _predict(actions: dict[tuple[str, str], str]):
    # Fake classifier: (block_id, setting) -> action; the setting is found by its preferences.
    settings = {
        frozenset({"valka", "politicke_konflikty"}): "S1",
        frozenset({"umrti", "katastrofy"}): "S2",
        frozenset({"toxicky"}): "S3",
        frozenset({"nasili"}): "S4",
    }

    def predict(block, preferences):
        return actions.get((block.block_id, settings[frozenset(preferences)]), "show")

    return predict


def test_wilson_interval() -> None:
    low, high = wilson(20, 24)
    assert low == pytest.approx(0.641, abs=0.001)
    assert high == pytest.approx(0.933, abs=0.001)
    assert wilson(0, 3)[1] == pytest.approx(0.5615, abs=0.0001)
    assert wilson(5, 5)[1] == 1.0
    assert wilson(0, 0) is None


def test_cohen_kappa() -> None:
    # 232 blocks: 218 both neutral, 10 both toxic, 4 toxic vs neutral (worked by hand: 0.8245).
    first = ["n"] * 218 + ["t"] * 10 + ["t"] * 4
    second = ["n"] * 218 + ["t"] * 10 + ["n"] * 4
    assert cohen_kappa(first, second) == pytest.approx(0.8245, abs=0.0001)
    assert cohen_kappa(["a", "b"], ["a", "b"]) == 1.0
    assert cohen_kappa(["n", "n"], ["n", "n"]) is None  # one class: undefined
    assert cohen_kappa([], []) is None
    with pytest.raises(ValueError):
        cohen_kappa(["a"], ["a", "b"])


def test_case_counts_and_review_counts_as_not_hidden() -> None:
    blocks = [_block("b1", hide="S1"), _block("b2", hide="S1"), _block("b3"), _block("b4")]
    predict = _predict({("b1", "S1"): "hide", ("b2", "S1"): "review", ("b3", "S1"): "hide"})
    case = next(case for case in build_cases(blocks, predict) if case.setting == "S1")
    assert (case.tp, case.fp, case.fn, case.tn) == (1, 1, 1, 1)
    assert case.review_missed == 1
    assert case.false_hide_ids == ["b3"] and case.missed_ids == ["b2"]
    assert not case.correct and case.has_target


def test_case_definition_b_and_groups() -> None:
    blocks = [
        _block("a1", page="A", hide="S1"),
        _block("a2", page="A"),
        _block("c1", page="C", language="cs"),
    ]
    predict = _predict({("a1", "S1"): "hide", ("c1", "S2"): "hide"})
    report = evaluate(blocks, predict)
    groups = report["groups"]
    # 2 pages x 4 settings; wrong only C S2 (a false hide on a page without target).
    assert groups["all"]["cases"] == 8 and groups["all"]["correct_cases"] == 7
    assert groups["all"]["meets_target"] is True
    assert groups["with_target"]["cases"] == 1 and groups["with_target"]["correct_cases"] == 1
    assert groups["without_target"]["false_hides"] == 1
    assert groups["language:cs"]["correct_cases"] == 3
    assert groups["with_target"]["precision"] == 1.0 and groups["with_target"]["recall"] == 1.0
    assert [(case["page_id"], case["setting"]) for case in report["wrong_cases"]] == [("C", "S2")]


def test_undefined_rates_are_none() -> None:
    summary = summarize([])
    assert summary["preference_respect"] is None and summary["meets_target"] is None
    assert summary["precision"] is None and summary["f1"] is None


def test_derived_hide_follows_the_categories() -> None:
    assert derived_hide("valka", "neutralni", "S1")
    assert derived_hide("politicke_konflikty", "neutralni", "S1")
    assert not derived_hide("valka", "neutralni", "S2")
    assert derived_hide("jine", "toxicky", "S3")
    assert not derived_hide("jine", "toxicky", "S1")
    assert derived_hide("nasili", "neutralni", "S4")


def test_load_gold_checks_marks_and_reads_language(tmp_path: Path) -> None:
    good = tmp_path / "gold.csv"
    good.write_text(HEADER + "\nX1,X1-B001,p,div,text,válka,neutrální,J,H,K,K,K,\n", encoding="utf-8")
    [block] = load_gold(good, {"X1": "cs"})
    assert block.language == "cs" and block.expected["S1"] and not block.expected["S2"]
    assert load_gold(good)[0].language == "neuvedeno"
    bad = tmp_path / "bad.csv"
    bad.write_text(HEADER + "\nX1,X1-B001,p,div,text,válka,neutrální,J,ano,K,K,K,\n", encoding="utf-8")
    with pytest.raises(ValueError, match="H or K"):
        load_gold(bad)


def test_marks_that_contradict_labels_are_listed(tmp_path: Path) -> None:
    gold = tmp_path / "gold.csv"
    gold.write_text(HEADER + "\nX1,X1-B001,p,div,text,jiné,neutrální,J,H,K,K,K,\n", encoding="utf-8")
    assert evaluate(load_gold(gold), _predict({}))["marks_not_matching_labels"] == ["X1-B001:S1"]


def test_pilot_matches_the_lexicon_measurement() -> None:
    # Same input and classifier as measure_lexicon.py, so the hide counts must agree.
    report = evaluate(load_gold(PILOT / "anotace.csv"))
    baseline = measure_lexicon(PILOT / "anotace.csv")
    for setting in ("S1", "S2", "S3", "S4"):
        group = report["groups"][f"setting:{setting}"]
        score = baseline.settings[setting]
        assert (group["tp"], group["fp"], group["fn"]) == (score.true_hide, score.false_hide, score.missed_hide)
    assert report["groups"]["all"]["cases"] == 24
    assert report["groups"]["with_target"]["cases"] == 3  # P01 S1, P04 S2, P05 S1 (ZF-27 §a)
    assert report["marks_not_matching_labels"] == []


def test_agreement_on_the_pilot_files() -> None:
    agreed = agreement(load_rater(PILOT / "anotace-libuse.csv"), load_rater(PILOT / "anotace-nezavisla-agent.csv"))
    assert agreed["blocks"] == 232 and not agreed["only_in_first"] and not agreed["only_in_second"]
    assert agreed["fields"]["topic"]["kappa"] == pytest.approx(0.97, abs=0.005)
    assert agreed["fields"]["tone"]["kappa"] == pytest.approx(0.8245, abs=0.0001)


def test_cli_writes_json_and_needs_both_raters(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    out = tmp_path / "report.json"
    main([str(PILOT / "anotace.csv"), "--lang", "P06=cs", "--json", str(out)])
    assert "| all | 24 |" in capsys.readouterr().out
    saved = json.loads(out.read_text(encoding="utf-8"))
    assert saved["report"]["groups"]["language:cs"]["cases"] == 4 and saved["agreement"] is None
    with pytest.raises(SystemExit):
        main([str(PILOT / "anotace.csv"), "--rater-a", str(PILOT / "anotace-libuse.csv")])
    with pytest.raises(SystemExit):
        main([str(PILOT / "anotace.csv"), "--lang", "P06=de"])


def test_model_predictor_labels_once_and_decides_per_setting() -> None:
    blocks = [_block("b1", hide="S1"), _block("b2"), _block("b3", hide="S3")]
    for block in blocks:
        block.text = "The garden club planted tulips along the main street."
    calls = []

    class Model:
        def generate_json(self, system, content, schema, tokens, *, timeout_seconds=None, busy_attempts=3):
            calls.append(content)
            return {"blocks": [
                {"id": "b1", "topic": "valka", "topic_confidence": 0.9, "tone": "neutralni", "tone_confidence": 0.9},
                {"id": "b3", "topic": "jine", "topic_confidence": 0.9, "tone": "toxicky", "tone_confidence": 0.8},
            ]}

    predict, fallback = model_predictor(blocks, Model())
    assert len(calls) == 1 and fallback == 1  # b2 had no answer: the lexicon labelled it
    report = evaluate(blocks, predict, "gemini/test")
    assert report["model_version"] == "gemini/test"
    assert report["groups"]["all"]["correct_cases"] == report["groups"]["all"]["cases"]


def test_cli_model_provider_needs_a_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ZENFEED_AI_API_KEY", raising=False)
    monkeypatch.delenv("ZENFEED_ANALYZE_PROVIDER", raising=False)
    with pytest.raises(SystemExit):
        main([str(PILOT / "anotace.csv"), "--provider", "gemini"])
